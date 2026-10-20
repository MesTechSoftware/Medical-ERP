import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { hesaplaDoktorBakiye } from "@/lib/doctor-cari";
import { IsHatasi } from "@/lib/hata";
import { iadeYaz } from "@/lib/iade";
import { getCiroTotal, getSellerReports } from "@/lib/reports-service";
import { degistirDoktorSahibi } from "@/lib/sahiplik";
import { sevkiyatYaz } from "@/lib/sevkiyat";
import { hesaplaStok } from "@/lib/stok";
import { takvimYili } from "@/lib/zaman";
import { referansVeri, yeniDoktorVerisi } from "../../test/integration/referans";

// A-1-1 — iade: ayrı belge, iade edilebilir = sevk − önceki iadeler, cari alacak, stok girişi,
// prim oranı en son sevkiyattan donar; ciro ve hakediş iade tarihinde düşer (A-1 eki 20.10.2026).

let s: Awaited<ReturnType<typeof seed>>;
const bekle = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function seed() {
  const ref = await referansVeri();
  const yonetici = await prisma.user.create({
    data: { name: "Y", email: "y@medikal.local", passwordHash: "x", role: "YONETICI" },
  });
  const satici = await prisma.user.create({
    data: { name: "S", email: "s@medikal.local", passwordHash: "x", role: "SATICI", commissionRate: "7.5" },
  });
  const doktor = await prisma.doctor.create({ data: yeniDoktorVerisi("Dr. Ayşe") });
  await prisma.$transaction((tx) => degistirDoktorSahibi([doktor.id], satici.id, { metin: "t", yapanId: yonetici.id }, tx));
  const urun = await prisma.product.create({ data: { name: "Stent", code: "MED-001", taxRateId: ref.kdv20.id } });
  await prisma.stockMovement.create({ data: { productId: urun.id, locationId: ref.depo.id, type: "GIRIS", quantity: 100 } });
  return { ...ref, yonetici, satici, doktor, urun };
}

async function sevkEdilmisSiparis(kalemler: { miktar: number; birim: string; bedelsiz?: boolean }[] = [{ miktar: 10, birim: "33.335" }]) {
  const o = await prisma.order.create({
    data: {
      documentNo: `SIP-${Math.random()}`,
      doctorId: s.doktor.id,
      sellerId: s.satici.id,
      stage: "ONAYLI",
      status: "HAZIRLANIYOR",
      paymentTermDays: 30,
      items: {
        create: kalemler.map((k) => ({
          productId: s.urun.id,
          quantity: k.miktar,
          listPrice: "40",
          unitPrice: k.birim,
          vatRate: "20",
          isFree: k.bedelsiz ?? false,
          freeReason: k.bedelsiz ? "NUMUNE" : null,
        })),
      },
    },
    include: { items: { orderBy: { id: "asc" } } },
  });
  await sevk(o, o.items.map((i) => i.quantity));
  return o;
}

const sevk = (o: { id: string; items: { id: string }[] }, miktarlar: number[]) =>
  prisma.$transaction((tx) =>
    sevkiyatYaz(tx, {
      siparisId: o.id,
      kalemler: o.items.map((i, n) => ({ siparisKalemiId: i.id, miktar: miktarlar[n] })).filter((k) => k.miktar > 0),
      carrierId: null,
      trackingNumber: null,
      externalDispatchNo: null,
      yapan: { id: s.yonetici.id, rol: "YONETICI" },
      gerekce: null,
    })
  );

const iade = (o: { id: string; items: { id: string }[] }, miktarlar: number[], sebep = "Hasarlı ambalaj") =>
  prisma.$transaction((tx) =>
    iadeYaz(tx, {
      siparisId: o.id,
      kalemler: o.items.map((i, n) => ({ siparisKalemiId: i.id, miktar: miktarlar[n] ?? 0 })),
      sebep,
      yapanId: s.yonetici.id,
    })
  );

const kodlar = async (p: Promise<unknown>) => {
  try {
    await p;
    return [];
  } catch (e) {
    if (e instanceof IsHatasi) return e.sonuc.bildirimler.map((b) => [b.kural_kodu, b.parametreler]);
    throw e;
  }
};

beforeEach(async () => {
  s = await seed();
});

