import type Decimal from "decimal.js";
import type { Prisma } from "@/generated/prisma/client";
import type { OrderStage, OrderStatus } from "@/generated/prisma/enums";
import { siparisDagilimi } from "@/lib/dashboard";
import { prisma } from "@/lib/db";
import type { Aralik } from "@/lib/donem";
import { takipLinki } from "@/lib/kargo";
import { belgeOnayDurumlari } from "@/lib/onay-blogu";
import type { BelgeTutari } from "@/lib/satir-tutarlari";
import { kalemMiktarlari, SIPARIS_SATIRI, siparisToplami, siparisTutarlari } from "@/lib/siparis";
import { metinVaryantlari } from "@/lib/liste/metin";
import { kapsamKosulu, SATICISIZ, type SiparisKapsami, type SiparisSuzgeci } from "@/lib/siparis-listesi/suzgec";
import { TUM_ZAMANLAR, yerelGunAraligi } from "@/lib/zaman";

/**
 * Siparişler ekranı sorguları (spec Ü-23 §4). Süzgeç tek `where` üreticisindedir; durum kartı ile
 * açtığı listenin sayısı aynıdır (A-5-8). KPI dashboard'un dağılımıyla tek yoldur (`siparisDagilimi`).
 * Kalem miktarları `kalemMiktarlari`'ndan, tutar `siparisToplami` / `siparisTutarlari`'ndan (A-3-2).
 *
 * `kapsam` zorunludur (`SiparisKapsami`, X-13): satıcı kapsamında (Siparişlerim, Ü-31) liste, KPI ve panel
 * yalnız o satıcının siparişlerini okur. Kapsam sorgudadır; adresin `satici` süzgeci onu genişletemez.
 */

/** İstanbul gün metinlerini yarı açık aralığa çevirir; boş uç `TUM_ZAMANLAR`'ın ucudur. */
export function gunleriAraliga(a: { baslangic: string | null; bitis: string | null }): Aralik {
  return {
    baslangic: (a.baslangic && yerelGunAraligi(a.baslangic)?.baslangic) || TUM_ZAMANLAR.baslangic,
    bitis: (a.bitis && yerelGunAraligi(a.bitis)?.bitis) || TUM_ZAMANLAR.bitis,
  };
}

export function siparisKosulu(s: SiparisSuzgeci, kapsam: SiparisKapsami): Prisma.OrderWhereInput {
  const ve: Prisma.OrderWhereInput[] = [kapsamKosulu(kapsam)];
  if (s.durum === "TEKLIF") ve.push({ stage: "TEKLIF" });
  else if (s.durum) ve.push({ stage: "ONAYLI", status: s.durum });
  if (s.baslangic || s.bitis) {
    const a = gunleriAraliga(s);
    ve.push({ orderDate: { gte: a.baslangic, lt: a.bitis } });
  }
  if (s.satici === SATICISIZ) ve.push({ sellerId: null });
  else if (s.satici) ve.push({ sellerId: s.satici });
  if (s.q) {
    // Türkçe I/ı varyantları (`metinVaryantlari`): veritabanı yereli ı'yı katlamaz.
    ve.push({
      OR: metinVaryantlari(s.q).flatMap((v) => {
        const icerir = { contains: v, mode: "insensitive" as const };
        return [{ documentNo: icerir }, { doctor: { fullName: icerir } }, { doctor: { clinic: icerir } }];
      }),
    });
  }
  return { AND: ve };
}

export type SiparisSatiri = {
  id: string;
  documentNo: string;
  orderDate: Date;
  stage: OrderStage;
  status: OrderStatus;
  cari: { id: string; fullName: string; clinic: string | null };
  satici: string | null;
  /** KDV dahil belge toplamı (`siparisToplami`). */
  toplam: Decimal;
  /** Sevk edilen ve sipariş edilen adet, bedelsiz dahil. */
  sevk: number;
  adet: number;
  /** A-8: siparişin açık ya da reddedilmiş onay bloğu. */
  onay: "BEKLIYOR" | "RED" | undefined;
};

/** Liste satırı: tablonun çizdiği alanlar ve tutar/sevk için kalem değerleri. */
const SATIR_SECIMI = {
  id: true,
  documentNo: true,
  orderDate: true,
  stage: true,
  status: true,
  doctor: { select: { id: true, fullName: true, clinic: true } },
  seller: { select: { name: true } },
  items: { select: { ...SIPARIS_SATIRI, shipmentItems: { select: { quantity: true } }, returnItems: { select: { quantity: true } } } },
} satisfies Prisma.OrderSelect;

/** Panel: liste satırı + vade ve kalem ayrıntısı (ürün, iade). */
const PANEL_SECIMI = {
  ...SATIR_SECIMI,
  paymentTermDays: true,
  items: {
    orderBy: { id: "asc" },
    select: {
      ...SIPARIS_SATIRI,
      id: true,
      product: { select: { name: true, code: true } },
      shipmentItems: { select: { quantity: true } },
      returnItems: { select: { quantity: true } },
    },
  },
} satisfies Prisma.OrderSelect;

type HamSiparis = Prisma.OrderGetPayload<{ select: typeof SATIR_SECIMI }>;

