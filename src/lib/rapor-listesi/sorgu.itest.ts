import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { degistirDoktorSahibi } from "@/lib/sahiplik";
import { doktorSiralamasi, saticiSecenekleri } from "@/lib/rapor-listesi/sorgu";
import { ciroOku, ciroOzeti, ciroOzetiAraligi, getSellerReports, kapsayanAralik, saticiCiroSerileri } from "@/lib/reports-service";
import { sonAylar } from "@/lib/donem";
import { BOS_SUZGEC, SAHIPSIZ, type RaporSuzgeci } from "@/lib/rapor-listesi/suzgec";
import { referansVeri, yeniDoktorVerisi } from "../../../test/integration/referans";

// Raporlar'ın doktor ciro sıralaması — KABUL_KRITERLERI X-1-2 (spec Ü-27 §4); Raporum kapsamı X-1-3 (Ü-33).

const EKIM = { baslangic: new Date("2026-09-30T21:00:00Z"), bitis: new Date("2026-10-31T21:00:00Z") };
const SAYFA = { skip: 0, take: 100 };
const SIRKET = { tur: "sirket" } as const;
const S = (ek: Partial<RaporSuzgeci>): RaporSuzgeci => ({ ...BOS_SUZGEC, ...ek });
let no = 0;

let yapan: { id: string };

async function doktor(ad: string, sahipId: string | null) {
  const d = await prisma.doctor.create({ data: yeniDoktorVerisi(ad) });
  if (sahipId) await prisma.$transaction((tx) => degistirDoktorSahibi([d.id], sahipId, { metin: "test", yapanId: yapan.id }, tx));
  return d;
}

/** Tek satırlık siparişi `shippedAt` anında sevk eder; matrah `fiyat`. */
async function sevk(doctorId: string, fiyat: string, shippedAt: Date, sellerId: string | null = null) {
  const { kdv20 } = await referansVeri();
  no += 1;
  const urun = await prisma.product.create({ data: { name: `Ü${no}`, code: `RU${no}`, taxRateId: kdv20.id } });
  const order = await prisma.order.create({
    data: {
      documentNo: `SIP-R-${no}`,
      doctorId,
      sellerId,
      paymentTermDays: 30,
      stage: "ONAYLI",
      status: "KARGOLANDI",
      items: { create: [{ productId: urun.id, quantity: 1, listPrice: fiyat, unitPrice: fiyat, vatRate: "20" }] },
    },
    include: { items: true },
  });
  await prisma.shipment.create({
    data: { documentNo: `SVK-R-${no}`, orderId: order.id, shippedAt, items: { create: [{ orderItemId: order.items[0].id, quantity: 1 }] } },
  });
  return order.items[0];
}

let ali: { id: string };
let ids: Record<string, string>;

beforeEach(async () => {
  const { depo } = await referansVeri();
  no += 1;
  ali = await prisma.user.create({ data: { name: "Ali", email: `ali${no}@medikal.local`, passwordHash: "x", role: "SATICI" } });
  yapan = await prisma.user.create({ data: { name: "Yön", email: `y${no}@medikal.local`, passwordHash: "x", role: "YONETICI" } });
  const ekim = new Date("2026-10-10T09:00:00Z");
  const a = await doktor("Dr. Ada", null);
  const b = await doktor("Dr. Bora", ali.id);
  const c = await doktor("Dr. Işık", ali.id);
  const d = await doktor("Dr. Deniz", null);
  const e = await doktor("Dr. Ece", null);
  await sevk(a.id, "300", ekim);
  await sevk(b.id, "200", ekim);
  await sevk(c.id, "200", ekim);
  // E: Eylül'de sevk, Ekim'de iade → Ekim cirosu −50
  const kalem = await sevk(e.id, "50", new Date("2026-09-10T09:00:00Z"));
  await prisma.returnNote.create({
    data: {
      documentNo: `IAD-R-${no}`,
      doctorId: e.id,
      locationId: depo.id,
      reason: "test",
      createdById: yapan.id,
      createdAt: ekim,
      items: { create: [{ orderItemId: kalem.id, quantity: 1, vatRate: "20" }] },
    },
  });
  ids = { a: a.id, b: b.id, c: c.id, d: d.id, e: e.id };
});

const ozet = (r: Awaited<ReturnType<typeof doktorSiralamasi>>) => r.satirlar.map((s) => [s.doctorId, s.sira, s.ciro.toFixed(2)]);

