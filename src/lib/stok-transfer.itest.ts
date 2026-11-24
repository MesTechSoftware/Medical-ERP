import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { IsHatasi } from "@/lib/hata";
import { sayilanBelgeler } from "@/lib/sayilan-belgeler";
import { hesaplaStok } from "@/lib/stok";
import { konsinyeCikisYaz, stokTransferYaz } from "@/lib/stok-transfer";
import { takvimYili } from "@/lib/zaman";
import { referansVeri, yeniDoktorVerisi } from "../../test/integration/referans";

// A-4-1 · B-4-5 — konsinye çıkış ve transfer: mali sonucu yok, doktor başına konsinye konumu,
// negatif stokta yalnız yönetici gerekçeyle (A-4 eki 20.10.2026).

let s: Awaited<ReturnType<typeof seed>>;

async function seed() {
  const ref = await referansVeri();
  const yonetici = await prisma.user.create({ data: { name: "Y", email: "y@medikal.local", passwordHash: "x", role: "YONETICI" } });
  const operasyon = await prisma.user.create({ data: { name: "O", email: "o@medikal.local", passwordHash: "x", role: "OPERASYON" } });
  const doktor = await prisma.doctor.create({ data: yeniDoktorVerisi("Dr. Ayşe") });
  const urun = await prisma.product.create({ data: { name: "Stent", code: "MED-001", taxRateId: ref.kdv20.id } });
  await prisma.stockMovement.create({ data: { productId: urun.id, locationId: ref.depo.id, type: "GIRIS", quantity: 10 } });
  return {
    ...ref,
    doktor,
    urun,
    yonetici: { id: yonetici.id, rol: "YONETICI" as const },
    operasyon: { id: operasyon.id, rol: "OPERASYON" as const },
  };
}

type Yapan = { id: string; rol: "YONETICI" | "OPERASYON" };
const konsinye = (miktar: number, yapan: Yapan = s.operasyon, gerekce: string | null = null, doktorId = s.doktor.id) =>
  prisma.$transaction((tx) => konsinyeCikisYaz(tx, { doktorId, kalemler: [{ urunId: s.urun.id, miktar }], yapan, gerekce }));
const transfer = (kaynakId: string, hedefId: string, miktar: number, yapan: Yapan = s.operasyon, gerekce: string | null = null) =>
  prisma.$transaction((tx) => stokTransferYaz(tx, { kaynakId, hedefId, kalemler: [{ urunId: s.urun.id, miktar }], yapan, gerekce }));
const bildirimler = async (p: Promise<unknown>) => {
  try {
    await p;
    return [];
  } catch (e) {
    if (e instanceof IsHatasi) return e.sonuc.bildirimler.map((b) => [b.kademe, b.kural_kodu, b.parametreler]);
    throw e;
  }
};
const konsinyeKonumu = () => prisma.stockLocation.findUniqueOrThrow({ where: { doctorId: s.doktor.id } });

beforeEach(async () => {
  s = await seed();
});

describe("konsinye çıkış (A-4-1)", () => {
  it("KNS: depodan doktorun konsinye konumuna; konum ilk çıkışta açılır, sonra yeniden kullanılır; mali sonucu yok", async () => {
    const r = await konsinye(3);
    expect(r.documentNo).toBe(`KNS-${takvimYili()}-000001`);
    const konum = await konsinyeKonumu();
    expect([konum.type, konum.name]).toEqual(["KONSINYE", "Konsinye — Dr. Ayşe"]);
    expect([await hesaplaStok(s.urun.id, s.depo.id), await hesaplaStok(s.urun.id, konum.id), await hesaplaStok(s.urun.id)]).toEqual([7, 3, 10]);

    await konsinye(2);
    expect(await prisma.stockLocation.count({ where: { type: "KONSINYE" } })).toBe(1);
    expect(await hesaplaStok(s.urun.id, konum.id)).toBe(5);

    const hareketler = await prisma.stockMovement.findMany({ where: { consignmentIssueId: r.belgeId } });
    expect(hareketler.map((h) => [h.type, h.locationId, h.quantity]).sort()).toEqual(
      [["CIKIS", s.depo.id, 3], ["GIRIS", konum.id, 3]].sort()
    );
    // Sayılan stok hareketi değildir; cari hareket ve blok yazılmaz.
    expect(await prisma.stockMovement.count({ where: { AND: [sayilanBelgeler.stokHareketi, { consignmentIssueId: { not: null } }] } })).toBe(0);
    expect(await prisma.ledgerEntry.count()).toBe(0);
    expect(await prisma.approvalBlock.count()).toBe(0);
  });

  it("veritabanı: konsinye konumu doktorsuz, depo doktorlu olamaz; doktor başına tek konsinye konumu (CHECK, UNIQUE)", async () => {
    await expect(prisma.stockLocation.create({ data: { code: "K1", name: "K", type: "KONSINYE" } })).rejects.toThrow();
    await expect(prisma.stockLocation.create({ data: { code: "D2", name: "D", type: "DEPO", doctorId: s.doktor.id } })).rejects.toThrow();
    await konsinye(1);
    await expect(prisma.stockLocation.create({ data: { code: "K2", name: "K", type: "KONSINYE", doctorId: s.doktor.id } })).rejects.toThrow();
  });
});

