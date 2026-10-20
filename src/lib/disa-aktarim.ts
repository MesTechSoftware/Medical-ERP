import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { sayilanBelgeler } from "@/lib/sayilan-belgeler";
import { hesaplaSatirTutarlari } from "@/lib/satir-tutarlari";
import { hesaplaStok } from "@/lib/stok";
import { BRUT, MATRAH, SATIR_TABANI, tabanli } from "@/lib/taban";
import { yerelGunMetni } from "@/lib/zaman";

/**
 * Dışa aktarımın TEK yolu — K-4 §(2), D-5. Tek çağrı noktası listesinin 7. maddesi.
 * `calistirDisaAktarim(kod, parametreler)` → `{ kolonlar, satirlar }`; format katmanı
 * (`disa-aktarim-yazici.ts`) iş kavramı tanımaz.
 *
 * - Katalog kodda kapalıdır (D-5 §(1)); yedinci veri seti geliştirmedir.
 * - Dönem E-1'e bağlıdır (D-5 §(3)): aralık okuyanlar yarı açık `[baslangic, bitis)` alır,
 *   stok tek gün sonu itibarıyla okur, doktor listesi parametresizdir.
 * - Sipariş veri seti sayılan belgeler filtresinden geçer (A-5); tutarlar
 *   `hesaplaSatirTutarlari()`'ndan okunur (C-6). Cari hareket veri seti mutabakat içindir
 *   (C-2 §(2)): açılış ve vade farkı dahil bütün hareketler tipiyle çıkar — bakiye de
 *   bütün hareketlerden hesaplanır (K-2, X-11 §(6)).
 * - Tarih kolonları `YYYY-AA-GG` yerel gündür (E-1 §(8)); stok veri setinde tutar yoktur (C-2 §(4)).
 */

export const VERI_SETLERI = ["CARI_HAREKET", "TAHSILAT", "SIPARIS", "STOK", "DOKTOR_LISTESI"] as const;
export type VeriSeti = (typeof VERI_SETLERI)[number];

export type Aralik = { baslangic: Date; bitis: Date };
export type DisaAktarimParametresi =
  | { kod: "CARI_HAREKET" | "TAHSILAT" | "SIPARIS"; aralik: Aralik }
  | { kod: "STOK"; tarih: Date }
  | { kod: "DOKTOR_LISTESI" };

export type KolonTipi = "metin" | "sayi" | "tarih";
export type Kolon = { baslik: string; tip: KolonTipi };
/** Hücre: sayı kolonunda ondalık metin (`Decimal` istemciye/dosyaya `string` gider — X-5 §(6)). */
export type Hucre = string | null;
export type VeriSetiCiktisi = { kolonlar: Kolon[]; satirlar: Hucre[][] };

type Db = Prisma.TransactionClient | typeof prisma;

const metin = (baslik: string): Kolon => ({ baslik, tip: "metin" });
const sayi = (baslik: string): Kolon => ({ baslik, tip: "sayi" });
const tarih = (baslik: string): Kolon => ({ baslik, tip: "tarih" });
const gunKolonu = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null); // `date` kolonu, dilimsiz

const araliktaki = (a: Aralik) => ({ gte: a.baslangic, lt: a.bitis });

async function cariHareket(a: Aralik, db: Db): Promise<VeriSetiCiktisi> {
  const satirlar = await db.ledgerEntry.findMany({
    where: { createdAt: araliktaki(a) },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      createdAt: true,
      documentNo: true,
      type: true,
      direction: true,
      amount: true,
      dueDate: true,
      doctor: { select: { fullName: true, accountingCode: true } },
    },
  });
  return {
    kolonlar: [
      tarih("Tarih"),
      metin("Belge No"),
      metin("Cari"),
      metin("Cari Muhasebe Kodu"),
      metin("Hareket Tipi"),
      metin("Yön"),
      sayi(tabanli("Tutar", BRUT)),
      tarih("Vade"),
    ],
    satirlar: satirlar.map((h) => [
      yerelGunMetni(h.createdAt),
      h.documentNo,
      h.doctor.fullName,
      h.doctor.accountingCode,
      h.type,
      h.direction,
      h.amount.toFixed(2),
      gunKolonu(h.dueDate),
    ]),
  };
}

