import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db";
import { IsHatasi } from "@/lib/hata";
import { degistirDoktorSahibi } from "@/lib/sahiplik";
import { blokKarariVer } from "@/lib/onay-blogu";
import { sevkiyatYaz, type SevkiyatSonucu } from "@/lib/sevkiyat";
import { hesaplaStok } from "@/lib/stok";
import { bugun, gunEkle, takvimYili } from "@/lib/zaman";
import { referansVeri, yeniDoktorVerisi } from "../../test/integration/referans";

// A-3-1 · X-14-2 — sevkiyat: borç, prim ve stok çıkışı sevkiyat anında doğar; kısmi sevkiyat.
const h = vi.hoisted(() => ({ kullaniciId: "" }));
vi.mock("@/lib/session", () => ({
  requireStaff: async () => ({ user: { id: h.kullaniciId, role: "OPERASYON" } }),
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("next/navigation", () => ({ redirect: () => {} }));
const { cancelOrder } = await import("@/app/(admin)/orders/actions");

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
  h.kullaniciId = yonetici.id;
  const doktor = await prisma.doctor.create({ data: yeniDoktorVerisi("Dr. Ayşe") });
  await prisma.$transaction((tx) => degistirDoktorSahibi([doktor.id], satici.id, { metin: "t", yapanId: yonetici.id }, tx));
  const urun = await prisma.product.create({ data: { name: "Stent", code: "MED-001", taxRateId: ref.kdv20.id } });
  await prisma.stockMovement.create({
    data: { productId: urun.id, locationId: ref.depo.id, type: "GIRIS", quantity: 100 },
  });
  return { ...ref, yonetici, satici, doktor, urun };
}

async function siparis(opts: { status?: "BEKLIYOR" | "HAZIRLANIYOR"; satici?: string | null; kalemler?: { miktar: number; birim: string; bedelsiz?: boolean }[] } = {}) {
  return prisma.order.create({
    data: {
      documentNo: `SIP-${Math.random()}`,
      doctorId: s.doktor.id,
      sellerId: opts.satici === undefined ? s.satici.id : opts.satici,
      stage: "ONAYLI",
      status: opts.status ?? "HAZIRLANIYOR",
      paymentTermDays: 30,
      items: {
        create: (opts.kalemler ?? [{ miktar: 10, birim: "33.335" }]).map((k) => ({
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
}

/** Sevkiyat yazıldı mı — değilse test düşer (onaya gönderilen sevkiyat burada beklenmez). */
function sevkEdildi(r: SevkiyatSonucu) {
  if (r.durum !== "SEVK_EDILDI") throw new Error(`Beklenmeyen sonuç: ${r.durum}`);
  return r;
}
const yonetici = () => ({ id: s.yonetici.id, rol: "YONETICI" as const });
const sevk = (siparisId: string, kalemler: { siparisKalemiId: string; miktar: number }[]) =>
  prisma.$transaction(async (tx) =>
    sevkEdildi(
      await sevkiyatYaz(tx, {
        siparisId,
        kalemler,
        carrierId: null,
        trackingNumber: null,
        externalDispatchNo: "IRS-1",
        yapan: yonetici(),
        gerekce: null,
      })
    )
  );
const kodlar = async (p: Promise<unknown>) => {
  try {
    await p;
    return [];
  } catch (e) {
    if (e instanceof IsHatasi) return e.sonuc.bildirimler.map((b) => b.kural_kodu);
    throw e;
  }
};

beforeEach(async () => {
  s = await seed();
});

describe("sevkiyat — borç, prim, stok sevkiyatta doğar (A-3-1)", () => {
  it("tam sevkiyat: SVK numarası, satırlar, BORC cari hareket vadesiyle, stok çıkışı, sipariş KARGOLANDI", async () => {
    const o = await siparis();
    const r = await sevk(o.id, [{ siparisKalemiId: o.items[0].id, miktar: 10 }]);
    expect(r).toMatchObject({ documentNo: `SVK-${takvimYili()}-000001`, tamamlandi: true });

    const [hareket] = await prisma.ledgerEntry.findMany();
    // 33,335 × 10 = 333,35 · KDV 66,67 · toplam 400,02
    expect([hareket.type, hareket.direction, hareket.amount.toFixed(2), hareket.documentNo]).toEqual([
      "SEVKIYAT",
      "BORC",
      "400.02",
      r.documentNo,
    ]);
    expect(hareket.dueDate?.toISOString().slice(0, 10)).toBe(gunEkle(bugun(), 30).toISOString().slice(0, 10));
    expect(await hesaplaStok(s.urun.id)).toBe(90);
    const cikis = await prisma.stockMovement.findFirstOrThrow({ where: { type: "CIKIS" } });
    expect(cikis.shipmentId).toBe(r.sevkiyatId);
    expect((await prisma.order.findUniqueOrThrow({ where: { id: o.id } })).status).toBe("KARGOLANDI");
    expect((await prisma.shipment.findUniqueOrThrow({ where: { id: r.sevkiyatId } })).externalDispatchNo).toBe("IRS-1");
  });

  it("kısmi sevkiyat: her sevkiyat kendi borcunu yuvarlar; son sevkiyat siparişi tamamlar", async () => {
    const o = await siparis({ kalemler: [{ miktar: 2, birim: "0.125" }] });
    const r1 = await sevk(o.id, [{ siparisKalemiId: o.items[0].id, miktar: 1 }]);
    expect(r1.tamamlandi).toBe(false);
    expect((await prisma.order.findUniqueOrThrow({ where: { id: o.id } })).status).toBe("HAZIRLANIYOR");
    const r2 = await sevk(o.id, [{ siparisKalemiId: o.items[0].id, miktar: 1 }]);
    expect(r2.tamamlandi).toBe(true);
    // 0,125 → matrah 0,13 + KDV 0,03 = 0,16 her sevkiyatta (tek seferde 0,25 + 0,05 = 0,30 olurdu).
    expect((await prisma.ledgerEntry.findMany({ orderBy: { createdAt: "asc" } })).map((h) => h.amount.toFixed(2))).toEqual([
      "0.16",
      "0.16",
    ]);
  });

  it("kalanı aşan miktar SERT; numara ve hiçbir kayıt yazılmaz", async () => {
    const o = await siparis();
    expect(await kodlar(sevk(o.id, [{ siparisKalemiId: o.items[0].id, miktar: 11 }]))).toEqual(["SEVK_MIKTARI_ASILDI"]);
    expect(await kodlar(sevk(o.id, [{ siparisKalemiId: o.items[0].id, miktar: 0 }]))).toEqual(["SEVK_KALEMI_YOK"]);
    expect(await kodlar(sevk(o.id, [{ siparisKalemiId: o.items[0].id, miktar: 1.5 }]))).toEqual(["SEVK_KALEMI_YOK"]);
    expect(await prisma.shipment.count()).toBe(0);
    expect(await prisma.documentCounter.count()).toBe(0);
    expect(await prisma.ledgerEntry.count()).toBe(0);
  });

  it("hazırlanmamış sipariş sevk edilemez", async () => {
    const o = await siparis({ status: "BEKLIYOR" });
    expect(await kodlar(sevk(o.id, [{ siparisKalemiId: o.items[0].id, miktar: 1 }]))).toEqual(["SIPARIS_DURUMU_UYGUN_DEGIL"]);
  });

  it("aynı kalemin eşzamanlı iki sevkiyatı kalanı aşamaz: ikinci, birincinin commit'ini bekler ve reddedilir", async () => {
    const o = await siparis();
    const birinci = prisma.$transaction(async (tx) => {
      const r = sevkEdildi(
        await sevkiyatYaz(tx, {
          siparisId: o.id,
          kalemler: [{ siparisKalemiId: o.items[0].id, miktar: 10 }],
          carrierId: null,
          trackingNumber: null,
          externalDispatchNo: null,
          yapan: yonetici(),
          gerekce: null,
        })
      );
      await bekle(300);
      return r;
    });
    await bekle(100);
    const ikinci = kodlar(sevk(o.id, [{ siparisKalemiId: o.items[0].id, miktar: 10 }]));
    const [r1, k2] = await Promise.all([birinci, ikinci]);
    expect(r1.tamamlandi).toBe(true);
    expect(k2).toEqual(["SIPARIS_DURUMU_UYGUN_DEGIL"]);
    expect(await prisma.shipmentItem.count()).toBe(1);
  });
});

describe("prim oranı sevkiyat satırına donar (X-14-2)", () => {
  it("satıcının özel oranı, yoksa varsayılan; bedelsiz satırda boş ve borç doğurmaz", async () => {
    const o = await siparis({ kalemler: [{ miktar: 1, birim: "100" }, { miktar: 1, birim: "0", bedelsiz: true }] });
    await sevk(o.id, o.items.map((i) => ({ siparisKalemiId: i.id, miktar: 1 })));
    const satirlar = await prisma.shipmentItem.findMany({ orderBy: { orderItemId: "asc" }, include: { orderItem: true } });
    expect(satirlar.map((x) => [x.orderItem.isFree, x.commissionRate?.toFixed(2) ?? null])).toEqual(
      o.items.map((i) => [i.isFree, i.isFree ? null : "7.50"])
    );
    expect((await prisma.ledgerEntry.findFirstOrThrow()).amount.toFixed(2)).toBe("120.00");

    await prisma.user.update({ where: { id: s.satici.id }, data: { commissionRate: null } });
    const o2 = await siparis({ kalemler: [{ miktar: 1, birim: "100" }] });
    await sevk(o2.id, [{ siparisKalemiId: o2.items[0].id, miktar: 1 }]);
    const son = await prisma.shipmentItem.findFirstOrThrow({ where: { orderItemId: o2.items[0].id } });
    expect(son.commissionRate?.toFixed(2)).toBe("5.00"); // finance.primOraniVarsayilan
  });

  it("BAYI carinin sevkiyatında prim oranı boştur", async () => {
    const bayi = await prisma.doctor.create({ data: { ...yeniDoktorVerisi("Bayi A.Ş."), accountClass: "BAYI" } });
    const o = await prisma.order.create({
      data: {
        documentNo: "SIP-B",
        doctorId: bayi.id,
        stage: "ONAYLI",
        status: "HAZIRLANIYOR",
        paymentTermDays: 30,
        items: { create: [{ productId: s.urun.id, quantity: 1, listPrice: "40", unitPrice: "40", vatRate: "20" }] },
      },
      include: { items: true },
    });
    await sevk(o.id, [{ siparisKalemiId: o.items[0].id, miktar: 1 }]);
    expect((await prisma.shipmentItem.findFirstOrThrow()).commissionRate).toBeNull();
  });
});

describe("iptal — sevk edilmiş sipariş iptal edilemez (A-3-1, K-1)", () => {
  it("sevkiyatı olan sipariş iptal edilmez; sevkiyatsız sipariş stoğa dokunmadan iptal olur", async () => {
    const o = await siparis({ kalemler: [{ miktar: 4, birim: "10" }] });
    await sevk(o.id, [{ siparisKalemiId: o.items[0].id, miktar: 1 }]);
    expect((await cancelOrder(o.id)).bildirimler.map((b) => b.kural_kodu)).toEqual(["SIPARIS_IPTAL_EDILEMEZ"]);

    // Eşzamanlı: sevkiyat ürünleri tutarken gelen iptal commit'i bekler ve sevkiyatı görür.
    const o3 = await siparis({ kalemler: [{ miktar: 2, birim: "10" }] });
    const sevkiyat = prisma.$transaction(async (tx) => {
      await sevkiyatYaz(tx, {
        siparisId: o3.id,
        kalemler: [{ siparisKalemiId: o3.items[0].id, miktar: 1 }],
        carrierId: null,
        trackingNumber: null,
        externalDispatchNo: null,
        yapan: yonetici(),
        gerekce: null,
      });
      await bekle(300);
    });
    await bekle(100);
    const [, iptal] = await Promise.all([sevkiyat, cancelOrder(o3.id)]);
    expect(iptal.bildirimler.map((b) => b.kural_kodu)).toEqual(["SIPARIS_IPTAL_EDILEMEZ"]);
    expect((await prisma.order.findUniqueOrThrow({ where: { id: o3.id } })).status).toBe("HAZIRLANIYOR");

    const o2 = await siparis({ status: "BEKLIYOR" });
    expect(await cancelOrder(o2.id)).toBeUndefined(); // başarıda redirect
    expect((await prisma.order.findUniqueOrThrow({ where: { id: o2.id } })).status).toBe("IPTAL");
    expect(await hesaplaStok(s.urun.id)).toBe(98);
  });
});

describe("negatif stok onayı sevkiyatta (A-8-7 … A-8-10)", () => {
  // Stok 100; sipariş 150 → sevkiyat stoğu -50'ye düşürür.
  let operasyon: { id: string; rol: "OPERASYON" };
  beforeEach(async () => {
    const u = await prisma.user.create({
      data: { name: "O", email: "o@medikal.local", passwordHash: "x", role: "OPERASYON" },
    });
    operasyon = { id: u.id, rol: "OPERASYON" };
  });
  const dene = (
    o: { id: string; items: { id: string }[] },
    yapan: { id: string; rol: "YONETICI" | "OPERASYON" },
    gerekce: string | null,
    miktar = 150
  ) =>
    prisma.$transaction((tx) =>
      sevkiyatYaz(tx, {
        siparisId: o.id,
        kalemler: [{ siparisKalemiId: o.items[0].id, miktar }],
        carrierId: null,
        trackingNumber: null,
        externalDispatchNo: null,
        yapan,
        gerekce,
      })
    );
  const bildirimler = async (p: Promise<unknown>) => {
    try {
      await p;
      return [];
    } catch (e) {
      if (e instanceof IsHatasi) return e.sonuc.bildirimler.map((b) => [b.kademe, b.kural_kodu, b.parametreler]);
      throw e;
    }
  };
  const yazilanlar = async () => ({
    sevkiyat: await prisma.shipment.count(),
    sayac: await prisma.documentCounter.count(),
    cari: await prisma.ledgerEntry.count(),
    stok: await hesaplaStok(s.urun.id),
  });
  const bloklar = () =>
    prisma.approvalBlock.findMany({
      orderBy: { openedAt: "asc" },
      select: { documentType: true, documentId: true, ruleCode: true, openedById: true, openReason: true, decision: true, decidedById: true },
    });

  it("A-8-7: gerekçesiz sevkiyat YUMUSAK döner (ürün ve sonraki stok); numara, sevkiyat, blok yazılmaz", async () => {
    const o = await siparis({ kalemler: [{ miktar: 150, birim: "10" }] });
    expect(await bildirimler(dene(o, yonetici(), null))).toEqual([["YUMUSAK", "NEGATIF_STOK", { urun: "Stent", sonra: -50 }]]);
    expect(await bildirimler(dene(o, operasyon, "  "))).toHaveLength(1);
    expect(await yazilanlar()).toEqual({ sevkiyat: 0, sayac: 0, cari: 0, stok: 100 });
    expect(await bloklar()).toEqual([]);
  });

  it("A-8-8: YONETICI gerekçeyle sevk eder; siparişe bağlı blok aynı işlemde ONAY'lanır", async () => {
    const o = await siparis({ kalemler: [{ miktar: 150, birim: "10" }] });
    expect((await dene(o, yonetici(), "Mal yolda, sayım hatalı")).durum).toBe("SEVK_EDILDI");
    expect(await hesaplaStok(s.urun.id)).toBe(-50);
    expect(await bloklar()).toEqual([
      {
        documentType: "SIP",
        documentId: o.id,
        ruleCode: "NEGATIF_STOK",
        openedById: s.yonetici.id,
        openReason: "Mal yolda, sayım hatalı",
        decision: "ONAY",
        decidedById: s.yonetici.id,
      },
    ]);
  });

  it("A-8-9: OPERASYON'un gerekçesi sevkiyatı yazmaz, siparişi onaya gönderir; karar verilene kadar kimse sevk edemez; ONAY'dan sonra sorulmadan sevk edilir", async () => {
    const o = await siparis({ kalemler: [{ miktar: 150, birim: "10" }] });
    const r = await dene(o, operasyon, "Acil vaka");
    expect(r).toEqual({ durum: "ONAYA_GONDERILDI", ihlaller: [{ kuralKodu: "NEGATIF_STOK", parametreler: { urun: "Stent", sonra: -50 } }] });
    expect(await yazilanlar()).toEqual({ sevkiyat: 0, sayac: 0, cari: 0, stok: 100 });
    expect((await bloklar()).map((b) => [b.openedById, b.openReason, b.decision])).toEqual([[operasyon.id, "Acil vaka", null]]);

    // Karar bekleyen blok sevkiyatı durdurur — stok yetse bile, yönetici için de.
    expect(await bildirimler(dene(o, operasyon, "Tekrar"))).toEqual([["SERT", "ONAY_BEKLIYOR", {}]]);
    expect(await bildirimler(dene(o, yonetici(), "Ben onaylıyorum", 1))).toEqual([["SERT", "ONAY_BEKLIYOR", {}]]);
    expect(await bloklar()).toHaveLength(1);

    const [blok] = await prisma.approvalBlock.findMany({ select: { id: true } });
    await prisma.$transaction((tx) => blokKarariVer(tx, { blokId: blok.id, karar: "ONAY", not: "Uygun", yapanId: s.yonetici.id }));
    // Siparişin sonraki sevkiyatları da sorulmadan geçer (son blok ONAY).
    expect((await dene(o, operasyon, null, 100)).durum).toBe("SEVK_EDILDI");
    expect((await dene(o, operasyon, null, 50)).durum).toBe("SEVK_EDILDI");
    expect(await hesaplaStok(s.urun.id)).toBe(-50);
    expect(await bloklar()).toHaveLength(1);
  });

  it("A-8-10: RED'den sonra yeni gerekçe yeni blok açar; stok yeterliyse RED sevkiyatı durdurmaz", async () => {
    const o = await siparis({ kalemler: [{ miktar: 150, birim: "10" }] });
    await dene(o, operasyon, "İlk");
    const [blok] = await prisma.approvalBlock.findMany({ select: { id: true } });
    await prisma.$transaction((tx) => blokKarariVer(tx, { blokId: blok.id, karar: "RED", not: "Stok gelsin", yapanId: s.yonetici.id }));

    expect(await bildirimler(dene(o, operasyon, null))).toEqual([["YUMUSAK", "NEGATIF_STOK", { urun: "Stent", sonra: -50 }]]);
    expect((await dene(o, operasyon, "İkinci")).durum).toBe("ONAYA_GONDERILDI");
    expect((await bloklar()).map((b) => [b.openReason, b.decision])).toEqual([
      ["İlk", "RED"],
      ["İkinci", null],
    ]);

    const o2 = await siparis({ kalemler: [{ miktar: 150, birim: "10" }] });
    await dene(o2, operasyon, "Üçüncü");
    const acik = await prisma.approvalBlock.findFirstOrThrow({ where: { documentId: o2.id }, select: { id: true } });
    await prisma.$transaction((tx) => blokKarariVer(tx, { blokId: acik.id, karar: "RED", not: "Hayır", yapanId: s.yonetici.id }));
    expect((await dene(o2, operasyon, null, 100)).durum).toBe("SEVK_EDILDI");
  });

  it("karar koşullu yazılır: kararlı bloğa ikinci karar yazılmaz", async () => {
    const o = await siparis({ kalemler: [{ miktar: 150, birim: "10" }] });
    await dene(o, operasyon, "Acil");
    const [blok] = await prisma.approvalBlock.findMany({ select: { id: true } });
    const karar = (k: "ONAY" | "RED") =>
      prisma.$transaction((tx) => blokKarariVer(tx, { blokId: blok.id, karar: k, not: "n", yapanId: s.yonetici.id }));
    expect((await Promise.all([karar("ONAY"), karar("RED")])).sort()).toEqual([false, true]);
    expect(await prisma.approvalBlock.count({ where: { decision: { not: null } } })).toBe(1);
  });
});

describe("bedelsiz satır onayı sevkiyatı durdurur (A-2-2)", () => {
  it("kararsız blok ONAY_BEKLIYOR, RED ONAY_REDDEDILDI; ONAY'dan sonra sevk edilir", async () => {
    const o = await siparis({ kalemler: [{ miktar: 1, birim: "0", bedelsiz: true }] });
    await prisma.orderItem.updateMany({ data: { freeReason: "PROMOSYON" } });
    const blok = await prisma.approvalBlock.create({
      data: { documentType: "SIP", documentId: o.id, ruleCode: "BEDELSIZ_ONAYI", openedById: s.satici.id, openReason: "Kongre" },
    });
    const dene = () => kodlar(sevk(o.id, [{ siparisKalemiId: o.items[0].id, miktar: 1 }]));
    expect(await dene()).toEqual(["ONAY_BEKLIYOR"]);
    await prisma.$transaction((tx) => blokKarariVer(tx, { blokId: blok.id, karar: "RED", not: "Hayır", yapanId: s.yonetici.id }));
    expect(await dene()).toEqual(["ONAY_REDDEDILDI"]);
    await prisma.approvalBlock.create({
      data: { documentType: "SIP", documentId: o.id, ruleCode: "BEDELSIZ_ONAYI", openedById: s.satici.id, openReason: "Yeniden", decision: "ONAY", decidedById: s.yonetici.id, decidedAt: new Date(), decisionNote: "Tamam" },
    });
    expect(await dene()).toEqual([]);
    expect(await prisma.shipment.count()).toBe(1);
  });
});

describe("iskonto tavanı onayı sevkiyatı durdurur (A-10-4)", () => {
  it("kararsız blok ONAY_BEKLIYOR, RED ONAY_REDDEDILDI; ONAY'dan sonra sevk edilir", async () => {
    const o = await siparis({ kalemler: [{ miktar: 1, birim: "100" }] });
    const blok = await prisma.approvalBlock.create({
      data: { documentType: "SIP", documentId: o.id, ruleCode: "ISKONTO_TAVANI", openedById: s.satici.id, openReason: "Rakip" },
    });
    const dene = () => kodlar(sevk(o.id, [{ siparisKalemiId: o.items[0].id, miktar: 1 }]));
    expect(await dene()).toEqual(["ONAY_BEKLIYOR"]);
    await prisma.$transaction((tx) => blokKarariVer(tx, { blokId: blok.id, karar: "RED", not: "Hayır", yapanId: s.yonetici.id }));
    expect(await dene()).toEqual(["ONAY_REDDEDILDI"]);
    await prisma.approvalBlock.create({
      data: { documentType: "SIP", documentId: o.id, ruleCode: "ISKONTO_TAVANI", openedById: s.satici.id, openReason: "Yeniden", decision: "ONAY", decidedById: s.yonetici.id, decidedAt: new Date(), decisionNote: "Tamam" },
    });
    expect(await dene()).toEqual([]);
  });
});

describe("F-06 — eşzamanlı sevkiyat negatif stoğa düşerse aşım izlidir (B-4-4, A-8-8)", () => {
  it("iki eşzamanlı sevkiyat: ikincisi kilitte bekler, düşüşü görür; gerekçeyle yazılır ve ONAY'lı blok bırakır", async () => {
    // Stok 100; her sipariş 60 adet.
    const o1 = await siparis({ kalemler: [{ miktar: 60, birim: "10" }] });
    const o2 = await siparis({ kalemler: [{ miktar: 60, birim: "10" }] });
    const sevkEt = (o: typeof o1, bekleMs: number) =>
      prisma.$transaction(async (tx) => {
        const r = await sevkiyatYaz(tx, {
          siparisId: o.id,
          kalemler: [{ siparisKalemiId: o.items[0].id, miktar: 60 }],
          carrierId: null,
          trackingNumber: null,
          externalDispatchNo: null,
          yapan: yonetici(),
          gerekce: "Depoda fazlası var",
        });
        await bekle(bekleMs);
        return r;
      });
    const birinci = sevkEt(o1, 300);
    await bekle(100);
    const [r1, r2] = await Promise.all([birinci, sevkEt(o2, 0)]);
    expect([r1.durum, r2.durum]).toEqual(["SEVK_EDILDI", "SEVK_EDILDI"]);
    expect(await hesaplaStok(s.urun.id)).toBe(-20);
    // İz yalnız stoğu eksiye düşüren ikinci siparişte (F-06: "tam olarak biri" değil, "aşım izli").
    expect(await prisma.approvalBlock.findMany({ select: { documentId: true, ruleCode: true, decision: true } })).toEqual([
      { documentId: o2.id, ruleCode: "NEGATIF_STOK", decision: "ONAY" },
    ]);
  });
});

describe("F-12 — RULE-04: fiyat sipariş anında donar", () => {
  it("liste fiyatı sonradan değişse de sipariş satırı ve sevkiyat borcu donmuş fiyattan", async () => {
    const o = await siparis({ kalemler: [{ miktar: 2, birim: "100" }] });
    await prisma.priceListItem.create({ data: { priceListId: s.liste.id, productId: s.urun.id, listPrice: "999" } });
    await prisma.orderItem.findUniqueOrThrow({ where: { id: o.items[0].id } }).then((i) => expect(i.unitPrice.toFixed(2)).toBe("100.00"));
    await sevk(o.id, [{ siparisKalemiId: o.items[0].id, miktar: 2 }]);
    // 100 × 2 = 200 + %20 KDV = 240
    expect((await prisma.ledgerEntry.findFirstOrThrow()).amount.toFixed(2)).toBe("240.00");
  });
});

describe("D-3-1 — kargo bilgisi sevkiyatta", () => {
  it("kargo firması ve takip no isteğe bağlı taşınır; gönderi günü otomatik (sevk günü)", async () => {
    const o = await siparis();
    const firma = await prisma.carrier.findFirstOrThrow();
    const r = sevkEdildi(
      await prisma.$transaction((tx) =>
        sevkiyatYaz(tx, {
          siparisId: o.id,
          kalemler: [{ siparisKalemiId: o.items[0].id, miktar: 1 }],
          carrierId: firma.id,
          trackingNumber: "TR123",
          externalDispatchNo: null,
          yapan: yonetici(),
          gerekce: null,
        })
      )
    );
    const sv = await prisma.shipment.findUniqueOrThrow({ where: { id: r.sevkiyatId } });
    expect([sv.carrierId, sv.trackingNumber, sv.shippedOn?.toISOString().slice(0, 10)]).toEqual([
      firma.id,
      "TR123",
      bugun().toISOString().slice(0, 10),
    ]);
  });
});