describe("doktor ciro sıralaması (X-1-2)", () => {
  it("sıfır ciro düşer, eksi ciro kalır; eşit ciroda ada göre; lider oranı 1", async () => {
    const r = await doktorSiralamasi(EKIM, BOS_SUZGEC, SAYFA, SIRKET);
    expect(ozet(r)).toEqual([
      [ids.a, 1, "300.00"],
      [ids.b, 2, "200.00"],
      [ids.c, 3, "200.00"],
      [ids.e, 4, "-50.00"],
    ]);
    expect(r.toplam).toBe(4);
    expect(r.satirlar[0].oran).toBe(1);
    expect(r.satirlar[3].oran).toBe(0);
  });

  it("satıcı süzgeci carinin sahibine bakar; sıra dönem sırasıdır", async () => {
    expect(ozet(await doktorSiralamasi(EKIM, S({ satici: ali.id }), SAYFA, SIRKET))).toEqual([
      [ids.b, 2, "200.00"],
      [ids.c, 3, "200.00"],
    ]);
    expect((await doktorSiralamasi(EKIM, S({ satici: SAHIPSIZ }), SAYFA, SIRKET)).satirlar.map((s) => s.doctorId)).toEqual([ids.a, ids.e]);
  });

  it("metin cari adına bakar (Türkçe I/ı); sayfalama", async () => {
    expect((await doktorSiralamasi(EKIM, S({ q: "IŞIK" }), SAYFA, SIRKET)).satirlar.map((s) => s.doctorId)).toEqual([ids.c]);
    expect((await doktorSiralamasi(EKIM, S({ q: "ışık" }), SAYFA, SIRKET)).satirlar.map((s) => s.doctorId)).toEqual([ids.c]);
    const r = await doktorSiralamasi(EKIM, BOS_SUZGEC, { skip: 2, take: 2 }, SIRKET);
    expect(ozet(r).map((x) => x[1])).toEqual([3, 4]);
    expect(r.toplam).toBe(4);
  });

  it("ASCII büyük I ile yazılmış ad küçük harfli aramada bulunur", async () => {
    const f = await doktor("DR. ISMAIL KAYA", null);
    await sevk(f.id, "10", new Date("2026-10-10T09:00:00Z"));
    expect((await doktorSiralamasi(EKIM, S({ q: "ismail" }), SAYFA, SIRKET)).satirlar.map((s) => s.doctorId)).toEqual([f.id]);
  });

  it("eşit ciro ve eşit adda sıra kimliğe göre sabittir", async () => {
    const x = await doktor("Dr. Aynı", null);
    const y = await doktor("Dr. Aynı", null);
    await sevk(y.id, "120", new Date("2026-10-10T09:00:00Z"));
    await sevk(x.id, "120", new Date("2026-10-10T09:00:00Z"));
    const sira = (await doktorSiralamasi(EKIM, S({ q: "aynı" }), SAYFA, SIRKET)).satirlar.map((s) => s.doctorId);
    expect(sira).toEqual([x.id, y.id].sort());
  });

  it("satıcı seçenekleri carisi olan eski satıcıyı da içerir", async () => {
    const terfi = await prisma.user.create({ data: { name: "Terfi", email: `t${no}@medikal.local`, passwordHash: "x", role: "SATICI" } });
    await doktor("Dr. Terfi Carisi", terfi.id);
    await prisma.user.update({ where: { id: terfi.id }, data: { role: "YONETICI" } });
    expect((await saticiSecenekleri()).map((u) => u.id)).toContain(terfi.id);
  });
});

describe("Raporum: satıcı kapsamlı sıralama (Ü-33, X-1-3)", () => {
  it("ciro yalnız satıcının siparişlerinden; devredilmiş carinin onunla cirosu da dahil; sıra ve oran kendi içinde", async () => {
    // beforeEach'in siparişleri satıcısızdır; Ali'nin kapsamına girmez.
    const veli = await prisma.user.create({ data: { name: "Veli", email: `veli${no}@medikal.local`, passwordHash: "x", role: "SATICI" } });
    const ekim = new Date("2026-10-10T09:00:00Z");
    const kendi = await doktor("Dr. Kendi", ali.id);
    const devredilen = await doktor("Dr. Devredilen", veli.id);
    await sevk(kendi.id, "100", ekim, ali.id);
    // Aynı cariye başka satıcının (Veli) siparişi Ali'nin cirosuna girmez.
    await sevk(kendi.id, "900", ekim, veli.id);
    // Ali'nin, sonradan Veli'ye devredilmiş cariye siparişi Ali'nindir (X-13).
    await sevk(devredilen.id, "400", ekim, ali.id);

    const ALI = { tur: "satici", saticiId: ali.id } as const;
    const r = await doktorSiralamasi(EKIM, BOS_SUZGEC, SAYFA, ALI);
    expect(r.satirlar.map((d) => [d.fullName, d.ciro.toFixed(2), d.sira])).toEqual([
      ["Dr. Devredilen", "400.00", 1],
      ["Dr. Kendi", "100.00", 2],
    ]);
    expect(r.satirlar[0].oran).toBe(1);
    // Şirket kapsamında aynı cari iki satıcının toplamıdır.
    const sirket = await doktorSiralamasi(EKIM, BOS_SUZGEC, SAYFA, SIRKET);
    expect(sirket.satirlar.find((d) => d.doctorId === kendi.id)?.ciro.toFixed(2)).toBe("1000.00");
  });
});