async function tahsilat(a: Aralik, db: Db): Promise<VeriSetiCiktisi> {
  // C-2 §(5): kasa defteri değildir — tahsilat hareket listesi. İptal edilen tahsilat durumuyla çıkar.
  const satirlar = await db.doctorPayment.findMany({
    where: { paidAt: araliktaki(a) },
    orderBy: [{ paidAt: "asc" }, { id: "asc" }],
    select: {
      paidAt: true,
      documentNo: true,
      amount: true,
      commissionRate: true,
      commissionAmount: true,
      referenceNo: true,
      status: true,
      doctor: { select: { fullName: true, accountingCode: true } },
      paymentMethod: { select: { name: true } },
    },
  });
  return {
    kolonlar: [
      tarih("Tarih"),
      metin("Belge No"),
      metin("Cari"),
      metin("Cari Muhasebe Kodu"),
      metin("Ödeme Yöntemi"),
      sayi(tabanli("Tutar", BRUT)),
      sayi("Komisyon Oranı (%)"),
      sayi("Komisyon Tutarı"),
      metin("Referans No"),
      metin("Durum"),
    ],
    satirlar: satirlar.map((p) => [
      yerelGunMetni(p.paidAt),
      p.documentNo,
      p.doctor.fullName,
      p.doctor.accountingCode,
      p.paymentMethod.name,
      p.amount.toFixed(2),
      p.commissionRate.toFixed(2),
      p.commissionAmount.toFixed(2),
      p.referenceNo,
      p.status,
    ]),
  };
}

async function siparis(a: Aralik, db: Db): Promise<VeriSetiCiktisi> {
  const siparisler = await db.order.findMany({
    where: { AND: [sayilanBelgeler.siparis, { orderDate: araliktaki(a) }] },
    orderBy: [{ orderDate: "asc" }, { id: "asc" }],
    select: {
      documentNo: true,
      orderDate: true,
      doctor: { select: { fullName: true } },
      seller: { select: { name: true } },
      items: {
        orderBy: { id: "asc" },
        select: {
          quantity: true,
          unitPrice: true,
          listPrice: true,
          vatRate: true,
          isFree: true,
          product: { select: { code: true, name: true } },
        },
      },
    },
  });
  const satirlar: Hucre[][] = [];
  for (const o of siparisler) {
    const { satirlar: tutarlar } = hesaplaSatirTutarlari(
      o.items.map((i) => ({
        birimFiyat: i.unitPrice,
        listeFiyat: i.listPrice,
        miktar: i.quantity,
        kdvOrani: i.vatRate,
        bedelsiz: i.isFree,
      }))
    );
    o.items.forEach((i, n) => {
      const t = tutarlar[n];
      satirlar.push([
        o.documentNo,
        yerelGunMetni(o.orderDate),
        o.doctor.fullName,
        o.seller?.name ?? null,
        i.product.code,
        i.product.name,
        String(i.quantity),
        i.unitPrice.toFixed(4),
        t.matrah.toFixed(2),
        i.vatRate.toFixed(2),
        t.kdvTutar.toFixed(2),
        t.toplam.toFixed(2),
        i.isFree ? "EVET" : "HAYIR", // C-6 §(8): bedelsiz satır ayrı işaretli ve KDV'siz
      ]);
    });
  }
  return {
    kolonlar: [
      metin("Belge No"),
      tarih("Tarih"),
      metin("Cari"),
      metin("Satıcı"),
      metin("Ürün Kodu"),
      metin("Ürün Adı"),
      sayi("Miktar"),
      sayi(tabanli("Birim Fiyat", MATRAH)),
      sayi(tabanli("Tutar", SATIR_TABANI.matrah)),
      sayi("KDV Oranı (%)"),
      sayi("KDV"),
      sayi(tabanli("Toplam", SATIR_TABANI.toplam)),
      metin("Bedelsiz"),
    ],
    satirlar,
  };
}

