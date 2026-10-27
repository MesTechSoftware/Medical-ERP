import { describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { donemCoz } from "@/lib/donem";
import {
  denetimOzeti,
  doktorOzeti,
  fiyatListesiOzeti,
  iceAktarimOzeti,
  kargoOzeti,
  kullaniciOzeti,
  onayOzeti,
  raporOzeti,
  siparisOzeti,
  stokOzeti,
  tahsilatOzeti,
  urunOzeti,
} from "@/lib/sayfa-ozetleri";
import { stokGirisiYaz } from "@/lib/stok-giris";
import { gunAraligi, simdi } from "@/lib/zaman";
import { referansVeri, yeniDoktorVerisi } from "../../test/integration/referans";

// Dashboard sayfa özetleri: her sayı mevcut tek çağrı noktasından; sayılmaması gerekenler
// (iptal, teklif, geçen ay, pasif, bayi, kararlı blok) veritabanında durur ama sayılmaz.

const EKIM = donemCoz("2026-10", new Date("2026-10-26T11:00:00Z")).aralik;
let no = 0;

async function kullanici(rol: "YONETICI" | "OPERASYON" | "SATICI", ad = `K${++no}`, aktif = true) {
  return prisma.user.create({ data: { name: ad, email: `${ad.toLowerCase()}@medikal.local`, passwordHash: "x", role: rol, isActive: aktif } });
}

async function siparis(veri: { status: "BEKLIYOR" | "HAZIRLANIYOR" | "KARGOLANDI" | "IPTAL"; orderDate?: Date; stage?: "TEKLIF" | "ONAYLI"; sellerId?: string }) {
  const d = await prisma.doctor.create({ data: yeniDoktorVerisi() });
  return prisma.order.create({
    data: {
      documentNo: `SIP-O-${++no}`,
      doctorId: d.id,
      sellerId: veri.sellerId ?? null,
      paymentTermDays: 30,
      stage: veri.stage ?? "ONAYLI",
      status: veri.status,
      orderDate: veri.orderDate ?? new Date("2026-10-10T09:00:00Z"),
    },
  });
}

describe("siparisOzeti / kargoOzeti", () => {
  it("durum sayıları; bu ay açılan yalnız sayılan siparişler (iptal, teklif, geçen ay hariç)", async () => {
    await siparis({ status: "BEKLIYOR" });
    await siparis({ status: "BEKLIYOR", stage: "TEKLIF" });
    await siparis({ status: "HAZIRLANIYOR" });
    await siparis({ status: "IPTAL" });
    await siparis({ status: "KARGOLANDI", orderDate: new Date("2026-09-20T09:00:00Z") });

    expect(await siparisOzeti(EKIM)).toEqual({ bekliyor: 2, hazirlaniyor: 1, buAy: 2 });
  });

  it("kargolanacak, onayda (açık blok) ve yolda; kararlı blok onayda sayılmaz", async () => {
    const y = await kullanici("YONETICI");
    const a = await siparis({ status: "HAZIRLANIYOR" });
    const b = await siparis({ status: "HAZIRLANIYOR" });
    await siparis({ status: "KARGOLANDI" });
    const blok = { documentType: "SIP", ruleCode: "NEGATIF_STOK", openedById: y.id, openReason: "stok" };
    await prisma.approvalBlock.create({ data: { ...blok, documentId: a.id } });
    await prisma.approvalBlock.create({ data: { ...blok, documentId: b.id, decision: "ONAY", decidedById: y.id, decidedAt: simdi(), decisionNote: "tamam" } });

    const o = await kargoOzeti(EKIM);
    expect({ kargolanacak: o.kargolanacak, onayda: o.onayda, yolda: o.yolda }).toEqual({ kargolanacak: 2, onayda: 1, yolda: 1 });
    expect(o.enCok).toEqual([]);
  });
});

describe("onayOzeti", () => {
  it("karar bekleyen bloklar ve en eskisi; kararlı blok sayılmaz", async () => {
    const y = await kullanici("YONETICI");
    const blok = { documentType: "SIP", documentId: "x", ruleCode: "NEGATIF_STOK", openedById: y.id, openReason: "stok" };
    await prisma.approvalBlock.create({ data: { ...blok, openedAt: new Date("2026-10-20T09:00:00Z") } });
    await prisma.approvalBlock.create({ data: { ...blok, openedAt: new Date("2026-10-05T09:00:00Z") } });
    await prisma.approvalBlock.create({ data: { ...blok, openedAt: new Date("2026-09-01T09:00:00Z"), decision: "RED", decidedById: y.id, decidedAt: simdi(), decisionNote: "hayır" } });

    const o = await onayOzeti();
    expect(o.bekleyen).toBe(2);
    expect(o.enEski?.toISOString()).toBe("2026-10-05T09:00:00.000Z");
  });
});

describe("stokOzeti / urunOzeti", () => {
  it("tükendi ve kritik stoktan (hesaplaStok), en düşük önce; pasif ürün sayılmaz", async () => {
    const { kdv20 } = await referansVeri();
    const y = await kullanici("YONETICI");
    const urun = async (ad: string, miktar: number, status: "AKTIF" | "PASIF" = "AKTIF") => {
      const u = await prisma.product.create({ data: { name: ad, code: ad, taxRateId: kdv20.id, status } });
      if (miktar > 0) await prisma.$transaction((tx) => stokGirisiYaz(tx, { urunId: u.id, miktar, not: null, yapanId: y.id }));
      return u;
    };
    await urun("Tükenen", 0);
    await urun("Kritik", 5);
    await urun("Bol", 50);
    await urun("Pasif", 0, "PASIF");

    const o = await stokOzeti();
    expect({ tukendi: o.tukendi, kritik: o.kritik }).toEqual({ tukendi: 1, kritik: 1 });
    expect(o.enDusuk.map((u) => [u.name, u.stok])).toEqual([
      ["Tükenen", 0],
      ["Kritik", 5],
    ]);
    expect(await urunOzeti()).toEqual({ aktif: 3, pasif: 1 });
  });
});

describe("doktorOzeti / fiyatListesiOzeti", () => {
  it("sahipsiz yalnız sahibi olmayan doktor (bayi sayılmaz); fatura bilgisi eksik A-13 tanımıyla", async () => {
    const { liste } = await referansVeri();
    const satici = await kullanici("SATICI");
    const tam = { taxId: "11111111111", invoiceAddress: "Adres", invoiceCity: "İstanbul", partyType: "GERCEK_KISI" as const };
    await prisma.doctor.create({ data: { ...yeniDoktorVerisi("Sahipli"), ...tam, ownerSellerId: satici.id, priceListId: liste.id } });
    await prisma.doctor.create({ data: { ...yeniDoktorVerisi("Sahipsiz") } }); // fatura bilgisi de eksik
    await prisma.doctor.create({ data: { ...yeniDoktorVerisi("Bayi"), ...tam, accountClass: "BAYI" } });

    expect(await doktorOzeti()).toEqual({ aktif: 3, sahipsiz: 1, faturaEksik: 1 });
    expect(await fiyatListesiOzeti()).toEqual({ liste: await prisma.priceList.count(), atanmisCari: 1 });
  });
});

describe("tahsilatOzeti", () => {
  it("bu ayın AKTIF tahsilatı (ay sınırı İstanbul, iptal hariç); son tahsilat tutarı ve doktoru", async () => {
    const { havale } = await referansVeri();
    const y = await kullanici("YONETICI");
    const d = await prisma.doctor.create({ data: yeniDoktorVerisi("Dr. Ödeyen") });
    const odeme = (amount: string, paidAt: Date, status: "AKTIF" | "IPTAL" = "AKTIF") =>
      prisma.doctorPayment.create({
        data: { documentNo: `THS-O-${++no}`, doctorId: d.id, amount, paymentMethodId: havale.id, commissionRate: "0", commissionAmount: "0", recordedBy: y.id, paidAt, status },
      });
    await odeme("100.00", new Date("2026-10-05T09:00:00Z"));
    await odeme("250.00", new Date("2026-10-12T09:00:00Z"));
    await odeme("999.00", new Date("2026-10-13T09:00:00Z"), "IPTAL");
    await odeme("75.00", new Date("2026-09-30T20:59:00Z")); // İstanbul 30 Eylül 23:59 — geçen ay

    const o = await tahsilatOzeti(EKIM);
    expect(o.buAy).toBe(2);
    expect(o.son?.tutar.toFixed(2)).toBe("250.00");
    expect(o.son?.doktor).toBe("Dr. Ödeyen");
  });
});

describe("kullaniciOzeti", () => {
  it("rol başına aktif kullanıcı ve pasif sayısı", async () => {
    await kullanici("SATICI");
    await kullanici("SATICI");
    await kullanici("SATICI", "Eski", false);
    await kullanici("OPERASYON");
    await kullanici("YONETICI");
    expect(await kullaniciOzeti()).toEqual({ satici: 2, operasyon: 1, yonetici: 1, pasif: 1 });
  });
});

async function sevkliSiparis(saticiId: string, birimFiyat: string, miktar: number, doktorAdi: string) {
  const { kdv20 } = await referansVeri();
  const d = await prisma.doctor.create({ data: yeniDoktorVerisi(doktorAdi) });
  const u = await prisma.product.create({ data: { name: `Ü${++no}`, code: `U${no}`, taxRateId: kdv20.id } });
  const o = await prisma.order.create({
    data: {
      documentNo: `SIP-R-${no}`,
      sellerId: saticiId,
      doctorId: d.id,
      paymentTermDays: 30,
      stage: "ONAYLI",
      status: "KARGOLANDI",
      items: { create: [{ productId: u.id, quantity: miktar, listPrice: birimFiyat, unitPrice: birimFiyat, vatRate: "20" }] },
    },
    include: { items: true },
  });
  await prisma.shipment.create({
    data: { documentNo: `SVK-R-${no}`, orderId: o.id, shippedAt: new Date("2026-10-10T09:00:00Z"), items: { create: [{ orderItemId: o.items[0].id, quantity: miktar }] } },
  });
}

describe("raporOzeti", () => {
  it("bu ayın satıcı lideri ve en çok ciro yapan doktor, raporla aynı ciro (KDV hariç)", async () => {
    const y = await kullanici("YONETICI");
    const ali = await kullanici("SATICI", "Ali");
    const veli = await kullanici("SATICI", "Veli");
    await sevkliSiparis(ali.id, "100", 3, "Dr. Az");
    await sevkliSiparis(veli.id, "500", 1, "Dr. Çok");

    const o = await raporOzeti({ id: y.id, role: "YONETICI" }, EKIM);
    expect(o.lider?.ad).toBe("Veli");
    expect(o.lider?.ciro.toFixed(2)).toBe("500.00");
    expect(o.doktor?.ad).toBe("Dr. Çok");
  });

  it("bu ay ciro yoksa lider de doktor da yok; dönen veride hakediş yok (D-2)", async () => {
    const y = await kullanici("YONETICI");
    await kullanici("SATICI");
    const o = await raporOzeti({ id: y.id, role: "YONETICI" }, EKIM);
    expect(o).toEqual({ lider: null, doktor: null });
    expect(JSON.stringify(o)).not.toMatch(/hakedis/i);
  });
});

describe("denetimOzeti / iceAktarimOzeti", () => {
  it("bugünün denetim kaydı (İstanbul günü) ve son kayıt", async () => {
    const bugun = gunAraligi(simdi()).baslangic;
    await prisma.auditLog.create({ data: { action: "ORDER_CREATE", entityType: "Order", createdAt: new Date(bugun.getTime() - 60_000) } });
    await prisma.auditLog.create({ data: { action: "STOCK_ENTRY", entityType: "Product", createdAt: new Date(bugun.getTime() + 60_000) } });
    await prisma.auditLog.create({ data: { action: "COLLECTION_CREATE", entityType: "DoctorPayment", createdAt: new Date(bugun.getTime() + 120_000) } });

    const o = await denetimOzeti();
    expect(o.bugun).toBe(2);
    expect(o.son?.action).toBe("COLLECTION_CREATE");
  });

  it("son içe aktarım partisi ve bu ayın parti sayısı", async () => {
    const y = await kullanici("YONETICI");
    const parti = (batchNo: string, createdAt: Date, dataType: "CARI" | "URUN") =>
      prisma.importBatch.create({ data: { batchNo, dataType, userId: y.id, createdAt } });
    await parti("P-1", new Date("2026-09-15T09:00:00Z"), "CARI");
    await parti("P-2", new Date("2026-10-15T09:00:00Z"), "URUN");

    const o = await iceAktarimOzeti(EKIM);
    expect(o.buAy).toBe(1);
    expect(o.son?.dataType).toBe("URUN");
    expect(o.son?.revertedAt).toBeNull();
  });
});
