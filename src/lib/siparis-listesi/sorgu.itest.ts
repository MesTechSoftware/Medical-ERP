import { beforeEach, describe, expect, it } from "vitest";

import type { OrderStatus } from "@/generated/prisma/enums";
import { siparisDagilimi } from "@/lib/dashboard";
import { prisma } from "@/lib/db";
import { siparisToplami } from "@/lib/siparis";
import { gunleriAraliga, siparisKpileri, siparisListesi, siparisPaneli } from "@/lib/siparis-listesi/sorgu";
import { BOS_SUZGEC, TUM_SIPARISLER, type SiparisKapsami, type SiparisSuzgeci } from "@/lib/siparis-listesi/suzgec";
import { referansVeri, yeniDoktorVerisi } from "../../../test/integration/referans";

// Siparişler ekranı sorguları — KABUL_KRITERLERI A-5-8, A-3-2 (spec Ü-23 §4); Siparişlerim kapsamı X-13-3 (Ü-31).

const SAYFA = { skip: 0, take: 100 };
const DURUMLAR: OrderStatus[] = ["BEKLIYOR", "HAZIRLANIYOR", "KARGOLANDI", "TESLIM_EDILDI", "IPTAL"];
const KASIM = { baslangic: "2026-11-01", bitis: "2026-11-30" };
let no = 0;
let ref: Awaited<ReturnType<typeof referansVeri>>;

beforeEach(async () => {
  ref = await referansVeri();
});

const S = (ek: Partial<SiparisSuzgeci>): SiparisSuzgeci => ({ ...BOS_SUZGEC, ...ek });

async function satici(name: string) {
  no += 1;
  return prisma.user.create({ data: { name, email: `s${no}@medikal.local`, passwordHash: "x", role: "SATICI" } });
}

async function siparis(o: {
  orderDate: Date;
  status?: OrderStatus;
  stage?: "TEKLIF" | "ONAYLI";
  sellerId?: string | null;
  cari?: { fullName?: string; clinic?: string };
  documentNo?: string;
}) {
  no += 1;
  const d = await prisma.doctor.create({
    data: { ...yeniDoktorVerisi(o.cari?.fullName ?? `Dr. ${no}`), ...(o.cari?.clinic ? { clinic: o.cari.clinic } : {}) },
  });
  return prisma.order.create({
    data: {
      documentNo: o.documentNo ?? `SIP-T-${no}`,
      doctorId: d.id,
      sellerId: o.sellerId ?? null,
      paymentTermDays: 30,
      stage: o.stage ?? "ONAYLI",
      status: o.status ?? "BEKLIYOR",
      orderDate: o.orderDate,
    },
  });
}

const kasim = (g: number) => new Date(Date.UTC(2026, 10, g, 9));

