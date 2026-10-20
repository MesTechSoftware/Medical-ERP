import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db";
import { IsHatasi } from "@/lib/hata";
import { degistirDoktorSahibi } from "@/lib/sahiplik";
import { sevkiyatYaz } from "@/lib/sevkiyat";
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
        })),
      },
    },
    include: { items: { orderBy: { id: "asc" } } },
  });
}

const sevk = (siparisId: string, kalemler: { siparisKalemiId: string; miktar: number }[]) =>
  prisma.$transaction((tx) =>
    sevkiyatYaz(tx, { siparisId, kalemler, carrierId: null, trackingNumber: null, externalDispatchNo: "IRS-1", yapanId: s.yonetici.id })
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
      const r = await sevkiyatYaz(tx, {
        siparisId: o.id,
        kalemler: [{ siparisKalemiId: o.items[0].id, miktar: 10 }],
        carrierId: null,
        trackingNumber: null,
        externalDispatchNo: null,
        yapanId: s.yonetici.id,
      });
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
        yapanId: s.yonetici.id,
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