function satir(o: HamSiparis, onay: SiparisSatiri["onay"], toplam: Decimal = siparisToplami(o.items).toplam): SiparisSatiri {
  return {
    id: o.id,
    documentNo: o.documentNo,
    orderDate: o.orderDate,
    stage: o.stage,
    status: o.status,
    cari: o.doctor,
    satici: o.seller?.name ?? null,
    toplam,
    sevk: o.items.reduce((t, k) => t + kalemMiktarlari(k).sevk, 0),
    adet: o.items.reduce((t, k) => t + k.quantity, 0),
    onay,
  };
}

export async function siparisListesi(
  s: SiparisSuzgeci,
  sayfa: { skip: number; take: number },
  kapsam: SiparisKapsami
): Promise<{ satirlar: SiparisSatiri[]; toplam: number }> {
  const where = siparisKosulu(s, kapsam);
  const [kayitlar, toplam] = await Promise.all([
    prisma.order.findMany({ where, orderBy: [{ orderDate: "desc" }, { id: "desc" }], ...sayfa, select: SATIR_SECIMI }),
    prisma.order.count({ where }),
  ]);
  const onay = await belgeOnayDurumlari("SIP", kayitlar.map((o) => o.id));
  return { satirlar: kayitlar.map((o) => satir(o, onay.get(o.id))), toplam };
}

export type SiparisKpileri = Record<OrderStatus, number> & { toplam: number };

/** Aralıkta açılan onaylı siparişler durumlarına göre; dashboard dağılımının kendisi (A-5-8). */
export async function siparisKpileri(aralik: Aralik, kapsam: SiparisKapsami): Promise<SiparisKpileri> {
  const d = await siparisDagilimi(aralik, kapsam);
  return { ...d, toplam: d.BEKLIYOR + d.HAZIRLANIYOR + d.KARGOLANDI + d.TESLIM_EDILDI + d.IPTAL };
}

export type SiparisPaneli = {
  siparis: SiparisSatiri & { paymentTermDays: number };
  kalemler: {
    id: string;
    urun: string;
    kod: string;
    adet: number;
    sevk: number;
    kalan: number;
    iade: number;
    birimFiyat: Decimal;
    /** Satır matrahı (KDV hariç), `hesaplaSatirTutarlari`'ndan. */
    matrah: Decimal;
    bedelsiz: boolean;
  }[];
  tutar: BelgeTutari;
  sevkiyatlar: {
    id: string;
    documentNo: string;
    shippedOn: Date | null;
    firma: string | null;
    takipNo: string | null;
    takipLinki: string | null;
    irsaliyeNo: string | null;
    adet: number;
  }[];
  iadeler: { id: string; documentNo: string; createdAt: Date; adet: number }[];
};

export async function siparisPaneli(id: string, kapsam: SiparisKapsami): Promise<SiparisPaneli | null> {
  // Dört okuma tek turda gider; her biri kapsamlıdır — başka satıcının kimliğinde boş döner, sipariş
  // yoksa sonuç atılır.
  const siparisi = { id, ...kapsamKosulu(kapsam) };
  const [o, sevkiyatlar, iadeler, onay] = await Promise.all([
    prisma.order.findFirst({ where: siparisi, select: PANEL_SECIMI }),
    prisma.shipment.findMany({
      where: { order: siparisi },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: {
        id: true,
        documentNo: true,
        shippedOn: true,
        trackingNumber: true,
        externalDispatchNo: true,
        carrier: { select: { name: true, trackingUrlTemplate: true } },
        items: { select: { quantity: true } },
      },
    }),
    prisma.returnNote.findMany({
      where: { items: { some: { orderItem: { order: siparisi } } } },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { id: true, documentNo: true, createdAt: true, items: { where: { orderItem: { orderId: id } }, select: { quantity: true } } },
    }),
    belgeOnayDurumlari("SIP", [id]),
  ]);
  if (!o) return null;
  // Satır matrahı ve belge toplamı tek hesaptan; liste satırının toplamıyla aynı yol (A-3-2).
  const tutarlar = siparisTutarlari(o.items);
  return {
    siparis: { ...satir(o, onay.get(id), tutarlar.toplam.toplam), paymentTermDays: o.paymentTermDays },
    kalemler: o.items.map((k, i) => ({
      id: k.id,
      urun: k.product.name,
      kod: k.product.code,
      adet: k.quantity,
      ...kalemMiktarlari(k),
      birimFiyat: k.unitPrice,
      matrah: tutarlar.satirlar[i].matrah,
      bedelsiz: k.isFree,
    })),
    tutar: tutarlar.toplam,
    sevkiyatlar: sevkiyatlar.map((v) => ({
      id: v.id,
      documentNo: v.documentNo,
      shippedOn: v.shippedOn,
      firma: v.carrier?.name ?? null,
      takipNo: v.trackingNumber,
      takipLinki: takipLinki(v.carrier?.trackingUrlTemplate, v.trackingNumber),
      irsaliyeNo: v.externalDispatchNo,
      adet: v.items.reduce((t, k) => t + k.quantity, 0),
    })),
    iadeler: iadeler.map((r) => ({
      id: r.id,
      documentNo: r.documentNo,
      createdAt: r.createdAt,
      adet: r.items.reduce((t, k) => t + k.quantity, 0),
    })),
  };
}

/** Filtrele panelinin satıcı seçenekleri: satıcı rolündekiler, pasifler dahil, ada göre. */
export async function saticiSecenekleri(): Promise<{ id: string; name: string; isActive: boolean }[]> {
  return prisma.user.findMany({
    where: { role: "SATICI" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, isActive: true },
  });
}
