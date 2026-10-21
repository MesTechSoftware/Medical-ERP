import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db";
import { iadeYaz } from "@/lib/iade";
import { blokKarariVer } from "@/lib/onay-blogu";
import { sevkiyatYaz } from "@/lib/sevkiyat";
import { referansVeri, yeniDoktorVerisi } from "../../test/integration/referans";

// D-1-1 — olay noktaları akışlarda çağrılır; işleyiciler Faz 1'de boştur.
const olay = vi.hoisted(() => ({
  onBlokAcildi: vi.fn(),
  onBlokKararaBaglandi: vi.fn(),
  onSevkiyatTamamlandi: vi.fn(),
  onIadeKaydedildi: vi.fn(),
}));
vi.mock("@/lib/olaylar", () => olay);

let s: Awaited<ReturnType<typeof seed>>;
async function seed() {
  const ref = await referansVeri();
  const y = await prisma.user.create({ data: { name: "Y", email: "y@medikal.local", passwordHash: "x", role: "YONETICI" } });
  const o = await prisma.user.create({ data: { name: "O", email: "o@medikal.local", passwordHash: "x", role: "OPERASYON" } });
  const doktor = await prisma.doctor.create({ data: yeniDoktorVerisi() });
  const urun = await prisma.product.create({ data: { name: "Stent", code: "MED-1", taxRateId: ref.kdv20.id } });
  const siparis = await prisma.order.create({
    data: {
      documentNo: "SIP-O",
      doctorId: doktor.id,
      stage: "ONAYLI",
      status: "HAZIRLANIYOR",
      paymentTermDays: 30,
      items: { create: [{ productId: urun.id, quantity: 4, listPrice: "10", unitPrice: "10", vatRate: "20" }] },
    },
    include: { items: true },
  });
  return { y, o, siparis };
}
beforeEach(async () => {
  for (const f of Object.values(olay)) f.mockClear();
  s = await seed();
});
const sevk = (miktar: number, yapan: { id: string; rol: "YONETICI" | "OPERASYON" }, gerekce: string | null) =>
  prisma.$transaction((tx) =>
    sevkiyatYaz(tx, {
      siparisId: s.siparis.id,
      kalemler: [{ siparisKalemiId: s.siparis.items[0].id, miktar }],
      carrierId: null,
      trackingNumber: null,
      externalDispatchNo: null,
      yapan,
      gerekce,
    })
  );

describe("bildirim olay noktaları (D-1-1)", () => {
  it("blok açılınca, karara bağlanınca, sevkiyat ve iade yazılınca ilgili olay çağrılır", async () => {
    // Stok yok: operasyonun gerekçesi bloğu açar (karar yok).
    await sevk(2, { id: s.o.id, rol: "OPERASYON" }, "Acil");
    expect(olay.onBlokAcildi).toHaveBeenCalledWith({ belgeTipi: "SIP", belgeId: s.siparis.id, kuralKodu: "NEGATIF_STOK" });
    expect(olay.onBlokKararaBaglandi).not.toHaveBeenCalled();
    expect(olay.onSevkiyatTamamlandi).not.toHaveBeenCalled();

    const blok = await prisma.approvalBlock.findFirstOrThrow();
    await prisma.$transaction((tx) => blokKarariVer(tx, { blokId: blok.id, karar: "ONAY", not: "Tamam", yapanId: s.y.id }));
    expect(olay.onBlokKararaBaglandi).toHaveBeenCalledWith({ blokId: blok.id, karar: "ONAY" });

    const r = await sevk(4, { id: s.o.id, rol: "OPERASYON" }, null);
    expect(olay.onSevkiyatTamamlandi).toHaveBeenCalledWith({ sevkiyatId: r.durum === "SEVK_EDILDI" ? r.sevkiyatId : "", siparisId: s.siparis.id, siparisTamamlandi: true });

    const iade = await prisma.$transaction((tx) =>
      iadeYaz(tx, { siparisId: s.siparis.id, kalemler: [{ siparisKalemiId: s.siparis.items[0].id, miktar: 1 }], sebep: "x", yapanId: s.y.id })
    );
    expect(olay.onIadeKaydedildi).toHaveBeenCalledWith({ iadeId: iade.iadeId, siparisId: s.siparis.id });
  });
});