describe("durum kartları (A-5-8)", () => {
  it("her durum kartı = süzgecin satır sayısı = dashboard dağılımı; Toplam beşinin toplamı; teklif kart dışı", async () => {
    for (const status of DURUMLAR) await siparis({ orderDate: kasim(3), status });
    await siparis({ orderDate: kasim(4) });
    await siparis({ orderDate: kasim(5), stage: "TEKLIF" });
    await siparis({ orderDate: new Date(Date.UTC(2026, 9, 10)) });

    const aralik = gunleriAraliga(KASIM);
    const k = await siparisKpileri(aralik, TUM_SIPARISLER);
    const dagilim = await siparisDagilimi(aralik, TUM_SIPARISLER);
    for (const d of DURUMLAR) {
      expect(k[d]).toBe((await siparisListesi(S({ durum: d, ...KASIM }), SAYFA, TUM_SIPARISLER)).toplam);
      expect(k[d]).toBe(dagilim[d]);
    }
    expect(k.BEKLIYOR).toBe(2);
    expect(k.toplam).toBe(6);
  });

  it("teklif (durumu BEKLIYOR) Bekliyor listesinde yok; Teklif sekmesinde ve Tümü'de var", async () => {
    await siparis({ orderDate: kasim(3), documentNo: "SIP-ONAYLI" });
    await siparis({ orderDate: kasim(3), stage: "TEKLIF", documentNo: "SIP-TEKLIF" });
    const belgeler = async (s: SiparisSuzgeci) => (await siparisListesi(s, SAYFA, TUM_SIPARISLER)).satirlar.map((r) => r.documentNo).sort();
    expect(await belgeler(S({ durum: "BEKLIYOR" }))).toEqual(["SIP-ONAYLI"]);
    expect(await belgeler(S({ durum: "TEKLIF" }))).toEqual(["SIP-TEKLIF"]);
    expect(await belgeler(BOS_SUZGEC)).toEqual(["SIP-ONAYLI", "SIP-TEKLIF"]);
  });

  it("gün sınırı İstanbul günüdür: 1 Kasım 00:00 (İstanbul) Kasım'da, bir dakika öncesi Ekim'de", async () => {
    await siparis({ orderDate: new Date("2026-10-31T21:00:00Z"), documentNo: "SIP-KASIM" });
    await siparis({ orderDate: new Date("2026-10-31T20:59:00Z"), documentNo: "SIP-EKIM" });
    expect((await siparisKpileri(gunleriAraliga(KASIM), TUM_SIPARISLER)).toplam).toBe(1);
    expect((await siparisKpileri(gunleriAraliga({ baslangic: "2026-10-01", bitis: "2026-10-31" }), TUM_SIPARISLER)).toplam).toBe(1);
    const kasimListe = await siparisListesi(S({ ...KASIM }), SAYFA, TUM_SIPARISLER);
    expect(kasimListe.satirlar.map((r) => r.documentNo)).toEqual(["SIP-KASIM"]);
  });

  it("açık uçlu aralık: yalnız başlangıç", async () => {
    await siparis({ orderDate: kasim(3) });
    await siparis({ orderDate: new Date(Date.UTC(2026, 9, 3)) });
    expect((await siparisKpileri(gunleriAraliga({ baslangic: "2026-11-01", bitis: null }), TUM_SIPARISLER)).toplam).toBe(1);
  });
});

describe("liste süzgeçleri", () => {
  it("satıcı ve satıcısız (bayi) süzgeci; metin belge no, cari adı ve klinikte arar (harf duyarsız)", async () => {
    const ayse = await satici("Ayşe");
    await siparis({ orderDate: kasim(3), sellerId: ayse.id, documentNo: "SIP-AYSE", cari: { fullName: "Dr. Kemal Ak" } });
    await siparis({ orderDate: kasim(3), documentNo: "SIP-BAYI", cari: { clinic: "Merkez Hastanesi" } });
    const belgeler = async (s: SiparisSuzgeci) => (await siparisListesi(s, SAYFA, TUM_SIPARISLER)).satirlar.map((r) => r.documentNo).sort();
    expect(await belgeler(S({ satici: ayse.id }))).toEqual(["SIP-AYSE"]);
    expect(await belgeler(S({ satici: "yok" }))).toEqual(["SIP-BAYI"]);
    expect(await belgeler(S({ q: "sip-ayse" }))).toEqual(["SIP-AYSE"]);
    expect(await belgeler(S({ q: "kemal" }))).toEqual(["SIP-AYSE"]);
    expect(await belgeler(S({ q: "merkez" }))).toEqual(["SIP-BAYI"]);
    const satir = (await siparisListesi(S({ satici: ayse.id }), SAYFA, TUM_SIPARISLER)).satirlar[0];
    expect(satir.satici).toBe("Ayşe");
  });

  it("metin araması Türkçe I/ı/İ'yi bulur: büyük harfli klinik, baş harfi I olan ad", async () => {
    await siparis({ orderDate: kasim(3), documentNo: "SIP-KILIC", cari: { clinic: "KILIÇ TIP MERKEZİ" } });
    await siparis({ orderDate: kasim(3), documentNo: "SIP-ISIK", cari: { fullName: "Dr. Işık Ilgaz" } });
    const belgeler = async (q: string) => (await siparisListesi(S({ q }), SAYFA, TUM_SIPARISLER)).satirlar.map((r) => r.documentNo).sort();
    expect(await belgeler("kılıç")).toEqual(["SIP-KILIC"]);
    expect(await belgeler("merkezi")).toEqual(["SIP-KILIC"]);
    expect(await belgeler("ışık")).toEqual(["SIP-ISIK"]);
    expect(await belgeler("IŞIK")).toEqual(["SIP-ISIK"]);
    expect(await belgeler("ılgaz")).toEqual(["SIP-ISIK"]);
  });

  it("aynı anda açılan siparişlerde sayfalama kararlıdır (orderDate desc, id desc)", async () => {
    const an = kasim(3);
    for (let i = 0; i < 4; i++) await siparis({ orderDate: an });
    const tum = (await siparisListesi(BOS_SUZGEC, SAYFA, TUM_SIPARISLER)).satirlar.map((r) => r.id);
    const s1 = (await siparisListesi(BOS_SUZGEC, { skip: 0, take: 2 }, TUM_SIPARISLER)).satirlar.map((r) => r.id);
    const s2 = (await siparisListesi(BOS_SUZGEC, { skip: 2, take: 2 }, TUM_SIPARISLER)).satirlar.map((r) => r.id);
    expect([...s1, ...s2]).toEqual(tum);
    expect(tum).toEqual([...tum].sort().reverse());
  });
});