async function stok(gun: Date, db: Db): Promise<VeriSetiCiktisi> {
  // Nokta okuma: o günün İstanbul günü sonu itibarıyla (E-1 §(5)); miktarı sıfır olan satır çıkmaz.
  const [urunler, konumlar] = await Promise.all([
    db.product.findMany({ orderBy: { code: "asc" }, select: { id: true, code: true, name: true } }),
    db.stockLocation.findMany({ orderBy: [{ sortOrder: "asc" }, { code: "asc" }], select: { id: true, name: true } }),
  ]);
  const gunMetni = yerelGunMetni(gun);
  const satirlar: Hucre[][] = [];
  for (const u of urunler) {
    for (const k of konumlar) {
      const miktar = await hesaplaStok(u.id, k.id, gun, db);
      if (miktar !== 0) satirlar.push([u.code, u.name, k.name, String(miktar), gunMetni]);
    }
  }
  return {
    kolonlar: [metin("Ürün Kodu"), metin("Ürün Adı"), metin("Konum"), sayi("Miktar"), tarih("Tarih")],
    satirlar,
  };
}

async function doktorListesi(db: Db): Promise<VeriSetiCiktisi> {
  const doktorlar = await db.doctor.findMany({
    orderBy: [{ fullName: "asc" }, { id: "asc" }],
    select: {
      accountClass: true,
      fullName: true,
      title: true,
      specialty: true,
      clinic: true,
      region: true,
      city: true,
      phoneNormalized: true,
      email: true,
      status: true,
      ownerSeller: { select: { name: true } },
      partyType: true,
      taxId: true,
      invoiceTitle: true,
      taxOffice: true,
      invoiceAddress: true,
      invoiceDistrict: true,
      invoiceCity: true,
      accountingCode: true,
    },
  });
  return {
    kolonlar: [
      metin("Hesap Sınıfı"),
      metin("Ad Soyad / Unvan"),
      metin("Ünvan"),
      metin("Branş"),
      metin("Klinik / Kurum"),
      metin("Bölge"),
      metin("Şehir"),
      metin("Telefon"),
      metin("E-posta"),
      metin("Durum"),
      metin("Sorumlu Satıcı"),
      metin("Cari Tipi"),
      metin("VKN / TCKN"),
      metin("Fatura Unvanı"),
      metin("Vergi Dairesi"),
      metin("Fatura Adresi"),
      metin("Fatura İlçe"),
      metin("Fatura İl"),
      metin("Muhasebe Kodu"),
    ],
    satirlar: doktorlar.map((d) => [
      d.accountClass,
      d.fullName,
      d.title,
      d.specialty,
      d.clinic,
      d.region,
      d.city,
      d.phoneNormalized,
      d.email,
      d.status,
      d.ownerSeller?.name ?? null,
      d.partyType,
      d.taxId,
      d.invoiceTitle,
      d.taxOffice,
      d.invoiceAddress,
      d.invoiceDistrict,
      d.invoiceCity,
      d.accountingCode,
    ]),
  };
}

export async function calistirDisaAktarim(p: DisaAktarimParametresi, db: Db = prisma): Promise<VeriSetiCiktisi> {
  switch (p.kod) {
    case "CARI_HAREKET":
      return cariHareket(p.aralik, db);
    case "TAHSILAT":
      return tahsilat(p.aralik, db);
    case "SIPARIS":
      return siparis(p.aralik, db);
    case "STOK":
      return stok(p.tarih, db);
    case "DOKTOR_LISTESI":
      return doktorListesi(db);
  }
}
