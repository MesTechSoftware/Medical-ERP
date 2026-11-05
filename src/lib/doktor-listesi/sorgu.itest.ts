import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { hesaplaDoktorRisk } from "@/lib/doctor-cari";
import { degistirDoktorSahibi } from "@/lib/sahiplik";
import { BOS_SUZGEC, SATICI_KARTLARI, type DoktorSuzgeci } from "@/lib/doktor-listesi/suzgec";
import { kapsamliDoktorlariGetir } from "@/lib/doctor";
import {
  doktorBolgeleri,
  saticiDoktorKpileri,
  saticiDoktorPaneli,
  doktorKpileri,
  doktorListesi,
  doktorPaneli,
  doktorSuzgecSecenekleri,
  doktorWhere,
} from "@/lib/doktor-listesi/sorgu";
import { referansVeri, yeniDoktorVerisi } from "../../../test/integration/referans";

// Cari listesi sorguları — KABUL_KRITERLERI A-5-7, A-13-3, X-8-4; Doktorlarım kapsamı X-13-4 (Ü-32).

const AN = new Date("2026-10-27T09:00:00Z"); // İstanbul 27.10.2026 12:00
const SAYFA = { skip: 0, take: 100 };

let yapanId = "";
let urunId = "";
let no = 0;

/** Fatura bilgisi tam (A-13-2'ye göre eksik değil). */
const TAM_FATURA = { taxId: "1234567890", invoiceAddress: "Adres", invoiceCity: "İstanbul", taxOffice: "Kadıköy" };

async function doktor(ad: string, ek: Record<string, unknown> = {}) {
  return prisma.doctor.create({ data: { ...yeniDoktorVerisi(ad), ...TAM_FATURA, ...ek } });
}

async function sahip(doktorId: string, saticiId: string) {
  await prisma.$transaction((tx) => degistirDoktorSahibi([doktorId], saticiId, { metin: "test", yapanId }, tx));
}

function siparis(doktorId: string, orderDate: string, stage: "TEKLIF" | "ONAYLI" = "ONAYLI", status: "BEKLIYOR" | "IPTAL" = "BEKLIYOR") {
  no += 1;
  return prisma.order.create({
    data: {
      documentNo: `SIP-L-${no}`,
      doctorId: doktorId,
      paymentTermDays: 30,
      stage,
      status,
      orderDate: new Date(orderDate),
      items: { create: [{ productId: urunId, quantity: 1, listPrice: "100", unitPrice: "100", vatRate: "20", isFree: false }] },
    },
  });
}

const adlar = async (s: Partial<DoktorSuzgeci>) =>
  (await doktorListesi({ ...BOS_SUZGEC, ...s }, SAYFA, {}, AN)).satirlar.map((d) => d.fullName).sort();

beforeEach(async () => {
  const ref = await referansVeri();
  const u = await prisma.user.create({ data: { name: "Y", email: "y@medikal.local", passwordHash: "x", role: "YONETICI" } });
  const p = await prisma.product.create({ data: { name: "Ü", code: "U1", taxRateId: ref.kdv20.id } });
  yapanId = u.id;
  urunId = p.id;
});