describe("satır tutarı, sevk ve yan panel (A-3-2)", () => {
  it("kısmi sevk + iade: kalan = sipariş − sevk, iade ayrı; tutar = siparisToplami; sevkiyat takip linki ve irsaliye", async () => {
    const urun = await prisma.product.create({ data: { name: "Stent", code: "STN-1", taxRateId: ref.kdv20.id } });
    const numune = await prisma.product.create({ data: { name: "Kılavuz", code: "KLV-1", taxRateId: ref.kdv20.id } });
    const firma = await prisma.carrier.create({ data: { name: "Test Kargo", trackingUrlTemplate: "https://kargo.test/{takip_no}" } });
    const yonetici = await prisma.user.create({ data: { name: "Y", email: "y-panel@medikal.local", passwordHash: "x", role: "YONETICI" } });
    const s = await siparis({ orderDate: kasim(3), status: "HAZIRLANIYOR" });
    const kalem = await prisma.orderItem.create({
      data: { orderId: s.id, productId: urun.id, quantity: 5, listPrice: "100", unitPrice: "90", vatRate: "20" },
    });
    await prisma.orderItem.create({
      data: { orderId: s.id, productId: numune.id, quantity: 1, listPrice: "50", unitPrice: "0", vatRate: "20", isFree: true, freeReason: "NUMUNE" },
    });
    const svk = await prisma.shipment.create({
      data: {
        documentNo: "SVK-T-1",
        orderId: s.id,
        carrierId: firma.id,
        trackingNumber: "TK1",
        externalDispatchNo: "IRS-9",
        shippedOn: kasim(4),
        shippedAt: kasim(4),
        items: { create: [{ orderItemId: kalem.id, quantity: 3 }] },
      },
    });
    await prisma.returnNote.create({
      data: {
        documentNo: "IAD-T-1",
        doctorId: s.doctorId,
        locationId: ref.depo.id,
        reason: "hasarlı",
        createdById: yonetici.id,
        items: { create: [{ orderItemId: kalem.id, quantity: 1, vatRate: "20" }] },
      },
    });

    const satirlar = await prisma.orderItem.findMany({ where: { orderId: s.id } });
    const beklenen = siparisToplami(satirlar);

    const satir = (await siparisListesi(BOS_SUZGEC, SAYFA, TUM_SIPARISLER)).satirlar[0];
    expect(satir.sevk).toBe(3);
    expect(satir.adet).toBe(6);
    expect(satir.toplam.toFixed(2)).toBe(beklenen.toplam.toFixed(2));

    const panel = (await siparisPaneli(s.id, TUM_SIPARISLER))!;
    const stent = panel.kalemler.find((k) => k.kod === "STN-1")!;
    expect(stent).toMatchObject({ adet: 5, sevk: 3, kalan: 2, iade: 1, bedelsiz: false });
    expect(panel.kalemler.find((k) => k.kod === "KLV-1")).toMatchObject({ bedelsiz: true, sevk: 0, kalan: 1 });
    expect(panel.tutar.toplam.toFixed(2)).toBe(beklenen.toplam.toFixed(2));
    expect(panel.sevkiyatlar).toEqual([
      {
        id: svk.id,
        documentNo: "SVK-T-1",
        shippedOn: new Date("2026-11-04T00:00:00Z"), // takvim günü (date kolonu)
        firma: "Test Kargo",
        takipNo: "TK1",
        takipLinki: "https://kargo.test/TK1",
        irsaliyeNo: "IRS-9",
        adet: 3,
      },
    ]);
    expect(panel.iadeler.map((i) => [i.documentNo, i.adet])).toEqual([["IAD-T-1", 1]]);
    expect(panel.siparis.paymentTermDays).toBe(30);
  });

  it("bulunmayan kimlikte panel null", async () => {
    expect(await siparisPaneli("yok-boyle-bir-siparis", TUM_SIPARISLER)).toBeNull();
  });
});

