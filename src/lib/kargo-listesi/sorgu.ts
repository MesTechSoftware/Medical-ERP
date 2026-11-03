import type Decimal from "decimal.js";
import type { Prisma } from "@/generated/prisma/client";
import type { OrderStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { takipLinki } from "@/lib/kargo";
import { FIRMASIZ, type KargoSuzgeci } from "@/lib/kargo-listesi/suzgec";
import { metinVaryantlari } from "@/lib/liste/metin";
import { belgeOnayDurumlari } from "@/lib/onay-blogu";
import { kalemMiktarlari, SIPARIS_SATIRI, siparisToplami } from "@/lib/siparis";
import { gunleriAraliga } from "@/lib/siparis-listesi/sorgu";

/**
 * Kargo ekranı sorguları (spec Ü-24 §4). Kargo bekleyen = onaylı ve hazırlanıyor; kalan
 * `kalemMiktarlari`'ndan. Sevkiyat listesi tek `where` üreticisinden (`sevkiyatKosulu`); "Bugün kargolanan"
 * kartı aynı üreticiyle sayılır (D-3-2).
 */

const BEKLEYEN = { stage: "ONAYLI", status: "HAZIRLANIYOR" } satisfies Prisma.OrderWhereInput;

export type BekleyenSatir = {
  id: string;
  documentNo: string;
  orderDate: Date;
  cari: { fullName: string; clinic: string | null };
  satici: string | null;
  /** KDV dahil belge toplamı (`siparisToplami`). */
  toplam: Decimal;
  kalemler: { id: string; urun: string; kod: string; adet: number; kalan: number }[];
  kalanKalem: number;
  kalanAdet: number;
  adet: number;
  onay: "BEKLIYOR" | "RED" | undefined;
};

export async function kargoBekleyenler(): Promise<BekleyenSatir[]> {
  const siparisler = await prisma.order.findMany({
    where: BEKLEYEN,
    orderBy: [{ orderDate: "asc" }, { id: "asc" }],
    select: {
      id: true,
      documentNo: true,
      orderDate: true,
      doctor: { select: { fullName: true, clinic: true } },
      seller: { select: { name: true } },
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
    },
  });
  const onay = await belgeOnayDurumlari("SIP", siparisler.map((o) => o.id));
  return siparisler.map((o) => {
    const kalemler = o.items.map((k) => ({ id: k.id, urun: k.product.name, kod: k.product.code, adet: k.quantity, kalan: kalemMiktarlari(k).kalan }));
    return {
      id: o.id,
      documentNo: o.documentNo,
      orderDate: o.orderDate,
      cari: o.doctor,
      satici: o.seller?.name ?? null,
      toplam: siparisToplami(o.items).toplam,
      kalemler,
      kalanKalem: kalemler.filter((k) => k.kalan > 0).length,
      kalanAdet: kalemler.reduce((t, k) => t + k.kalan, 0),
      adet: kalemler.reduce((t, k) => t + k.adet, 0),
      onay: onay.get(o.id),
    };
  });
}

export type KargoKpileri = { bekleyen: number; bekleyenAdet: number; onayBekleyen: number; bugunKargolanan: number; teslimBekleyen: number };

/** Kartlar (spec §3.2): bekleyen sayıları sayfanın okuduğu listeden; bugün ve teslim bekleyen sayımla. */
export async function kargoKpileri(bugun: string, bekleyenler: readonly BekleyenSatir[]): Promise<KargoKpileri> {
  const [bugunKargolanan, teslimBekleyen] = await Promise.all([
    prisma.shipment.count({ where: sevkiyatKosulu({ baslangic: bugun, bitis: bugun, firma: null, durum: null, q: null }) }),
    prisma.order.count({ where: { stage: "ONAYLI", status: "KARGOLANDI" } }),
  ]);
  return {
    bekleyen: bekleyenler.length,
    bekleyenAdet: bekleyenler.reduce((t, r) => t + r.kalanAdet, 0),
    onayBekleyen: bekleyenler.filter((r) => r.onay !== undefined).length,
    bugunKargolanan,
    teslimBekleyen,
  };
}

export function sevkiyatKosulu(s: KargoSuzgeci): Prisma.ShipmentWhereInput {
  const ve: Prisma.ShipmentWhereInput[] = [];
  if (s.baslangic || s.bitis) {
    const a = gunleriAraliga(s);
    ve.push({ shippedAt: { gte: a.baslangic, lt: a.bitis } });
  }
  if (s.firma === FIRMASIZ) ve.push({ carrierId: null });
  else if (s.firma) ve.push({ carrierId: s.firma });
  if (s.durum) ve.push({ status: s.durum });
  if (s.q) {
    // Türkçe I/ı varyantları (`metinVaryantlari`): veritabanı yereli ı'yı katlamaz.
    ve.push({
      OR: metinVaryantlari(s.q).flatMap((v) => {
        const icerir = { contains: v, mode: "insensitive" as const };
        return [{ documentNo: icerir }, { trackingNumber: icerir }, { externalDispatchNo: icerir }, { order: { doctor: { fullName: icerir } } }];
      }),
    });
  }
  return { AND: ve };
}

export type SevkiyatSatiri = {
  id: string;
  documentNo: string;
  shippedAt: Date | null;
  cari: string;
  siparis: { id: string; documentNo: string };
  firma: string | null;
  takipNo: string | null;
  takipLinki: string | null;
  irsaliyeNo: string | null;
  adet: number;
  durum: OrderStatus;
};

export async function sevkiyatListesi(
  s: KargoSuzgeci,
  sayfa: { skip: number; take: number }
): Promise<{ satirlar: SevkiyatSatiri[]; toplam: number }> {
  const where = sevkiyatKosulu(s);
  const [kayitlar, toplam] = await Promise.all([
    prisma.shipment.findMany({
      where,
      orderBy: [{ shippedAt: { sort: "desc", nulls: "last" } }, { id: "desc" }],
      ...sayfa,
      select: {
        id: true,
        documentNo: true,
        shippedAt: true,
        trackingNumber: true,
        externalDispatchNo: true,
        status: true,
        carrier: { select: { name: true, trackingUrlTemplate: true } },
        order: { select: { id: true, documentNo: true, doctor: { select: { fullName: true } } } },
        items: { select: { quantity: true } },
      },
    }),
    prisma.shipment.count({ where }),
  ]);
  return {
    satirlar: kayitlar.map((v) => ({
      id: v.id,
      documentNo: v.documentNo,
      shippedAt: v.shippedAt,
      cari: v.order.doctor.fullName,
      siparis: { id: v.order.id, documentNo: v.order.documentNo },
      firma: v.carrier?.name ?? null,
      takipNo: v.trackingNumber,
      takipLinki: takipLinki(v.carrier?.trackingUrlTemplate, v.trackingNumber),
      irsaliyeNo: v.externalDispatchNo,
      adet: v.items.reduce((t, k) => t + k.quantity, 0),
      durum: v.status,
    })),
    toplam,
  };
}

/** Bütün firmalar (süzgeç eski sevkiyatın pasif firmasını da bulur); sıra tanımdaki gibi. */
export async function firmaSecenekleri(): Promise<{ id: string; name: string; isActive: boolean }[]> {
  return prisma.carrier.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true, isActive: true } });
}

/** Kısmi sevk panelinin siparişi: yalnız kargo bekleyenlerden (spec §3.4). */
export function kismiSecimi(bekleyenler: readonly BekleyenSatir[], kismi: string | null): BekleyenSatir | null {
  return (kismi && bekleyenler.find((r) => r.id === kismi)) || null;
}