describe("son sipariş — sayılan sipariş (A-5-7)", () => {
  it("TEKLIF ve IPTAL sayılmaz", async () => {
    const d = await doktor("Dr. Son");
    await siparis(d.id, "2026-10-20T09:00:00Z", "TEKLIF");
    await siparis(d.id, "2026-10-22T09:00:00Z", "ONAYLI", "IPTAL");
    await siparis(d.id, "2026-10-01T09:00:00Z");
    const [satir] = (await doktorListesi(BOS_SUZGEC, SAYFA, {}, AN)).satirlar;
    expect(satir.sonSiparis?.toISOString()).toBe("2026-10-01T09:00:00.000Z");
  });

  it("siparişsiz doktorun son siparişi yoktur", async () => {
    await doktor("Dr. Yeni");
    expect((await doktorListesi(BOS_SUZGEC, SAYFA, {}, AN)).satirlar[0].sonSiparis).toBeNull();
  });

  it("sessiz=30 bugün dahil 30 İstanbul günüdür", async () => {
    const gece = await doktor("Dr. Gece Yarısı Sonrası");
    await siparis(gece.id, "2026-09-27T21:30:00Z"); // İstanbul 28.09 00:30 — son 30 gün içinde
    const once = await doktor("Dr. Gece Yarısı Öncesi");
    await siparis(once.id, "2026-09-27T20:30:00Z"); // İstanbul 27.09 23:30 — 31. gün
    expect(await adlar({ sessiz: "30" })).toEqual(["Dr. Gece Yarısı Öncesi"]);
  });

  it("sessiz=hic: yalnız sayılan siparişi olmayanlar", async () => {
    const teklifli = await doktor("Dr. Teklifli");
    await siparis(teklifli.id, "2026-10-20T09:00:00Z", "TEKLIF");
    const onayli = await doktor("Dr. Onaylı");
    await siparis(onayli.id, "2026-01-01T09:00:00Z");
    expect(await adlar({ sessiz: "hic" })).toEqual(["Dr. Teklifli"]);
  });

  it("aralık: son siparişi aralıkta olanlar", async () => {
    const icinde = await doktor("Dr. İçinde");
    await siparis(icinde.id, "2026-10-05T09:00:00Z");
    const sonra = await doktor("Dr. Sonra Yine");
    await siparis(sonra.id, "2026-10-05T09:00:00Z");
    await siparis(sonra.id, "2026-10-20T09:00:00Z");
    const eski = await doktor("Dr. Eski");
    await siparis(eski.id, "2026-09-01T09:00:00Z");
    expect(await adlar({ sonBas: "2026-10-01", sonBit: "2026-10-15" })).toEqual(["Dr. İçinde"]);
  });

  it("aralığın bitiş günü dahildir (İstanbul günü sonu)", async () => {
    const d = await doktor("Dr. Son Gün");
    await siparis(d.id, "2026-10-15T20:30:00Z"); // İstanbul 15.10 23:30
    expect(await adlar({ sonBit: "2026-10-15" })).toEqual(["Dr. Son Gün"]);
    expect(await adlar({ sonBit: "2026-10-14" })).toEqual([]);
  });

  it("tek uç: başlangıç", async () => {
    const yeni = await doktor("Dr. Yeni Sipariş");
    await siparis(yeni.id, "2026-10-20T09:00:00Z");
    const eski = await doktor("Dr. Eski Sipariş");
    await siparis(eski.id, "2026-09-01T09:00:00Z");
    await doktor("Dr. Siparişsiz");
    expect(await adlar({ sonBas: "2026-10-01" })).toEqual(["Dr. Yeni Sipariş"]);
  });
});

describe("birleşik süzgeç (X-8-4)", () => {
  it("bütün alanlar birlikte daraltır", async () => {
    const satici = await prisma.user.create({ data: { name: "Ayşe", email: "a@medikal.local", passwordHash: "x", role: "SATICI" } });
    const hedef = await doktor("Dr. Hedef", { region: "Marmara", taxId: null });
    await sahip(hedef.id, satici.id);
    const baskaBolge = await doktor("Dr. Ege", { region: "Ege", taxId: null });
    await sahip(baskaBolge.id, satici.id);
    const tamFatura = await doktor("Dr. Tam", { region: "Marmara" });
    await sahip(tamFatura.id, satici.id);
    const pasif = await doktor("Dr. Pasif", { region: "Marmara", taxId: null, status: "PASIF" });
    await sahip(pasif.id, satici.id);
    await doktor("Dr. Sahipsiz", { region: "Marmara", taxId: null });

    expect(
      await adlar({ sinif: "DOKTOR", bolge: "Marmara", satici: satici.id, durum: "AKTIF", fatura: "eksik" })
    ).toEqual(["Dr. Hedef"]);
  });

  it("satici=yok sahipsiz DOKTOR'dur; bayi dönmez", async () => {
    await doktor("Dr. Sahipsiz");
    await prisma.doctor.create({ data: { ...yeniDoktorVerisi("Bayi A"), accountClass: "BAYI", clinic: null, region: null } });
    expect(await adlar({ satici: "yok" })).toEqual(["Dr. Sahipsiz"]);
  });

  it("doktorWhere varsayılan anı kullanır", () => {
    expect(doktorWhere(BOS_SUZGEC)).toEqual({ AND: [] });
  });
});