describe("Siparişlerim kapsamı (Ü-31, X-13-3)", () => {
  it("liste, KPI ve panel yalnız satıcının kendi siparişleri; adresin satıcı süzgeci kapsamı genişletemez", async () => {
    const ayse = await satici("Ayşe");
    const can = await satici("Can");
    const AYSE: SiparisKapsami = { tur: "satici", saticiId: ayse.id };
    const kendi = await siparis({ orderDate: kasim(3), sellerId: ayse.id, documentNo: "SIP-AYSE-1" });
    await siparis({ orderDate: kasim(3), sellerId: ayse.id, status: "KARGOLANDI", documentNo: "SIP-AYSE-2" });
    const baska = await siparis({ orderDate: kasim(3), sellerId: can.id, documentNo: "SIP-CAN-1" });
    await siparis({ orderDate: kasim(3), sellerId: null, documentNo: "SIP-BAYI-1" });

    const belgeler = async (s: SiparisSuzgeci) =>
      (await siparisListesi(s, SAYFA, AYSE)).satirlar.map((r) => r.documentNo).sort();
    expect(await belgeler(BOS_SUZGEC)).toEqual(["SIP-AYSE-1", "SIP-AYSE-2"]);
    expect(await belgeler(S({ satici: can.id }))).toEqual([]);
    expect(await belgeler(S({ q: "SIP-CAN" }))).toEqual([]);

    const aralik = gunleriAraliga(KASIM);
    const k = await siparisKpileri(aralik, AYSE);
    expect(k).toMatchObject({ toplam: 2, BEKLIYOR: 1, KARGOLANDI: 1 });
    // Kart = açtığı süzgecin satır sayısı, aynı kapsamla (A-5-8).
    for (const d of DURUMLAR) expect(k[d]).toBe((await siparisListesi(S({ durum: d, ...KASIM }), SAYFA, AYSE)).toplam);
    // Kapsamsız çağrı (yönetici) dördünü de sayar.
    expect((await siparisKpileri(aralik, TUM_SIPARISLER)).toplam).toBe(4);

    expect((await siparisPaneli(kendi.id, AYSE))?.siparis.documentNo).toBe("SIP-AYSE-1");
    expect(await siparisPaneli(baska.id, AYSE)).toBeNull();
    expect((await siparisPaneli(baska.id, TUM_SIPARISLER))?.siparis.documentNo).toBe("SIP-CAN-1");
  });
});

describe("Siparişlerim panelinin cari bağlantısı (Ü-32)", () => {
  it("cariSaticida: sahibi siparişin satıcısı ve sınıfı DOKTOR iken; devir sonrası ya da bayide değil", async () => {
    const ayse = await satici("Ayşe");
    const can = await satici("Can");
    const yeni = async (ek: { ownerSellerId?: string | null; accountClass?: "DOKTOR" | "BAYI" }) => {
      no += 1;
      const d = await prisma.doctor.create({ data: { ...yeniDoktorVerisi(`Dr. ${no}`), ...ek } });
      return prisma.order.create({
        data: { documentNo: `SIP-B-${no}`, doctorId: d.id, sellerId: ayse.id, paymentTermDays: 30, stage: "ONAYLI", status: "BEKLIYOR", orderDate: kasim(3) },
      });
    };
    const kendi = await yeni({ ownerSellerId: ayse.id });
    const devredilmis = await yeni({ ownerSellerId: can.id });
    // Bayinin sahibi olamaz (CHECK `Doctor_bayi_sahipsiz_check`, X-8 §(3)); bayi siparişi bağlantı taşımaz.
    const bayi = await yeni({ ownerSellerId: null, accountClass: "BAYI" });
    const AYSE: SiparisKapsami = { tur: "satici", saticiId: ayse.id };
    const bak = async (id: string) => (await siparisPaneli(id, AYSE))!.siparis.cariSaticida;
    expect(await bak(kendi.id)).toBe(true);
    expect(await bak(devredilmis.id)).toBe(false);
    expect(await bak(bayi.id)).toBe(false);
  });
});
