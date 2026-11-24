import { describe, expect, it } from "vitest";

import { hazirlamaSureleri, operasyonSayilari, siparisDagilimi } from "@/lib/dashboard";
import { TUM_SIPARISLER } from "@/lib/siparis-listesi/suzgec";
import { prisma } from "@/lib/db";
import { yeniDoktorVerisi } from "../../test/integration/referans";

// Dashboard blokları (brief §3.3, §4.2): durum dağılımı ve medyan hazırlama süresinin girdisi.

const SAAT = 3_600_000;
const GUN = 24 * SAAT;
const ARALIK = { baslangic: new Date("2026-10-01T00:00:00Z"), bitis: new Date("2026-10-27T00:00:00Z") };
const ekim = (g: number) => new Date(Date.UTC(2026, 9, g));
let no = 0;

async function siparis(o: {
  orderDate: Date;
  status?: "BEKLIYOR" | "HAZIRLANIYOR" | "KARGOLANDI" | "TESLIM_EDILDI" | "IPTAL";
  stage?: "TEKLIF" | "ONAYLI";
  sevkler?: Date[];
}) {
  no += 1;
  const d = await prisma.doctor.create({ data: yeniDoktorVerisi(`Dr. ${no}`) });
  const s = await prisma.order.create({
    data: {
      documentNo: `SIP-D-${no}`,
      doctorId: d.id,
      paymentTermDays: 30,
      stage: o.stage ?? "ONAYLI",
      status: o.status ?? "BEKLIYOR",
      orderDate: o.orderDate,
    },
  });
  for (const [i, shippedAt] of (o.sevkler ?? []).entries()) {
    await prisma.shipment.create({ data: { documentNo: `SVK-D-${no}-${i}`, orderId: s.id, shippedAt } });
  }
  return s;
}

describe("siparisDagilimi — sipariş durum dağılımı (brief §3.3)", () => {
  it("aralıkta açılan onaylı siparişler durumlarına göre; iptal dahil; teklif ve aralık dışı hariç; boş durum 0", async () => {
    await siparis({ orderDate: ekim(5) });
    await siparis({ orderDate: ekim(6) });
    await siparis({ orderDate: ekim(7), status: "IPTAL" });
    await siparis({ orderDate: ekim(8), status: "TESLIM_EDILDI" });
    await siparis({ orderDate: ekim(9), stage: "TEKLIF" });
    await siparis({ orderDate: new Date("2026-09-20T00:00:00Z") });
    expect(await siparisDagilimi(ARALIK, TUM_SIPARISLER)).toEqual({ BEKLIYOR: 2, HAZIRLANIYOR: 0, KARGOLANDI: 0, TESLIM_EDILDI: 1, IPTAL: 1 });
  });
});

describe("operasyonSayilari — OPERASYON panosu (D-2-4)", () => {
  it("kalanı açık = sevkiyatı olan HAZIRLANIYOR onaylı sipariş; sevksiz, kargolanmış ve teklif hariç; onay bekleyen açık blok, iptal siparişinki hariç", async () => {
    const acik = await siparis({ orderDate: ekim(2), status: "HAZIRLANIYOR", sevkler: [ekim(3)] });
    await siparis({ orderDate: ekim(2), status: "HAZIRLANIYOR" });
    await siparis({ orderDate: ekim(2), status: "KARGOLANDI", sevkler: [ekim(3)] });
    await siparis({ orderDate: ekim(2), status: "HAZIRLANIYOR", stage: "TEKLIF", sevkler: [ekim(3)] });
    const iptal = await siparis({ orderDate: ekim(2), status: "IPTAL" });
    const kul = await prisma.user.create({ data: { name: "y", email: "y@medikal.local", passwordHash: "x", role: "YONETICI" } });
    const blok = (documentId: string) =>
      prisma.approvalBlock.create({ data: { documentType: "SIP", documentId, ruleCode: "NEGATIF_STOK", openedById: kul.id, openReason: "acil" } });
    await blok(acik.id);
    await blok(iptal.id);
    expect(await operasyonSayilari(new Date("2026-10-27T00:00:00Z"))).toEqual({ onayBekleyen: 1, kalaniAcik: 1 });
  });
});

describe("hazirlamaSureleri — sipariş oluşturma → ilk sevk (K-D4)", () => {
  it("ilk sevki aralıkta olan onaylı siparişlerin süresi; ilk sevki aralıktan önce olan, sevksiz ve teklif hariç", async () => {
    await siparis({ orderDate: ekim(1), sevkler: [new Date(ekim(1).getTime() + 5 * GUN), new Date(ekim(1).getTime() + 2 * GUN)] });
    await siparis({ orderDate: ekim(3), sevkler: [new Date(ekim(3).getTime() + 12 * SAAT)] });
    await siparis({ orderDate: new Date("2026-09-25T00:00:00Z"), sevkler: [new Date("2026-09-28T00:00:00Z"), ekim(2)] });
    await siparis({ orderDate: ekim(4) });
    await siparis({ orderDate: ekim(4), stage: "TEKLIF", sevkler: [ekim(6)] });
    expect((await hazirlamaSureleri(ARALIK)).sort((a, b) => a - b)).toEqual([12 * SAAT, 2 * GUN]);
  });
});