describe("iade belgesi (A-1-1)", () => {
  it("IAD numarası, satır (KDV ve prim oranı donar), depoya giriş, IADE · ALACAK cari hareket", async () => {
    const o = await sevkEdilmisSiparis();
    const r = await iade(o, [3]);
    expect(r.documentNo).toBe(`IAD-${takvimYili()}-000001`);

    const belge = await prisma.returnNote.findUniqueOrThrow({ where: { id: r.iadeId }, include: { items: true } });
    expect([belge.doctorId, belge.reason, belge.locationId]).toEqual([s.doktor.id, "Hasarlı ambalaj", s.depo.id]);
    expect(belge.items.map((i) => [i.quantity, i.vatRate.toFixed(2), i.commissionRate?.toFixed(2)])).toEqual([[3, "20.00", "7.50"]]);

    expect(await hesaplaStok(s.urun.id)).toBe(93);
    const giris = await prisma.stockMovement.findFirstOrThrow({ where: { returnNoteId: r.iadeId } });
    expect([giris.type, giris.quantity]).toEqual(["GIRIS", 3]);

    // 33,335 × 3 = 100,005 → 100,01 · KDV 20,00 · toplam 120,01 (sevkiyat 400,02)
    const h = await prisma.ledgerEntry.findFirstOrThrow({ where: { returnNoteId: r.iadeId } });
    expect([h.type, h.direction, h.amount.toFixed(2), h.documentNo, h.dueDate]).toEqual(["IADE", "ALACAK", "120.01", r.documentNo, null]);
    expect((await hesaplaDoktorBakiye(s.doktor.id)).bakiye.toFixed(2)).toBe("280.01");
    // Sipariş ve sevkiyat değişmez.
    expect(await prisma.shipmentItem.findMany({ select: { quantity: true } })).toEqual([{ quantity: 10 }]);
  });

  it("iade edilebilir = sevk edilen − önceki iadeler; aşan, sebepsiz ya da boş iade SERT ve hiçbir şey yazmaz", async () => {
    const o = await sevkEdilmisSiparis([{ miktar: 10, birim: "10" }, { miktar: 5, birim: "10" }]);
    await iade(o, [4]);
    expect(await kodlar(iade(o, [7]))).toEqual([["IADE_MIKTARI_ASILDI", { urun: "Stent", kalan: 6 }]]);
    expect(await kodlar(iade(o, [1], "  "))).toEqual([["GEREKCE_ZORUNLU", {}]]);
    expect(await kodlar(iade(o, [0, 0]))).toEqual([["IADE_KALEMI_YOK", {}]]);
    expect(await kodlar(iade(o, [1.5]))).toEqual([["IADE_KALEMI_YOK", {}]]);
    expect(await prisma.returnNote.count()).toBe(1);
    expect(await prisma.documentCounter.findMany({ where: { prefix: "IAD" }, select: { lastValue: true } })).toEqual([{ lastValue: 1 }]);

    // Sevk edilmemiş kalem iade edilemez.
    const o2 = await prisma.order.create({
      data: {
        documentNo: "SIP-X",
        doctorId: s.doktor.id,
        stage: "ONAYLI",
        status: "HAZIRLANIYOR",
        paymentTermDays: 30,
        items: { create: [{ productId: s.urun.id, quantity: 2, listPrice: "10", unitPrice: "10", vatRate: "20" }] },
      },
      include: { items: true },
    });
    expect(await kodlar(iade(o2, [1]))).toEqual([["IADE_MIKTARI_ASILDI", { urun: "Stent", kalan: 0 }]]);
  });

  it("prim oranı satırın en son sevkiyatından donar (A-1 eki)", async () => {
    const o = await prisma.order.create({
      data: {
        documentNo: "SIP-P",
        doctorId: s.doktor.id,
        sellerId: s.satici.id,
        stage: "ONAYLI",
        status: "HAZIRLANIYOR",
        paymentTermDays: 30,
        items: { create: [{ productId: s.urun.id, quantity: 2, listPrice: "100", unitPrice: "100", vatRate: "20" }] },
      },
      include: { items: true },
    });
    await sevk(o, [1]);
    await prisma.user.update({ where: { id: s.satici.id }, data: { commissionRate: "10" } });
    await sevk(o, [1]);
    await iade(o, [2]);
    expect((await prisma.returnNoteItem.findFirstOrThrow()).commissionRate?.toFixed(2)).toBe("10.00");
  });

  it("bedelsiz satırın iadesi stoğa girer, alacak ve prim doğurmaz", async () => {
    const o = await sevkEdilmisSiparis([{ miktar: 2, birim: "0", bedelsiz: true }]);
    const r = await iade(o, [2]);
    expect(await prisma.ledgerEntry.count({ where: { returnNoteId: r.iadeId } })).toBe(0);
    expect((await prisma.returnNoteItem.findFirstOrThrow()).commissionRate).toBeNull();
    expect(await hesaplaStok(s.urun.id)).toBe(100);
  });

  it("aynı satırın eşzamanlı iki iadesi iade edilebilir miktarı aşamaz", async () => {
    const o = await sevkEdilmisSiparis();
    const birinci = prisma.$transaction(async (tx) => {
      const r = await iadeYaz(tx, { siparisId: o.id, kalemler: [{ siparisKalemiId: o.items[0].id, miktar: 10 }], sebep: "a", yapanId: s.yonetici.id });
      await bekle(300);
      return r;
    });
    await bekle(100);
    const ikinci = kodlar(iade(o, [10]));
    const [, k2] = await Promise.all([birinci, ikinci]);
    expect(k2).toEqual([["IADE_MIKTARI_ASILDI", { urun: "Stent", kalan: 0 }]]);
    expect(await prisma.returnNoteItem.count()).toBe(1);
  });
});

describe("iade ciro ve hakedişi iade tarihinde düşürür (A-1-2)", () => {
  it("sevkiyat dönemi değişmez; iade dönemi iade matrahı ve donmuş oranla eksi yazar", async () => {
    const o = await sevkEdilmisSiparis([{ miktar: 10, birim: "100" }]);
    const gecen = { baslangic: new Date("2026-01-01T00:00:00Z"), bitis: new Date("2026-02-01T00:00:00Z") };
    const bu = { baslangic: new Date("2026-02-01T00:00:00Z"), bitis: new Date("2100-01-01T00:00:00Z") };
    await prisma.shipment.updateMany({ data: { shippedAt: new Date("2026-01-15T10:00:00Z") } });
    await iade(o, [3]);

    expect((await getCiroTotal(gecen)).toFixed(2)).toBe("1000.00");
    expect((await getCiroTotal(bu)).toFixed(2)).toBe("-300.00");
    const yonetici = { id: s.yonetici.id, role: "YONETICI" as const };
    const [g] = await getSellerReports(yonetici, gecen);
    const [b] = await getSellerReports(yonetici, bu);
    expect([g.ciro.toFixed(2), g.hakedis.toFixed(2)]).toEqual(["1000.00", "75.00"]);
    expect([b.ciro.toFixed(2), b.hakedis.toFixed(2), b.ortalamaIskonto]).toEqual(["-300.00", "-22.50", null]);
  });
});