describe("satır özetleri", () => {
  it("eksikFatura işareti süzgeçle aynı küme (A-13-3)", async () => {
    await doktor("Dr. Tam");
    await doktor("Dr. Adressiz", { invoiceAddress: null });
    await doktor("Dr. Vergi Dairesiz", { taxOffice: null });
    await doktor("Dr. Gerçek Kişi", { partyType: "GERCEK_KISI", taxOffice: null });
    const isaretli = (await doktorListesi(BOS_SUZGEC, SAYFA, {}, AN)).satirlar.filter((d) => d.eksikFatura).map((d) => d.fullName).sort();
    expect(isaretli).toEqual(await adlar({ fatura: "eksik" }));
    expect(isaretli).toEqual(["Dr. Adressiz", "Dr. Vergi Dairesiz"]);
  });

  it("risk satırı hesaplaDoktorRisk ile aynı", async () => {
    const d = await doktor("Dr. Riskli", { creditLimit: "100" });
    await siparis(d.id, "2026-10-20T09:00:00Z");
    const [satir] = (await doktorListesi(BOS_SUZGEC, SAYFA, {}, AN)).satirlar;
    const tekli = await hesaplaDoktorRisk(d.id);
    expect(satir.risk.risk.toFixed(2)).toBe(tekli.risk.toFixed(2));
    expect(satir.risk.limitAsildi).toBe(true);
  });

  it("toplam süzgeçli sayıdır; sayfa sırası ada göre", async () => {
    await doktor("Dr. B");
    await doktor("Dr. A");
    await doktor("Dr. C", { region: "Ege" });
    const r = await doktorListesi({ ...BOS_SUZGEC, bolge: "Bölge" }, { skip: 0, take: 1 }, {}, AN);
    expect(r.toplam).toBe(2);
    expect(r.satirlar.map((d) => d.fullName)).toEqual(["Dr. A"]);
  });
});

describe("KPI ve seçenekler", () => {
  it("KPI sayıları süzgeçten bağımsızdır", async () => {
    const satici = await prisma.user.create({ data: { name: "Ayşe", email: "a@medikal.local", passwordHash: "x", role: "SATICI" } });
    const sahipli = await doktor("Dr. Sahipli");
    await sahip(sahipli.id, satici.id);
    const pasif = await doktor("Dr. Pasif", { status: "PASIF" });
    await sahip(pasif.id, satici.id);
    await doktor("Dr. Sahipsiz Eksik", { taxId: null });
    expect(await doktorKpileri()).toEqual({ toplam: 3, aktif: 2, sahipsiz: 1, eksikFatura: 1 });
  });

  it("bölgeler tekil, boşsuz, sıralı; pasif satıcı yok", async () => {
    await doktor("Dr. 1", { region: "Marmara" });
    await doktor("Dr. 2", { region: "Ege" });
    await doktor("Dr. 3", { region: "Ege" });
    await doktor("Dr. 4", { region: "İç Anadolu" });
    await prisma.doctor.create({ data: { ...yeniDoktorVerisi("Bayi"), accountClass: "BAYI", clinic: null, region: null } });
    await prisma.user.create({ data: { name: "Zeynep", email: "z@medikal.local", passwordHash: "x", role: "SATICI" } });
    await prisma.user.create({ data: { name: "Ali", email: "ali@medikal.local", passwordHash: "x", role: "SATICI", isActive: false } });
    const s = await doktorSuzgecSecenekleri();
    expect(s.bolgeler).toEqual(["Ege", "İç Anadolu", "Marmara"]);
    expect(s.saticilar.map((x) => x.name)).toEqual(["Zeynep"]);
  });
});

describe("doktorPaneli", () => {
  it("bilinmeyen kimlik null", async () => {
    expect(await doktorPaneli("yok")).toBeNull();
  });

  it("eksik fatura işareti A-13-2 tanımıdır (A-13-3)", async () => {
    const tam = await doktor("Dr. Tam");
    const eksik = await doktor("Dr. Eksik", { invoiceCity: null });
    expect((await doktorPaneli(tam.id))!.eksikFatura).toBe(false);
    expect((await doktorPaneli(eksik.id))!.eksikFatura).toBe(true);
  });

  it("sınırlar 5/5/3, en yeni önce; sipariş toplamı brüt", async () => {
    const d = await doktor("Dr. Panel");
    for (let i = 1; i <= 6; i++) await siparis(d.id, `2026-10-0${i}T09:00:00Z`);
    for (let i = 1; i <= 6; i++) {
      await prisma.ledgerEntry.create({
        data: { doctorId: d.id, type: "SEVKIYAT", direction: "BORC", amount: `${i}`, documentNo: `L${i}`, createdById: yapanId, createdAt: new Date(`2026-10-0${i}T09:00:00Z`) },
      });
    }
    const saticilar = await Promise.all(
      ["S1", "S2", "S3", "S4"].map((n, i) => prisma.user.create({ data: { name: n, email: `${n}@medikal.local`, passwordHash: "x", role: "SATICI", phone: `${i}` } }))
    );
    for (const s of saticilar) await sahip(d.id, s.id);

    const p = (await doktorPaneli(d.id))!;
    expect(p.doktor.fullName).toBe("Dr. Panel");
    expect(p.doktor.ownerSeller?.name).toBe("S4");
    expect(p.siparisler.map((s) => s.orderDate.toISOString().slice(0, 10))).toEqual(["2026-10-06", "2026-10-05", "2026-10-04", "2026-10-03", "2026-10-02"]);
    expect(p.siparisler[0].toplam.toFixed(2)).toBe("120.00");
    expect(p.hareketler.map((h) => h.documentNo)).toEqual(["L6", "L5", "L4", "L3", "L2"]);
    expect(p.devirler.map((x) => [x.from, x.to])).toEqual([["S3", "S4"], ["S2", "S3"], ["S1", "S2"]]);
    expect(p.risk.bakiye.toFixed(2)).toBe("21.00");
  });
});

