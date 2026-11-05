import { describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { bakiyeSerisi } from "@/lib/doctor-cari";
import { dashboardAraligi, donemCoz, karsilastirmaAraliklari, sonAylar } from "@/lib/donem";
import { ciroOku, ciroOzeti, enCokSevkEdilenler, kapsayanAralik, saticiCiroSerileri, saticiTahsilatOzeti, tahsilatToplamlari } from "@/lib/reports-service";
import { referansVeri, yeniDoktorVerisi } from "../../test/integration/referans";

// KPI sorguları (tasarım 2. tur, ADR-010): ciro serisi ve karşılaştırması getCiroTotal ile aynı
// yoldan, satıcı kapsamı sorguda, tahsilat ve bakiye toplamı veritabanında.

const AN = new Date("2026-10-26T11:00:00Z"); // 26 Ekim 14:00 İstanbul
const AYLAR = sonAylar(6, { yil: 2026, ay: 10 }, AN); // Mayıs … Ekim
const K = karsilastirmaAraliklari(donemCoz("2026-10", AN), AN); // 1–26 Ekim vs 1–26 Eylül
const SIRKET = { tur: "sirket" } as const;

let no = 0;

async function kullanici(ad: string) {
  return prisma.user.create({ data: { name: ad, email: `${ad.toLowerCase()}@medikal.local`, passwordHash: "x", role: "SATICI" } });
}

async function doktor() {
  return prisma.doctor.create({ data: yeniDoktorVerisi(`Dr. ${++no}`) });
}

type Satir = { unitPrice: string; quantity: number; isFree?: boolean; primOrani?: string };

async function sevkliSiparis(
  sellerId: string | null,
  doctorId: string,
  shippedAt: Date,
  satirlar: Satir[],
  siparis: { stage?: "TEKLIF" | "ONAYLI"; status?: "BEKLIYOR" | "IPTAL"; urunAdi?: string } = {}
) {
  const { kdv20 } = await referansVeri();
  no += 1;
  const ad = siparis.urunAdi ?? `Ü${no}`;
  const urun =
    (await prisma.product.findFirst({ where: { name: ad } })) ??
    (await prisma.product.create({ data: { name: ad, code: `U${no}`, taxRateId: kdv20.id } }));
  const order = await prisma.order.create({
    data: {
      documentNo: `SIP-K-${no}`,
      sellerId,
      doctorId,
      paymentTermDays: 30,
      stage: siparis.stage ?? "ONAYLI",
      status: siparis.status ?? "BEKLIYOR",
      items: {
        create: satirlar.map((s) => ({
          productId: urun.id,
          quantity: s.quantity,
          listPrice: s.unitPrice,
          unitPrice: s.unitPrice,
          vatRate: "20",
          isFree: s.isFree ?? false,
          freeReason: s.isFree ? "NUMUNE" : null,
        })),
      },
    },
    include: { items: { orderBy: { id: "asc" } } },
  });
  await prisma.shipment.create({
    data: {
      documentNo: `SVK-K-${no}`,
      orderId: order.id,
      shippedAt,
      items: {
        create: order.items.map((it, i) => ({
          orderItemId: it.id,
          quantity: satirlar[i].quantity,
          commissionRate: satirlar[i].primOrani ?? null,
        })),
      },
    },
  });
  return order;
}

async function iadeEt(order: { doctorId: string; items: { id: string }[] }, adet: number, createdAt: Date) {
  const { depo } = await referansVeri();
  const yapan = await prisma.user.findFirstOrThrow();
  no += 1;
  await prisma.returnNote.create({
    data: {
      documentNo: `IAD-K-${no}`,
      doctorId: order.doctorId,
      locationId: depo.id,
      reason: "test",
      createdById: yapan.id,
      createdAt,
      items: { create: [{ orderItemId: order.items[0].id, quantity: adet, vatRate: "20" }] },
    },
  });
}

async function tahsilat(doctorId: string, amount: string, paidAt: Date, status: "AKTIF" | "IPTAL" = "AKTIF") {
  const { havale } = await referansVeri();
  const kaydeden = await prisma.user.findFirstOrThrow();
  no += 1;
  return prisma.doctorPayment.create({
    data: {
      documentNo: `THS-K-${no}`,
      doctorId,
      amount,
      paymentMethodId: havale.id,
      commissionRate: "0",
      commissionAmount: "0",
      recordedBy: kaydeden.id,
      paidAt,
      status,
    },
  });
}

const metin = (degerler: { toFixed(dp: number): string }[]) => degerler.map((d) => d.toFixed(2));

describe("ciroOzeti — aylık seri ve aynı gün aralığı karşılaştırması", () => {
  it("boş veritabanında ciro gerçek sıfırdır: seri sıfır, dönem ve önceki dönem sıfır", async () => {
    const o = await ciroOzeti({ kovalar: AYLAR, ...K }, SIRKET);
    expect(metin(o.seri)).toEqual(["0.00", "0.00", "0.00", "0.00", "0.00", "0.00"]);
    expect(o.simdi.ciro.toFixed(2)).toBe("0.00");
    expect(o.onceki?.ciro.toFixed(2)).toBe("0.00");
  });

  it("satır İstanbul ayına düşer; karşılaştırma ayın aynı günlerini alır", async () => {
    const ali = await kullanici("Ali");
    const d = await doktor();
    await sevkliSiparis(ali.id, d.id, new Date("2026-09-30T20:59:00Z"), [{ unitPrice: "100", quantity: 1 }]); // 30 Eylül 23:59
    await sevkliSiparis(ali.id, d.id, new Date("2026-09-30T21:00:00Z"), [{ unitPrice: "200", quantity: 1 }]); // 1 Ekim 00:00
    await sevkliSiparis(ali.id, d.id, new Date("2026-09-27T09:00:00Z"), [{ unitPrice: "50", quantity: 1 }]); // 27 Eylül — aralık dışı
    await sevkliSiparis(ali.id, d.id, new Date("2026-10-26T12:00:00Z"), [{ unitPrice: "70", quantity: 1 }]); // AN'dan sonra

    const o = await ciroOzeti({ kovalar: AYLAR, ...K }, SIRKET);
    expect(metin(o.seri).slice(4)).toEqual(["150.00", "270.00"]); // Eylül: 100 + 50, Ekim: 200 + 70
    expect(o.simdi.ciro.toFixed(2)).toBe("200.00"); // 1–26 Ekim 14:00
    expect(o.onceki?.ciro.toFixed(2)).toBe("0.00"); // 1–26 Eylül 14:00: 27 ve 30 Eylül dışarıda
  });

  it("iade ciroyu kendi ayında düşürür; iade toplamı pozitiftir; hakediş donmuş orandan", async () => {
    const ali = await kullanici("Ali");
    const d = await doktor();
    const s = await sevkliSiparis(ali.id, d.id, new Date("2026-10-05T09:00:00Z"), [{ unitPrice: "100", quantity: 3, primOrani: "10" }]);
    await iadeEt(s, 1, new Date("2026-10-10T09:00:00Z"));

    const o = await ciroOzeti({ kovalar: AYLAR, ...K }, SIRKET);
    expect(o.simdi.ciro.toFixed(2)).toBe("200.00");
    expect(o.simdi.iade.toFixed(2)).toBe("100.00");
    expect(o.simdi.hakedis.toFixed(2)).toBe("30.00"); // iade satırının oranı boş: prim düşmez
  });

  it("satıcı kapsamı sorgudadır: satıcı yalnız kendi siparişlerinin cirosunu alır", async () => {
    const ali = await kullanici("Ali");
    const veli = await kullanici("Veli");
    const d = await doktor();
    await sevkliSiparis(ali.id, d.id, new Date("2026-10-05T09:00:00Z"), [{ unitPrice: "100", quantity: 1 }]);
    await sevkliSiparis(veli.id, d.id, new Date("2026-10-06T09:00:00Z"), [{ unitPrice: "900", quantity: 1 }]);

    const aliOzeti = await ciroOzeti({ kovalar: AYLAR, ...K }, { tur: "satici", saticiId: ali.id });
    expect(aliOzeti.simdi.ciro.toFixed(2)).toBe("100.00");
    expect((await ciroOzeti({ kovalar: AYLAR, ...K }, SIRKET)).simdi.ciro.toFixed(2)).toBe("1000.00");
    const seriler = await saticiCiroSerileri(AYLAR, [ali.id, veli.id], ciroOku(kapsayanAralik(AYLAR.map((a) => a.aralik)), SIRKET));
    expect(seriler.get(veli.id)![5].toFixed(2)).toBe("900.00");
    expect(seriler.get(ali.id)![5].toFixed(2)).toBe("100.00");
  });

  it("hafta kovası (dashboard 'bu ay'): sevk İstanbul haftasına düşer; dönem toplamı aynı yoldan", async () => {
    const r = dashboardAraligi("ay", new Date("2026-10-27T11:00:00Z")); // Salı 27 Ekim 14:00
    const ali = await kullanici("Ali");
    const d = await doktor();
    await sevkliSiparis(ali.id, d.id, new Date("2026-10-25T20:30:00Z"), [{ unitPrice: "100", quantity: 1 }]); // Pazar 25 Ekim 23:30
    await sevkliSiparis(ali.id, d.id, new Date("2026-10-25T21:30:00Z"), [{ unitPrice: "40", quantity: 1 }]); // Pazartesi 26 Ekim 00:30

    const o = await ciroOzeti(r, SIRKET);
    expect(o.seri).toHaveLength(12);
    expect(metin(o.seri).slice(-2)).toEqual(["100.00", "40.00"]);
    expect(o.simdi.ciro.toFixed(2)).toBe("140.00"); // 1–27 Ekim 14:00
  });
});

describe("tahsilatToplamlari — aralık başına SUM, tek sorgu", () => {
  it("yalnız AKTIF tahsilat; aralık yarı açık", async () => {
    await kullanici("Kasa"); // tahsilatı kaydeden
    const d = await doktor();
    await tahsilat(d.id, "500.00", new Date("2026-10-05T09:00:00Z"));
    await tahsilat(d.id, "999.00", new Date("2026-10-06T09:00:00Z"), "IPTAL");
    await tahsilat(d.id, "250.00", new Date("2026-09-05T09:00:00Z"));
    await tahsilat(d.id, "75.00", K.simdi.bitis); // aralığın ilk dışı anı

    const [ekim, eylul] = await tahsilatToplamlari([K.simdi, K.onceki!]);
    expect(ekim.toFixed(2)).toBe("500.00");
    expect(eylul.toFixed(2)).toBe("250.00");
  });
});

describe("saticiTahsilatOzeti — X-17 §(3) atfı, iki dönem (Raporum)", () => {
  it("satıcının doktorlarının AKTIF tahsilatı; başka satıcınınki ve sahipsiz doktorunki sayılmaz", async () => {
    const ali = await kullanici("Ali");
    const veli = await kullanici("Veli");
    const aliDr = await prisma.doctor.create({ data: { ...yeniDoktorVerisi(`Dr. ${++no}`), ownerSellerId: ali.id } });
    const veliDr = await prisma.doctor.create({ data: { ...yeniDoktorVerisi(`Dr. ${++no}`), ownerSellerId: veli.id } });
    const sahipsiz = await doktor();
    await tahsilat(aliDr.id, "300.00", new Date("2026-10-05T09:00:00Z"));
    await tahsilat(aliDr.id, "999.00", new Date("2026-10-06T09:00:00Z"), "IPTAL");
    await tahsilat(aliDr.id, "120.00", new Date("2026-09-05T09:00:00Z"));
    await tahsilat(aliDr.id, "50.00", new Date("2026-09-28T09:00:00Z")); // önceki dönemin dışında (1–26 Eylül)
    await tahsilat(veliDr.id, "900.00", new Date("2026-10-06T09:00:00Z"));
    await tahsilat(sahipsiz.id, "70.00", new Date("2026-10-07T09:00:00Z"));

    const o = await saticiTahsilatOzeti(K, ali.id);
    expect(o.simdi.toFixed(2)).toBe("300.00");
    expect(o.onceki?.toFixed(2)).toBe("120.00");
    expect((await saticiTahsilatOzeti({ simdi: K.simdi, onceki: null }, ali.id)).onceki).toBeNull();
    expect((await saticiTahsilatOzeti(K, veli.id)).simdi.toFixed(2)).toBe("900.00");
  });
});

describe("enCokSevkEdilenler — adet, sayılan belgeler", () => {
  it("ürün başına sevk adedi büyükten küçüğe; bedelsiz, TEKLIF ve iptal sayılmaz", async () => {
    const d = await doktor();
    const ekim = new Date("2026-10-05T09:00:00Z");
    await sevkliSiparis(null, d.id, ekim, [{ unitPrice: "10", quantity: 5 }], { urunAdi: "Eldiven" });
    await sevkliSiparis(null, d.id, ekim, [{ unitPrice: "10", quantity: 3 }], { urunAdi: "Eldiven" });
    await sevkliSiparis(null, d.id, ekim, [{ unitPrice: "10", quantity: 4 }], { urunAdi: "Maske" });
    await sevkliSiparis(null, d.id, ekim, [{ unitPrice: "10", quantity: 50, isFree: true }], { urunAdi: "Numune" });
    await sevkliSiparis(null, d.id, ekim, [{ unitPrice: "10", quantity: 40 }], { urunAdi: "Teklif", stage: "TEKLIF" });

    const liste = await enCokSevkEdilenler(K.simdi, 5);
    expect(liste.map((u) => [u.ad, u.miktar])).toEqual([
      ["Eldiven", 8],
      ["Maske", 4],
    ]);
  });
});

describe("bakiyeSerisi — ay sonu bakiyeleri (K-2)", () => {
  it("her sınırdan önceki hareketlerin işaretli toplamı; avans negatiftir", async () => {
    const d = await doktor();
    const yapan = await prisma.user.create({ data: { name: "Y", email: "y@medikal.local", passwordHash: "x", role: "YONETICI" } });
    const hareket = (direction: "BORC" | "ALACAK", amount: string, createdAt: Date) =>
      prisma.ledgerEntry.create({
        data: { doctorId: d.id, type: direction === "BORC" ? "SEVKIYAT" : "TAHSILAT", direction, amount, documentNo: "T", createdById: yapan.id, createdAt },
      });
    await hareket("BORC", "1000.00", new Date("2026-08-10T09:00:00Z"));
    await hareket("ALACAK", "400.00", new Date("2026-09-10T09:00:00Z"));
    await hareket("ALACAK", "900.00", new Date("2026-10-10T09:00:00Z"));

    const seri = await bakiyeSerisi(d.id, AYLAR.slice(3).map((a) => a.aralik.bitis)); // Ağustos, Eylül, Ekim sonu
    expect(metin(seri)).toEqual(["1000.00", "600.00", "-300.00"]);
  });
});
