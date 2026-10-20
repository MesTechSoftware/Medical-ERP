import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { IsHatasi } from "@/lib/hata";
import { sayilanBelgeler } from "@/lib/sayilan-belgeler";
import { hesaplaStok } from "@/lib/stok";
import { stokDuzeltmeYaz, type DuzeltmeKalemi } from "@/lib/stok-duzeltme";
import { takvimYili } from "@/lib/zaman";
import { referansVeri } from "../../test/integration/referans";

// B-7-1 — stok düzeltme: yalnız yönetici, çok satır, ± fark, sebep + açıklama, mali sonucu yok;
// negatif stok yumuşak (§(7)).

let s: Awaited<ReturnType<typeof seed>>;

async function seed() {
  const ref = await referansVeri();
  const y = await prisma.user.create({ data: { name: "Y", email: "y@medikal.local", passwordHash: "x", role: "YONETICI" } });
  const urun = await prisma.product.create({ data: { name: "Stent", code: "MED-001", taxRateId: ref.kdv20.id } });
  const urun2 = await prisma.product.create({ data: { name: "Kateter", code: "MED-002", taxRateId: ref.kdv20.id } });
  await prisma.stockMovement.createMany({
    data: [urun, urun2].map((u) => ({ productId: u.id, locationId: ref.depo.id, type: "GIRIS" as const, quantity: 10 })),
  });
  const hasar = await prisma.stockAdjustmentReason.findFirstOrThrow({ where: { code: "HASAR" } });
  const sayim = await prisma.stockAdjustmentReason.findFirstOrThrow({ where: { code: "SAYIM_FARKI" } });
  return { ...ref, yonetici: { id: y.id, rol: "YONETICI" as const }, urun, urun2, hasar, sayim };
}

const satir = (p: Partial<DuzeltmeKalemi> = {}): DuzeltmeKalemi => ({
  urunId: s.urun.id,
  konumId: s.depo.id,
  fark: -1,
  sebepId: s.hasar.id,
  aciklama: "Kırık kutu",
  ...p,
});
const duzelt = (
  kalemler: DuzeltmeKalemi[],
  o: { gerekce?: string; tutanak?: string; yapan?: { id: string; rol: "YONETICI" | "OPERASYON" } } = {}
) =>
  prisma.$transaction((tx) =>
    stokDuzeltmeYaz(tx, { kalemler, hariciBelgeNo: o.tutanak ?? null, yapan: o.yapan ?? s.yonetici, gerekce: o.gerekce ?? null })
  );
const bildirimler = async (p: Promise<unknown>) => {
  try {
    await p;
    return [];
  } catch (e) {
    if (e instanceof IsHatasi) return e.sonuc.bildirimler.map((b) => [b.kademe, b.kural_kodu]);
    throw e;
  }
};

beforeEach(async () => {
  s = await seed();
});

describe("stok düzeltme (B-7-1)", () => {
  it("DZL: çok satır, ± fark hareketi, sebep ve açıklama donar, tutanak salt kayıt; mali sonucu yok", async () => {
    const r = await duzelt([satir({ fark: -3 }), satir({ urunId: s.urun2.id, fark: 2, sebepId: s.sayim.id, aciklama: "Rafta fazla" })], {
      tutanak: "  TUT-2026/14  ",
    });
    expect(r.documentNo).toBe(`DZL-${takvimYili()}-000001`);
    expect([await hesaplaStok(s.urun.id), await hesaplaStok(s.urun2.id)]).toEqual([7, 12]);

    const belge = await prisma.stockAdjustment.findUniqueOrThrow({ where: { id: r.belgeId }, include: { items: { orderBy: { quantityDelta: "asc" } } } });
    expect(belge.externalDocNo).toBe("TUT-2026/14");
    expect(belge.items.map((i) => [i.quantityDelta, i.reasonId, i.note])).toEqual([
      [-3, s.hasar.id, "Kırık kutu"],
      [2, s.sayim.id, "Rafta fazla"],
    ]);
    const hareketler = await prisma.stockMovement.findMany({ where: { stockAdjustmentId: r.belgeId }, orderBy: { type: "asc" } });
    expect(hareketler.map((h) => [h.type, h.quantity])).toEqual([
      ["GIRIS", 2],
      ["CIKIS", 3],
    ]);
    expect(await prisma.stockMovement.count({ where: { AND: [sayilanBelgeler.stokHareketi, { stockAdjustmentId: r.belgeId }] } })).toBe(0);
    expect(await prisma.ledgerEntry.count()).toBe(0);
    expect(await prisma.approvalBlock.count()).toBe(0); // düzeltmenin kendisi OnayBlogu kullanmaz (§(6))
  });

  it("geçersiz satır, boş açıklama, pasif sebep SERT; hiçbir şey ve numara yazılmaz", async () => {
    expect(await bildirimler(duzelt([satir({ fark: 0 })]))).toEqual([["SERT", "DUZELTME_KALEMI_GECERSIZ"]]);
    expect(await bildirimler(duzelt([satir({ fark: 1.5 })]))).toEqual([["SERT", "DUZELTME_KALEMI_GECERSIZ"]]);
    expect(await bildirimler(duzelt([satir({ aciklama: "  " })]))).toEqual([["SERT", "GEREKCE_ZORUNLU"]]);
    await prisma.stockAdjustmentReason.update({ where: { id: s.hasar.id }, data: { isActive: false } });
    expect(await bildirimler(duzelt([satir()]))).toEqual([["SERT", "DUZELTME_SEBEBI_GECERSIZ"]]);
    expect([await prisma.stockAdjustment.count(), await prisma.documentCounter.count()]).toEqual([0, 0]);
  });

  it("yalnız YONETICI: başka rol teknik hatadır (sunucu guard'ı requireAdmin)", async () => {
    await expect(duzelt([satir()], { yapan: { id: s.yonetici.id, rol: "OPERASYON" } })).rejects.toThrow(/YONETICI/);
  });

  it("negatif stok yumuşak: gerekçesiz YUMUSAK, gerekçeyle yazılır ve NEGATIF_STOK bloğu ONAY'lanır (§(7))", async () => {
    expect(await bildirimler(duzelt([satir({ fark: -12, sebepId: s.sayim.id, aciklama: "Sayım" })]))).toEqual([["YUMUSAK", "NEGATIF_STOK"]]);
    const r = await duzelt([satir({ fark: -12, sebepId: s.sayim.id, aciklama: "Sayım" })], { gerekce: "Sayım tutanağına göre" });
    expect(await hesaplaStok(s.urun.id)).toBe(-2);
    expect(await prisma.approvalBlock.findMany({ select: { documentType: true, documentId: true, decision: true } })).toEqual([
      { documentType: "DZL", documentId: r.belgeId, decision: "ONAY" },
    ]);
  });
});