describe("Doktorlarım kapsamı (Ü-32, X-13-4)", () => {
  it("liste, kartlar, bölgeler ve panel yalnız satıcının DOKTOR carileri; kart = süzgecin satırı", async () => {
    const ayse = await prisma.user.create({ data: { name: "Ayşe", email: "ayse@medikal.local", passwordHash: "x", role: "SATICI" } });
    const can = await prisma.user.create({ data: { name: "Can", email: "can@medikal.local", passwordHash: "x", role: "SATICI" } });
    const k = kapsamliDoktorlariGetir({ id: ayse.id, role: "SATICI" });

    const aktif = await doktor("Dr. Aktif", { region: "Ege" });
    const pasif = await doktor("Dr. Pasif", { region: "Ege", status: "PASIF" });
    const sessiz = await doktor("Dr. Sessiz", { region: "Marmara" });
    const baska = await doktor("Dr. Başkası", { region: "Karadeniz" });
    await doktor("Dr. Sahipsiz", { region: "Akdeniz" });
    for (const d of [aktif, pasif, sessiz]) await sahip(d.id, ayse.id);
    await sahip(baska.id, can.id);
    // Aktif doktorun dün siparişi var; Sessiz'in 100 gün önce; Pasif'in hiç yok.
    const tarih = (gunOnce: number) => new Date(AN.getTime() - gunOnce * 86_400_000);
    const sip = async (doktorId: string, sellerId: string, gunOnce: number) => {
      no += 1;
      return prisma.order.create({
        data: {
          documentNo: `SIP-K-${no}`, doctorId: doktorId, sellerId, paymentTermDays: 30, stage: "ONAYLI", status: "BEKLIYOR", orderDate: tarih(gunOnce),
          items: { create: [{ productId: urunId, quantity: 1, listPrice: "100", unitPrice: "100", vatRate: "20", isFree: false }] },
        },
      });
    };
    const kendi = await sip(aktif.id, ayse.id, 1);
    await sip(sessiz.id, ayse.id, 100);
    // Aynı doktora başka satıcının (devir öncesi) siparişi panelde "son siparişlerim"e girmez.
    await sip(aktif.id, can.id, 2);

    const ad = async (s: Partial<DoktorSuzgeci>) => (await doktorListesi({ ...BOS_SUZGEC, ...s }, SAYFA, k, AN)).satirlar.map((d) => d.fullName).sort();
    expect(await ad({})).toEqual(["Dr. Aktif", "Dr. Pasif", "Dr. Sessiz"]);
    // Adresten gelen satıcı süzgeci kapsamı genişletemez (kapsam AND ile birleşir).
    expect(await ad({ satici: can.id })).toEqual([]);

    const kpi = await saticiDoktorKpileri(k, AN);
    expect(kpi).toEqual({ toplam: 3, aktif: 2, sessiz90: 2, hic: 1 });
    for (const kart of SATICI_KARTLARI) expect(kpi[kart.anahtar]).toBe((await doktorListesi(kart.suzgec, SAYFA, k, AN)).toplam);

    expect(await doktorBolgeleri(k)).toEqual(["Ege", "Marmara"]);

    const panel = (await saticiDoktorPaneli(aktif.id, k, ayse.id))!;
    expect(panel.siparisler.map((o) => o.id)).toEqual([kendi.id]);
    expect(panel.risk.bakiye.isZero()).toBe(true);
    expect(await saticiDoktorPaneli(baska.id, k, ayse.id)).toBeNull();
  });
});

