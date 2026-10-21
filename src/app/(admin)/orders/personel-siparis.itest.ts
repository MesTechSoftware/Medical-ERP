import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db";
import { degistirDoktorSahibi } from "@/lib/sahiplik";
import { sevkiyatYaz } from "@/lib/sevkiyat";
import { referansVeri, yeniDoktorVerisi } from "../../../../test/integration/referans";

// X-8-3 — personel sipariş girişi: her cariye; satıcı sipariş anındaki sahip, bayide yok; bayi listesi.
const h = vi.hoisted(() => ({ kullanici: { id: "", role: "OPERASYON" as "OPERASYON" | "YONETICI" } }));
vi.mock("@/lib/session", () => ({ requireStaff: async () => ({ user: h.kullanici }) }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("next/navigation", () => ({ redirect: () => {} }));
const { createStaffOrder } = await import("./actions");

let s: Awaited<ReturnType<typeof seed>>;
async function seed() {
  const ref = await referansVeri();
  const op = await prisma.user.create({ data: { name: "O", email: "o@medikal.local", passwordHash: "x", role: "OPERASYON" } });
  const yon = await prisma.user.create({ data: { name: "Y", email: "y@medikal.local", passwordHash: "x", role: "YONETICI" } });
  const satici = await prisma.user.create({ data: { name: "S", email: "s@medikal.local", passwordHash: "x", role: "SATICI" } });
  const doktor = await prisma.doctor.create({ data: yeniDoktorVerisi("Dr. Sahipli") });
  await prisma.$transaction((tx) => degistirDoktorSahibi([doktor.id], satici.id, { metin: "t", yapanId: yon.id }, tx));
  const sahipsiz = await prisma.doctor.create({ data: yeniDoktorVerisi("Dr. Sahipsiz") });
  const bayiListe = await prisma.priceList.create({ data: { code: "BAYI", name: "Bayi" } });
  const bayi = await prisma.doctor.create({ data: { ...yeniDoktorVerisi("Bayi A.Ş."), accountClass: "BAYI", priceListId: bayiListe.id } });
  const urun = await prisma.product.create({ data: { name: "Stent", code: "MED-1", taxRateId: ref.kdv20.id } });
  await prisma.priceListItem.createMany({
    data: [
      { priceListId: ref.liste.id, productId: urun.id, listPrice: "1000" },
      { priceListId: bayiListe.id, productId: urun.id, listPrice: "600" },
    ],
  });
  await prisma.stockMovement.create({ data: { productId: urun.id, locationId: ref.depo.id, type: "GIRIS", quantity: 100 } });
  h.kullanici = { id: op.id, role: "OPERASYON" };
  return { op, yon, satici, doktor, sahipsiz, bayi, urun };
}
beforeEach(async () => {
  s = await seed();
});
const form = (doktorId: string, satir: Record<string, unknown> = {}, gerekce?: string) => {
  const fd = new FormData();
  fd.set("doctorId", doktorId);
  fd.set("items", JSON.stringify([{ productId: s.urun.id, quantity: 2, ...satir }]));
  if (gerekce) fd.set("gerekce", gerekce);
  return fd;
};

describe("personel sipariş girişi (X-8-3)", () => {
  it("doktor siparişi sahibine yazılır; sahipsiz doktora girilmez; bayi siparişi satıcısız ve bayi listesinden", async () => {
    expect(await createStaffOrder(null, form(s.doktor.id))).toBeUndefined();
    expect((await prisma.order.findFirstOrThrow({ where: { doctorId: s.doktor.id } })).sellerId).toBe(s.satici.id);

    const r = await createStaffOrder(null, form(s.sahipsiz.id));
    expect(r?.bildirimler.map((b) => [b.kural_kodu, b.alan])).toEqual([["DOKTOR_SAHIPSIZ", "doctorId"]]);

    expect(await createStaffOrder(null, form(s.bayi.id))).toBeUndefined();
    const o = await prisma.order.findFirstOrThrow({ where: { doctorId: s.bayi.id }, include: { items: true } });
    expect([o.sellerId, o.items[0].listPrice.toFixed(2)]).toEqual([null, "600.00"]);

    // Bayi sevkiyatı prim doğurmaz (X-8 §(3), X-14 §(3)).
    await prisma.order.update({ where: { id: o.id }, data: { status: "HAZIRLANIYOR" } });
    await prisma.$transaction((tx) =>
      sevkiyatYaz(tx, {
        siparisId: o.id,
        kalemler: [{ siparisKalemiId: o.items[0].id, miktar: 2 }],
        carrierId: null,
        trackingNumber: null,
        externalDispatchNo: null,
        yapan: { id: s.op.id, rol: "OPERASYON" },
        gerekce: null,
      })
    );
    expect((await prisma.shipmentItem.findFirstOrThrow()).commissionRate).toBeNull();

    await prisma.doctor.update({ where: { id: s.bayi.id }, data: { status: "PASIF" } });
    expect((await createStaffOrder(null, form(s.bayi.id)))?.bildirimler[0].kural_kodu).toBe("DOKTOR_PASIF");
  });

  it("bedelsiz promosyon: operasyonun gerekçesi onaya gönderir, yöneticininki aynı işlemde onaylar", async () => {
    const bedelsiz = { bedelsiz: { sebep: "PROMOSYON" } };
    await createStaffOrder(null, form(s.bayi.id, bedelsiz, "Fuar"));
    h.kullanici = { id: s.yon.id, role: "YONETICI" };
    await createStaffOrder(null, form(s.bayi.id, bedelsiz, "Fuar"));
    const bloklar = await prisma.approvalBlock.findMany({ orderBy: { openedAt: "asc" }, select: { openedById: true, decision: true } });
    expect(bloklar).toEqual([
      { openedById: s.op.id, decision: null },
      { openedById: s.yon.id, decision: "ONAY" },
    ]);
  });
});
