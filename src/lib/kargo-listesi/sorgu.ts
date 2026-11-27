import type Decimal from "decimal.js";
import type { Prisma } from "@/generated/prisma/client";
import type { OrderStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { EKSIK_FATURA_BILGISI } from "@/lib/cari";
import { takipLinki } from "@/lib/kargo";
import { FIRMASIZ, type KargoSuzgeci } from "@/lib/kargo-listesi/suzgec";
import { metinVaryantlari } from "@/lib/liste/metin";
import { belgeOnayAyrintilari } from "@/lib/onay-blogu";
import { kalanMiktar, SIPARIS_SATIRI, siparisToplami } from "@/lib/siparis";
import { gunleriAraliga } from "@/lib/liste/parametreler";
import { siparisKosulu } from "@/lib/siparis-listesi/sorgu";
import { BOS_SUZGEC as BOS_SIPARIS, TUM_SIPARISLER } from "@/lib/siparis-listesi/suzgec";

/**
 * Kargo ekranı sorguları (spec Ü-24 §4). Kargo bekleyen = onaylı ve hazırlanıyor; kalan
 * `kalanMiktar`'dan. Sevkiyat listesi tek `where` üreticisinden (`sevkiyatKosulu`); "Bugün kargolanan"
 * kartı aynı üreticiyle sayılır (D-3-2).
 */

const BEKLEYEN = { stage: "ONAYLI", status: "HAZIRLANIYOR" } satisfies Prisma.OrderWhereInput;

export type BekleyenSatir = {
  id: string;
  documentNo: string;
  orderDate: Date;
  cari: { fullName: string; clinic: string | null };
  satici: string | null;
  /** Carinin fatura bilgisi eksik (`EKSIK_FATURA_BILGISI`); yalnız bilgi, seçimi engellemez (A-3-9). */
  faturaEksik: boolean;
  /** KDV dahil belge toplamı (`siparisToplami`). */
  toplam: Decimal;
  kalemler: { id: string; urun: string; kod: string; adet: number; kalan: number }[];
  kalanKalem: number;
  kalanAdet: number;
  adet: number;
  onay: "BEKLIYOR" | "RED" | undefined;
  /** Karar verilmemiş (kuralın son) onay blokları; rozet bağlantısı bunlardan kurulur (A-8-14). */
  acikBloklar: string[];
  /** Son bloğu `RED` olan kuralın en yeni kararı (kural, not, tarih); yoksa `null` (A-8-17, A-8-18). */
  redNotu: { kural: string; not: string | null; tarih: Date | null } | null;
};

export async function kargoBekleyenler(): Promise<BekleyenSatir[]> {
  const siparisler = await prisma.order.findMany({
    where: BEKLEYEN,
    orderBy: [{ orderDate: "asc" }, { id: "asc" }],
    select: {
      id: true,
      documentNo: true,
      orderDate: true,
      doctorId: true,
      doctor: { select: { fullName: true, clinic: true } },
      seller: { select: { name: true } },
      items: {
        orderBy: { id: "asc" },
        select: {
          ...SIPARIS_SATIRI,
          id: true,
          product: { select: { name: true, code: true } },
          shipmentItems: { select: { quantity: true } },
        },
      },
    },
  });
  const [onay, eksikler] = await Promise.all([
    belgeOnayAyrintilari("SIP", siparisler.map((o) => o.id)),
    // Tek sorgu: bekleyen siparişlerin carileri içinde eksik fatura bilgisi olanlar.
    prisma.doctor.findMany({ where: { AND: [{ id: { in: [...new Set(siparisler.map((o) => o.doctorId))] } }, EKSIK_FATURA_BILGISI] }, select: { id: true } }),
  ]);
  const eksikCari = new Set(eksikler.map((d) => d.id));
  return siparisler.map((o) => {
    const a = onay.get(o.id);
    const kalemler = o.items.map((k) => ({ id: k.id, urun: k.product.name, kod: k.product.code, adet: k.quantity, kalan: kalanMiktar(k) }));
    return {
      id: o.id,
      documentNo: o.documentNo,
      orderDate: o.orderDate,
      cari: o.doctor,
      satici: o.seller?.name ?? null,
      faturaEksik: eksikCari.has(o.doctorId),
      toplam: siparisToplami(o.items).toplam,
      kalemler,
      kalanKalem: kalemler.filter((k) => k.kalan > 0).length,
      kalanAdet: kalemler.reduce((t, k) => t + k.kalan, 0),
      adet: kalemler.reduce((t, k) => t + k.adet, 0),
      onay: a?.durum,
      acikBloklar: a?.acikBloklar ?? [],
      redNotu: a?.red ? { kural: a.red.kural, not: a.red.not, tarih: a.red.tarih } : null,
    };
  });
}

export type KargoKpileri = { bekleyen: number; bekleyenAdet: number; onayBekleyen: number; reddedilen: number; bugunKargolanan: number; teslimBekleyen: number };

/** Kartlar (spec §3.2): bekleyen sayıları sayfanın okuduğu listeden; bugün ve teslim bekleyen sayımla. */
export async function kargoKpileri(bugun: string, bekleyenOkumasi: Promise<readonly BekleyenSatir[]>): Promise<KargoKpileri> {
  // Sayımlar bekleyenlerin okunmasını beklemez; ekran okumayı söz olarak verirse aynı turda gider.
  const [bugunKargolanan, teslimBekleyen, bekleyenler] = await Promise.all([
    prisma.shipment.count({ where: sevkiyatKosulu({ baslangic: bugun, bitis: bugun, firma: null, durum: null, q: null }) }),
    // Siparişler ekranının `durum=KARGOLANDI` süzgeciyle aynı koşul (D-3-2: kart = satır).
    prisma.order.count({ where: siparisKosulu({ ...BOS_SIPARIS, durum: "KARGOLANDI" }, TUM_SIPARISLER) }),
    bekleyenOkumasi,
  ]);
  return {
    bekleyen: bekleyenler.length,
    bekleyenAdet: bekleyenler.reduce((t, r) => t + r.kalanAdet, 0),
    // Kart = satır (D-3-2): kararsız bloklu sipariş ile reddedilen ayrı sayılır (A-8-16).
    onayBekleyen: bekleyenler.filter((r) => r.onay === "BEKLIYOR").length,
    reddedilen: bekleyenler.filter((r) => r.onay === "RED").length,
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