describe("pasif doktor (A-4-2, A-4-3)", () => {
  it("pasif doktora konsinye çıkışı DOKTOR_PASIF ile reddedilir; hiçbir hareket ve konum yazılmaz", async () => {
    await prisma.doctor.update({ where: { id: s.doktor.id }, data: { status: "PASIF" } });
    expect(await bildirimler(konsinye(1))).toEqual([["SERT", "DOKTOR_PASIF", {}]]);
    expect(await prisma.stockMovement.count({ where: { consignmentIssueId: { not: null } } })).toBe(0);
    expect(await prisma.consignmentIssue.count()).toBe(0);
    expect(await prisma.stockLocation.count({ where: { type: "KONSINYE" } })).toBe(0);
  });

  it("doktor sonradan pasife alınırsa konsinye konumundaki mal depoya transferle geri çekilebilir", async () => {
    await konsinye(4);
    const konum = await konsinyeKonumu();
    await prisma.doctor.update({ where: { id: s.doktor.id }, data: { status: "PASIF" } });
    const r = await transfer(konum.id, s.depo.id, 4);
    expect(r.documentNo).toBe(`TRF-${takvimYili()}-000001`);
    expect([await hesaplaStok(s.urun.id, s.depo.id), await hesaplaStok(s.urun.id, konum.id)]).toEqual([10, 0]);
  });
});

describe("stok transferi (B-4-5)", () => {
  it("TRF: konsinyeden depoya; hedef depo olmalı, kaynak ve hedef farklı olmalı", async () => {
    await konsinye(4);
    const konum = await konsinyeKonumu();
    const r = await transfer(konum.id, s.depo.id, 1);
    expect(r.documentNo).toBe(`TRF-${takvimYili()}-000001`);
    expect([await hesaplaStok(s.urun.id, s.depo.id), await hesaplaStok(s.urun.id, konum.id)]).toEqual([7, 3]);
    expect(await prisma.stockMovement.count({ where: { stockTransferId: r.belgeId } })).toBe(2);

    expect(await bildirimler(transfer(s.depo.id, konum.id, 1))).toEqual([["SERT", "TRANSFER_KONUMU_GECERSIZ", {}]]);
    expect(await bildirimler(transfer(s.depo.id, s.depo.id, 1))).toEqual([["SERT", "TRANSFER_KONUMU_GECERSIZ", {}]]);
    expect(await bildirimler(transfer(konum.id, s.depo.id, 0))).toEqual([["SERT", "TRANSFER_KALEMI_YOK", {}]]);
  });
});

describe("negatif stokta yalnız yönetici gerekçeyle (A-4 eki)", () => {
  it("operasyon SERT alır; yönetici gerekçesiz YUMUSAK, gerekçeyle belge + ONAY'lı blok; reddedilen girişte hiçbir şey yazılmaz", async () => {
    expect(await bildirimler(konsinye(12))).toEqual([["SERT", "NEGATIF_STOK_YONETICI_GEREKIR", { urun: "Stent", sonra: -2 }]]);
    expect(await bildirimler(konsinye(12, s.yonetici))).toEqual([["YUMUSAK", "NEGATIF_STOK", { urun: "Stent", sonra: -2 }]]);
    expect([await prisma.consignmentIssue.count(), await prisma.documentCounter.count(), await prisma.stockLocation.count({ where: { type: "KONSINYE" } })]).toEqual([0, 0, 0]);

    const r = await konsinye(12, s.yonetici, "Depo sayımı eksik, mal rafta");
    expect(await hesaplaStok(s.urun.id, s.depo.id)).toBe(-2);
    expect(await prisma.approvalBlock.findMany({ select: { documentType: true, documentId: true, ruleCode: true, decision: true, openReason: true } })).toEqual([
      { documentType: "KNS", documentId: r.belgeId, ruleCode: "NEGATIF_STOK", decision: "ONAY", openReason: "Depo sayımı eksik, mal rafta" },
    ]);
  });
});