describe("paylaşılan ciro okuması — rapor ekranı satırları bir kez okur, sonuç ayrı okumayla aynıdır", () => {
  const EYLUL = { baslangic: new Date("2026-08-31T21:00:00Z"), bitis: new Date("2026-09-30T21:00:00Z") };
  const AN = new Date("2026-11-15T09:00:00Z");
  const yon = { id: "y", role: "YONETICI" as const };

  beforeEach(async () => {
    // Satıcılı sevkler: Ekim'de Bora'ya (Ali), Kasım'da Işık'a (Ali) — kapsam ve aralık süzgeci sınansın.
    await sevk(ids.b, "120.5", new Date("2026-10-20T09:00:00Z"), ali.id);
    await sevk(ids.c, "80", new Date("2026-11-03T09:00:00Z"), ali.id);
  });

  const tl = (d: { toFixed: (n: number) => string }) => d.toFixed(2);

  it("şirket okuması: sıralama, satıcı raporu, satıcı serisi ve KPI özeti ayrı okumayla aynı", async () => {
    const aylar = sonAylar(3, { yil: 2026, ay: 11 }, AN);
    const g = { kovalar: aylar, simdi: EKIM, onceki: EYLUL };
    const okuma = ciroOku(kapsayanAralik([ciroOzetiAraligi(g), EKIM]), SIRKET);

    expect(ozet(await doktorSiralamasi(EKIM, BOS_SUZGEC, SAYFA, SIRKET, okuma))).toEqual(ozet(await doktorSiralamasi(EKIM, BOS_SUZGEC, SAYFA, SIRKET)));

    const rapor = (r: Awaited<ReturnType<typeof getSellerReports>>) => r.map((x) => [x.sellerId, tl(x.ciro), tl(x.hakedis), x.ortalamaIskonto?.toFixed(2) ?? null]);
    const paylasilan = await getSellerReports(yon, EKIM, okuma);
    expect(rapor(paylasilan)).toEqual(rapor(await getSellerReports(yon, EKIM)));
    expect(paylasilan.find((x) => x.sellerId === ali.id)!.ciro.toFixed(2)).toBe("120.50");

    const seri = (m: Map<string, { toFixed: (n: number) => string }[]>) => m.get(ali.id)!.map(tl);
    expect(seri(await saticiCiroSerileri(aylar, [ali.id], okuma))).toEqual(seri(await saticiCiroSerileri(aylar, [ali.id], ciroOku(kapsayanAralik(aylar.map((a) => a.aralik)), SIRKET))));
    expect(seri(await saticiCiroSerileri(aylar, [ali.id], okuma))).toEqual(["0.00", "120.50", "80.00"]);

    const kpi = (o: Awaited<ReturnType<typeof ciroOzeti>>) => [o.seri.map(tl), tl(o.simdi.ciro), tl(o.simdi.iade), o.onceki && tl(o.onceki.ciro)];
    expect(kpi(await ciroOzeti(g, SIRKET, okuma))).toEqual(kpi(await ciroOzeti(g, SIRKET)));
  });

  it("satıcı okuması: Raporum'un sıralaması ve özeti ayrı okumayla aynı; başkasının cirosu girmez", async () => {
    const kapsam = { tur: "satici", saticiId: ali.id } as const;
    const g = { kovalar: sonAylar(2, { yil: 2026, ay: 10 }, AN), simdi: EKIM, onceki: EYLUL };
    const okuma = ciroOku(kapsayanAralik([ciroOzetiAraligi(g), EKIM]), kapsam);
    const paylasilan = await doktorSiralamasi(EKIM, BOS_SUZGEC, SAYFA, kapsam, okuma);
    expect(ozet(paylasilan)).toEqual(ozet(await doktorSiralamasi(EKIM, BOS_SUZGEC, SAYFA, kapsam)));
    expect(ozet(paylasilan)).toEqual([[ids.b, 1, "120.50"]]);
    expect(tl((await ciroOzeti(g, kapsam, okuma)).simdi.ciro)).toBe("120.50");
  });

  it("paylaşılan okuma düşerse hesap kendi okumasını yapar — bir okumanın hatası ekrandaki bütün hesapları düşürmez", async () => {
    const dusen = Promise.reject(new Error("okuma düştü"));
    dusen.catch(() => {});
    expect(ozet(await doktorSiralamasi(EKIM, BOS_SUZGEC, SAYFA, SIRKET, dusen))).toEqual(ozet(await doktorSiralamasi(EKIM, BOS_SUZGEC, SAYFA, SIRKET)));
  });

  it("okuma hesabın aralığını ya da kapsamını karşılamıyorsa hata verir (sessizce eksik sayılmaz)", async () => {
    const kasimOkumasi = ciroOku({ baslangic: new Date("2026-10-31T21:00:00Z"), bitis: new Date("2026-11-30T21:00:00Z") }, SIRKET);
    await expect(doktorSiralamasi(EKIM, BOS_SUZGEC, SAYFA, SIRKET, kasimOkumasi)).rejects.toThrow(/karşılamıyor/);
    const saticiOkumasi = ciroOku(EKIM, { tur: "satici", saticiId: ali.id });
    await expect(doktorSiralamasi(EKIM, BOS_SUZGEC, SAYFA, SIRKET, saticiOkumasi)).rejects.toThrow(/karşılamıyor/);
  });
});
