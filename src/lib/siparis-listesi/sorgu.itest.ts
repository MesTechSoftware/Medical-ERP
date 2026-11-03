import { beforeEach, describe, expect, it } from "vitest";

import type { OrderStatus } from "@/generated/prisma/enums";
import { siparisDagilimi } from "@/lib/dashboard";
import { prisma } from "@/lib/db";
import { siparisToplami } from "@/lib/siparis";
import { gunleriAraliga, siparisKpileri, siparisListesi, siparisPaneli } from "@/lib/siparis-listesi/sorgu";
import { BOS_SUZGEC, type SiparisSuzgeci } from "@/lib/siparis-listesi/suzgec";
import { referansVeri, yeniDoktorVerisi } from "../../../test/integration/referans";

// Siparişler ekranı sorguları — KABUL_KRITERLERI A-5-8, A-3-2 (spec Ü-23 §4).

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
    const k = await siparisKpileri(aralik);
    const dagilim = await siparisDagilimi(aralik);
    for (const d of DURUMLAR) {
      expect(k[d]).toBe((await siparisListesi(S({ durum: d, ...KASIM }), SAYFA)).toplam);
      expect(k[d]).toBe(dagilim[d]);
    }
    expect(k.BEKLIYOR).toBe(2);
    expect(k.toplam).toBe(6);
  });

  it("teklif (durumu BEKLIYOR) Bekliyor listesinde yok; Teklif sekmesinde ve Tümü'de var", async () => {
    await siparis({ orderDate: kasim(3), documentNo: "SIP-ONAYLI" });
    await siparis({ orderDate: kasim(3), stage: "TEKLIF", documentNo: "SIP-TEKLIF" });
    const belgeler = async (s: SiparisSuzgeci) => (await siparisListesi(s, SAYFA)).satirlar.map((r) => r.documentNo).sort();
    expect(await belgeler(S({ durum: "BEKLIYOR" }))).toEqual(["SIP-ONAYLI"]);
    expect(await belgeler(S({ durum: "TEKLIF" }))).toEqual(["SIP-TEKLIF"]);
    expect(await belgeler(BOS_SUZGEC)).toEqual(["SIP-ONAYLI", "SIP-TEKLIF"]);
  });

  it("gün sınırı İstanbul günüdür: 1 Kasım 00:00 (İstanbul) Kasım'da, bir dakika öncesi Ekim'de", async () => {
    await siparis({ orderDate: new Date("2026-10-31T21:00:00Z"), documentNo: "SIP-KASIM" });
    await siparis({ orderDate: new Date("2026-10-31T20:59:00Z"), documentNo: "SIP-EKIM" });
    expect((await siparisKpileri(gunleriAraliga(KASIM))).toplam).toBe(1);
    expect((await siparisKpileri(gunleriAraliga({ baslangic: "2026-10-01", bitis: "2026-10-31" }))).toplam).toBe(1);
    const kasimListe = await siparisListesi(S({ ...KASIM }), SAYFA);
    expect(kasimListe.satirlar.map((r) => r.documentNo)).toEqual(["SIP-KASIM"]);
  });

  it("açık uçlu aralık: yalnız başlangıç", async () => {
    await siparis({ orderDate: kasim(3) });
    await siparis({ orderDate: new Date(Date.UTC(2026, 9, 3)) });
    expect((await siparisKpileri(gunleriAraliga({ baslangic: "2026-11-01", bitis: null }))).toplam).toBe(1);
  });
});

describe("liste süzgeçleri", () => {
  it("satıcı ve satıcısız (bayi) süzgeci; metin belge no, cari adı ve klinikte arar (harf duyarsız)", async () => {
    const ayse = await satici("Ayşe");
    await siparis({ orderDate: kasim(3), sellerId: ayse.id, documentNo: "SIP-AYSE", cari: { fullName: "Dr. Kemal Ak" } });
    await siparis({ orderDate: kasim(3), documentNo: "SIP-BAYI", cari: { clinic: "Merkez Hastanesi" } });
    const belgeler = async (s: SiparisSuzgeci) => (await siparisListesi(s, SAYFA)).satirlar.map((r) => r.documentNo).sort();
    expect(await belgeler(S({ satici: ayse.id }))).toEqual(["SIP-AYSE"]);
    expect(await belgeler(S({ satici: "yok" }))).toEqual(["SIP-BAYI"]);
    expect(await belgeler(S({ q: "sip-ayse" }))).toEqual(["SIP-AYSE"]);
    expect(await belgeler(S({ q: "kemal" }))).toEqual(["SIP-AYSE"]);
    expect(await belgeler(S({ q: "merkez" }))).toEqual(["SIP-BAYI"]);
    const satir = (await siparisListesi(S({ satici: ayse.id }), SAYFA)).satirlar[0];
    expect(satir.satici).toBe("Ayşe");
  });

  it("aynı anda açılan siparişlerde sayfalama kararlıdır (orderDate desc, id desc)", async () => {
    const an = kasim(3);
    for (let i = 0; i < 4; i++) await siparis({ orderDate: an });
    const tum = (await siparisListesi(BOS_SUZGEC, SAYFA)).satirlar.map((r) => r.id);
    const s1 = (await siparisListesi(BOS_SUZGEC, { skip: 0, take: 2 })).satirlar.map((r) => r.id);
    const s2 = (await siparisListesi(BOS_SUZGEC, { skip: 2, take: 2 })).satirlar.map((r) => r.id);
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

    const satir = (await siparisListesi(BOS_SUZGEC, SAYFA)).satirlar[0];
    expect(satir.sevk).toBe(3);
    expect(satir.adet).toBe(6);
    expect(satir.toplam.toFixed(2)).toBe(beklenen.toplam.toFixed(2));

    const panel = (await siparisPaneli(s.id))!;
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
    expect(await siparisPaneli("yok-boyle-bir-siparis")).toBeNull();
  });
});
