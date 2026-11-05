import type { Prisma } from "@/generated/prisma/client";
import type { FreeReason, OrderStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { metinVaryantlari } from "@/lib/liste/metin";
import { BOS_SUZGEC, ESKI_ONAY_SAATI, type OnaySuzgeci } from "@/lib/onay-listesi/suzgec";
import { kalemMiktarlari } from "@/lib/siparis";
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
 * Metni taşıyan belgelerin kimlikleri: SIP/KNS numarası ya da carisi, TRF/DZL numarası (Türkçe varyantlı).
 * Arama yalnız onay bloğu olan belgelerde yapılır: geniş bir metin bütün siparişleri döndürmez, liste sınırlı kalır.
 */
async function metinBelgeleri(q: string): Promise<string[]> {
  const bloklu = (await prisma.approvalBlock.findMany({ distinct: ["documentId"], select: { documentId: true } })).map((b) => b.documentId);
  const kapsam = { id: { in: bloklu } };
  const icerir = metinVaryantlari(q).map((v) => ({ contains: v, mode: "insensitive" as const }));
  const noVeCari = icerir.flatMap((c) => [{ documentNo: c }, { doctor: { fullName: c } }]);
  const yalnizNo = icerir.map((c) => ({ documentNo: c }));
  const [sip, kns, trf, dzl] = await Promise.all([
    prisma.order.findMany({ where: { ...kapsam, OR: noVeCari }, select: { id: true } }),
    prisma.consignmentIssue.findMany({ where: { ...kapsam, OR: noVeCari }, select: { id: true } }),
    prisma.stockTransfer.findMany({ where: { ...kapsam, OR: yalnizNo }, select: { id: true } }),
    prisma.stockAdjustment.findMany({ where: { ...kapsam, OR: yalnizNo }, select: { id: true } }),
  ]);
  return [...sip, ...kns, ...trf, ...dzl].map((r) => r.id);
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

/** Blokların belge numarası, carisi ve kişi adları — tür başına tek okuma. */
async function satirlar(bloklar: readonly HamBlok[]): Promise<OnaySatiri[]> {
  const idler = (tur: string) => bloklar.filter((b) => b.documentType === tur).map((b) => b.documentId);
  const [sip, kns, trf, dzl, kisiler] = await Promise.all([
    prisma.order.findMany({ where: { id: { in: idler("SIP") } }, select: { id: true, documentNo: true, doctor: { select: { fullName: true } } } }),
    prisma.consignmentIssue.findMany({ where: { id: { in: idler("KNS") } }, select: { id: true, documentNo: true, doctor: { select: { fullName: true } } } }),
    prisma.stockTransfer.findMany({ where: { id: { in: idler("TRF") } }, select: { id: true, documentNo: true } }),
    prisma.stockAdjustment.findMany({ where: { id: { in: idler("DZL") } }, select: { id: true, documentNo: true } }),
    prisma.user.findMany({
      where: { id: { in: [...new Set(bloklar.flatMap((b) => (b.decidedById ? [b.openedById, b.decidedById] : [b.openedById])))] } },
      select: { id: true, name: true },
    }),
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
  const [bekleyen, enEski, eski, bugunOnay, bugunRed] = await Promise.all([
    sayi({}),
    prisma.approvalBlock.aggregate({ where: onayKosulu(BOS_SUZGEC, an), _min: { openedAt: true } }),
    sayi({ eski: true }),
    sayi({ durum: "ONAY", ...gun }),
    sayi({ durum: "RED", ...gun }),
  ]);
  return { bekleyen, enEski: enEski._min.openedAt, eski, bugunOnay, bugunRed };
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
                returnItems: { select: { quantity: true } },
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
      u.kalan += kalemMiktarlari(k).kalan;
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
