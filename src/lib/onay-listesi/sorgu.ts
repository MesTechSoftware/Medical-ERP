import type { Prisma } from "@/generated/prisma/client";
import type { FreeReason, OrderStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { icerirDesenleri } from "@/lib/liste/metin";
import { BOS_SUZGEC, ESKI_ONAY_SAATI, type OnaySuzgeci } from "@/lib/onay-listesi/suzgec";
import { kalanMiktar } from "@/lib/siparis";
import { gunleriAraliga } from "@/lib/liste/parametreler";
import { hesaplaStoklar, varsayilanDepoId } from "@/lib/stok";

/**
 * Onay ekranı sorguları (spec Ü-25 §4). Tek `where` üreticisi (`onayKosulu`): kart, süzgeç ve dashboard
 * istisnası aynı koşuldan sayar (A-8-11). Blok yalnız belge kimliği taşır; belge numarası ve cari dört belge
 * tablosundan (SIP, KNS, TRF, DZL) toplu okunur.
 */

/** `eski` sınırı: dashboard istisnasıyla aynı sabit (`ESKI_ONAY_SAATI`). */
const eskiSiniri = (an: Date) => new Date(an.getTime() - ESKI_ONAY_SAATI * 3_600_000);

/**
 * Tek `where`. Tarih olay günüdür: açık blokta açılış, kararlıda karar anı. `qBelgeleri` metin aramasının
 * belge kimlikleridir (`metinBelgeleri`); verilmişse blok yalnız bu belgelerden olur.
 */
export function onayKosulu(s: OnaySuzgeci, an: Date, qBelgeleri: readonly string[] | null = null): Prisma.ApprovalBlockWhereInput {
  const ve: Prisma.ApprovalBlockWhereInput[] = [];
  if (s.eski) ve.push({ decision: null, openedAt: { lt: eskiSiniri(an) } });
  else if (s.durum === "bekleyen") ve.push({ decision: null });
  else if (s.durum !== "tumu") ve.push({ decision: s.durum });
  if (s.baslangic || s.bitis) {
    const a = gunleriAraliga(s);
    const aralik = { gte: a.baslangic, lt: a.bitis };
    ve.push({ OR: [{ decision: null, openedAt: aralik }, { decision: { not: null }, decidedAt: aralik }] });
  }
  if (s.kural) ve.push({ ruleCode: s.kural });
  if (s.acan) ve.push({ openedById: s.acan });
  if (qBelgeleri) ve.push({ documentId: { in: [...qBelgeleri] } });
  return { AND: ve };
}

/**
 * Metni taşıyan bloklu belgelerin kimlikleri: SIP/KNS numarası ya da carisi, TRF/DZL numarası (Türkçe varyantlı).
 * Arama blokların belgeleriyle birleşerek yapılır — bütün bloklu belge kimlikleri okunmaz, geniş bir metin bütün
 * siparişleri döndürmez; sonuç yalnız eşleşen bloklu belgelerdir.
 */
async function metinBelgeleri(q: string): Promise<string[]> {
  const desenler = icerirDesenleri(q);
  const satirlar = await prisma.$queryRaw<{ id: string }[]>`
    SELECT DISTINCT b."documentId" AS id
    FROM "ApprovalBlock" b
    LEFT JOIN "Order" o ON b."documentType" = 'SIP' AND o."id" = b."documentId"
    LEFT JOIN "ConsignmentIssue" k ON b."documentType" = 'KNS' AND k."id" = b."documentId"
    LEFT JOIN "StockTransfer" t ON b."documentType" = 'TRF' AND t."id" = b."documentId"
    LEFT JOIN "StockAdjustment" a ON b."documentType" = 'DZL' AND a."id" = b."documentId"
    LEFT JOIN "Doctor" d ON d."id" = COALESCE(o."doctorId", k."doctorId")
    WHERE COALESCE(o."documentNo", k."documentNo", t."documentNo", a."documentNo") ILIKE ANY(${desenler}::text[])
       OR d."fullName" ILIKE ANY(${desenler}::text[])`;
  return satirlar.map((r) => r.id);
}

export type OnaySatiri = {
  id: string;
  ruleCode: string;
  documentType: string;
  documentId: string;
  openedAt: Date;
  openReason: string;
  decision: "ONAY" | "RED" | null;
  decidedAt: Date | null;
  decisionNote: string | null;
  /** Belge bulunamadıysa `null`; sipariş bağlantısı yalnız SIP'te. */
  belge: { no: string; siparisId: string | null } | null;
  cari: string | null;
  acan: string | null;
  kararVeren: string | null;
};

type HamBlok = Prisma.ApprovalBlockGetPayload<object>;

/** Kimlik listesi boşsa sorgu koşmaz (`IN ()` yerine boş sonuç). */
function varsa<T>(idler: string[], oku: (idler: string[]) => Promise<T[]>): Promise<T[]> {
  return idler.length === 0 ? Promise.resolve([]) : oku(idler);
}

/** Blokların belge numarası, carisi ve kişi adları — tür başına tek okuma; o türden blok yoksa okuma yok. */
async function satirlar(bloklar: readonly HamBlok[]): Promise<OnaySatiri[]> {
  const idler = (tur: string) => bloklar.filter((b) => b.documentType === tur).map((b) => b.documentId);
  const kisiIdleri = [...new Set(bloklar.flatMap((b) => (b.decidedById ? [b.openedById, b.decidedById] : [b.openedById])))];
  const [sip, kns, trf, dzl, kisiler] = await Promise.all([
    varsa(idler("SIP"), (id) => prisma.order.findMany({ where: { id: { in: id } }, select: { id: true, documentNo: true, doctor: { select: { fullName: true } } } })),
    varsa(idler("KNS"), (id) =>
      prisma.consignmentIssue.findMany({ where: { id: { in: id } }, select: { id: true, documentNo: true, doctor: { select: { fullName: true } } } })
    ),
    varsa(idler("TRF"), (id) => prisma.stockTransfer.findMany({ where: { id: { in: id } }, select: { id: true, documentNo: true } })),
    varsa(idler("DZL"), (id) => prisma.stockAdjustment.findMany({ where: { id: { in: id } }, select: { id: true, documentNo: true } })),
    varsa(kisiIdleri, (id) => prisma.user.findMany({ where: { id: { in: id } }, select: { id: true, name: true } })),
  ]);
  const belgeler = new Map<string, { no: string; siparisId: string | null; cari: string | null }>([
    ...sip.map((o) => [`SIP|${o.id}`, { no: o.documentNo, siparisId: o.id, cari: o.doctor.fullName }] as const),
    ...kns.map((k) => [`KNS|${k.id}`, { no: k.documentNo, siparisId: null, cari: k.doctor.fullName }] as const),
    ...trf.map((t) => [`TRF|${t.id}`, { no: t.documentNo, siparisId: null, cari: null }] as const),
    ...dzl.map((d) => [`DZL|${d.id}`, { no: d.documentNo, siparisId: null, cari: null }] as const),
  ]);
  const ad = new Map(kisiler.map((u) => [u.id, u.name]));
  return bloklar.map((b) => {
    const belge = belgeler.get(`${b.documentType}|${b.documentId}`);
    return {
      id: b.id,
      ruleCode: b.ruleCode,
      documentType: b.documentType,
      documentId: b.documentId,
      openedAt: b.openedAt,
      openReason: b.openReason,
      decision: b.decision,
      decidedAt: b.decidedAt,
      decisionNote: b.decisionNote,
      belge: belge ? { no: belge.no, siparisId: belge.siparisId } : null,
      cari: belge?.cari ?? null,
      acan: ad.get(b.openedById) ?? null,
      kararVeren: b.decidedById ? (ad.get(b.decidedById) ?? null) : null,
    };
  });
}

/** Sıralama: bekleyen en eski önce; kararlılar karar anı, Tümü açılış anı yeni önce. */
function siralama(s: OnaySuzgeci): Prisma.ApprovalBlockOrderByWithRelationInput[] {
  if (s.eski || s.durum === "bekleyen") return [{ openedAt: "asc" }, { id: "asc" }];
  if (s.durum === "tumu") return [{ openedAt: "desc" }, { id: "desc" }];
  return [{ decidedAt: "desc" }, { id: "desc" }];
}

export async function onayListesi(
  s: OnaySuzgeci,
  sayfa: { skip: number; take: number },
  an: Date
): Promise<{ satirlar: OnaySatiri[]; toplam: number }> {
  const where = onayKosulu(s, an, s.q ? await metinBelgeleri(s.q) : null);
  const [bloklar, toplam] = await Promise.all([
    prisma.approvalBlock.findMany({ where, orderBy: siralama(s), ...sayfa }),
    prisma.approvalBlock.count({ where }),
  ]);
  return { satirlar: await satirlar(bloklar), toplam };
}

export type OnayKpileri = { bekleyen: number; enEski: Date | null; eski: number; bugunOnay: number; bugunRed: number };

export async function onayKpileri(bugun: string, an: Date): Promise<OnayKpileri> {
  const sayi = (s: Partial<OnaySuzgeci>) => prisma.approvalBlock.count({ where: onayKosulu({ ...BOS_SUZGEC, ...s }, an) });
  const gun = { baslangic: bugun, bitis: bugun };
  const [bekleyen, eski, bugunOnay, bugunRed] = await Promise.all([
    // Bekleyen sayısı ve en eskisi aynı koşuldan, tek sorguda.
    prisma.approvalBlock.aggregate({ where: onayKosulu(BOS_SUZGEC, an), _count: true, _min: { openedAt: true } }),
    sayi({ eski: true }),
    sayi({ durum: "ONAY", ...gun }),
    sayi({ durum: "RED", ...gun }),
  ]);
  return { bekleyen: bekleyen._count, enEski: bekleyen._min.openedAt, eski, bugunOnay, bugunRed };
}

export type OnayPaneli = {
  blok: OnaySatiri;
  siparisDurumu: OrderStatus | null;
  /** NEGATIF_STOK (SIP): ürün başına kalan sevk (sevkiyatın denetimi gibi toplanır) ve depodaki stok. */
  negatifStok: { urun: string; kod: string; kalan: number; depo: number; yetmiyor: boolean }[] | null;
  /** BEDELSIZ_ONAYI (SIP): bedelsiz satırlar. */
  bedelsiz: { urun: string; adet: number; sebep: FreeReason; not: string | null }[] | null;
  oncekiler: { id: string; ruleCode: string; decision: "ONAY" | "RED" | null; kararVeren: string | null; decisionNote: string | null; decidedAt: Date | null }[];
};

export async function onayPaneli(id: string): Promise<OnayPaneli | null> {
  const b = await prisma.approvalBlock.findUnique({ where: { id } });
  if (!b) return null;
  const [onceki, siparis, depoId] = await Promise.all([
    // Önceki kararlar: aynı belgenin bu bloktan önce açılmış ve kararı verilmiş blokları.
    prisma.approvalBlock.findMany({
      where: { documentType: b.documentType, documentId: b.documentId, id: { not: b.id }, openedAt: { lte: b.openedAt }, decision: { not: null } },
      orderBy: [{ openedAt: "asc" }, { id: "asc" }],
    }),
    b.documentType === "SIP"
      ? prisma.order.findUnique({
          where: { id: b.documentId },
          select: {
            status: true,
            items: {
              orderBy: { id: "asc" },
              select: {
                quantity: true,
                isFree: true,
                freeReason: true,
                freeNote: true,
                productId: true,
                product: { select: { name: true, code: true } },
                shipmentItems: { select: { quantity: true } },
              },
            },
          },
        })
      : null,
    // Aktif depo yoksa (yapılandırma hatası) bağlam boş kalır; panel ve sayfa açılır.
    b.ruleCode === "NEGATIF_STOK" && b.documentType === "SIP" ? varsayilanDepoId().catch(() => null) : null,
  ]);
  const [blok, ...oncekiler] = await satirlar([b, ...onceki]);

  let negatifStok: OnayPaneli["negatifStok"] = null;
  if (siparis && depoId) {
    // Sevkiyatın negatif stok denetimi ürün başına toplar (`negatifStokOnizle`); panel de öyle.
    const urunler = new Map<string, { urun: string; kod: string; kalan: number }>();
    for (const k of siparis.items) {
      const u = urunler.get(k.productId) ?? { urun: k.product.name, kod: k.product.code, kalan: 0 };
      u.kalan += kalanMiktar(k);
      urunler.set(k.productId, u);
    }
    const stok = await hesaplaStoklar([...urunler.keys()], depoId);
    negatifStok = [...urunler].map(([id, u]) => {
      const depo = stok.get(id) ?? 0;
      return { ...u, depo, yetmiyor: u.kalan > 0 && depo < u.kalan };
    });
  }
  const bedelsiz: OnayPaneli["bedelsiz"] =
    siparis && b.ruleCode === "BEDELSIZ_ONAYI"
      ? siparis.items.flatMap((k) => (k.isFree && k.freeReason ? [{ urun: k.product.name, adet: k.quantity, sebep: k.freeReason, not: k.freeNote }] : []))
      : null;

  return {
    blok,
    siparisDurumu: siparis?.status ?? null,
    negatifStok,
    bedelsiz,
    oncekiler: oncekiler.map((o) => ({
      id: o.id,
      ruleCode: o.ruleCode,
      decision: o.decision,
      kararVeren: o.kararVeren,
      decisionNote: o.decisionNote,
      decidedAt: o.decidedAt,
    })),
  };
}

/** Filtrele panelinin açan seçenekleri: bütün kullanıcılar, ada göre (pasif işaretli). */
export async function acanSecenekleri(): Promise<{ id: string; name: string; isActive: boolean }[]> {
  return prisma.user.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, isActive: true } });
}
