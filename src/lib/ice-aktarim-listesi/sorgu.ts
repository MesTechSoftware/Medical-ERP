import type { Prisma } from "@/generated/prisma/client";
import type { ImportDataType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { TANIMLAR } from "@/lib/ice-aktarim";
import { metinVaryantlari } from "@/lib/liste/metin";
import { gunleriAraliga } from "@/lib/siparis-listesi/sorgu";
import { kartSuzgecleri, type PartiSuzgeci } from "@/lib/ice-aktarim-listesi/suzgec";

/**
 * İçe aktarım ekranının sorguları (spec Ü-30 §4). Liste ve KPI kartları tek koşuldan (`partiKosulu`) sayar —
 * kart = satır (X-12-2). Geri alınabilir türler `TANIMLAR`'ın `geriAl` taşıyanlarıdır (açılış türleri değil, D-6-2).
 */
export const GERI_ALINABILIR: readonly ImportDataType[] = (Object.keys(TANIMLAR) as ImportDataType[]).filter((t) => TANIMLAR[t]?.geriAl);

export function partiKosulu(s: PartiSuzgeci): Prisma.ImportBatchWhereInput {
  const ve: Prisma.ImportBatchWhereInput[] = [];
  if (s.durum === "yazildi") ve.push({ revertedAt: null });
  if (s.durum === "geri-alindi") ve.push({ revertedAt: { not: null } });
  if (s.durum === "geri-alinabilir") ve.push({ revertedAt: null, dataType: { in: [...GERI_ALINABILIR] } });
  if (s.tur) ve.push({ dataType: s.tur });
  if (s.baslangic || s.bitis) {
    const a = gunleriAraliga(s);
    ve.push({ createdAt: { gte: a.baslangic, lt: a.bitis } });
  }
  if (s.q) {
    // Türkçe I/ı varyantları (`metinVaryantlari`): veritabanı yereli ı'yı katlamaz.
    ve.push({
      OR: metinVaryantlari(s.q).flatMap((v) => {
        const icerir = { contains: v, mode: "insensitive" as const };
        return [{ batchNo: icerir }, { fileName: icerir }];
      }),
    });
  }
  return ve.length === 0 ? {} : { AND: ve };
}

const SAYIM = { doctors: true, products: true, priceListItems: true, ledgerEntries: true, stockMovements: true } as const;
const KAYIT_ADI: Record<keyof typeof SAYIM, string> = {
  doctors: "Cari",
  products: "Ürün",
  priceListItems: "Fiyat satırı",
  ledgerEntries: "Cari hareket",
  stockMovements: "Stok hareketi",
};

const SATIR = {
  id: true,
  batchNo: true,
  dataType: true,
  fileName: true,
  createdAt: true,
  revertedAt: true,
  revertReason: true,
  user: { select: { name: true } },
  revertedBy: { select: { name: true } },
  _count: { select: SAYIM },
} as const satisfies Prisma.ImportBatchSelect;

type Ham = Prisma.ImportBatchGetPayload<{ select: typeof SATIR }>;

export type PartiSatiri = {
  id: string;
  batchNo: string;
  dataType: ImportDataType;
  fileName: string | null;
  yapan: string;
  createdAt: Date;
  kayit: number;
  geriAlindi: boolean;
};

const satir = (p: Ham): PartiSatiri => ({
  id: p.id,
  batchNo: p.batchNo,
  dataType: p.dataType,
  fileName: p.fileName,
  yapan: p.user.name,
  createdAt: p.createdAt,
  kayit: Object.values(p._count).reduce((a, b) => a + b, 0),
  geriAlindi: p.revertedAt !== null,
});

export async function partiListesi(s: PartiSuzgeci, sayfa: { skip: number; take: number }): Promise<{ satirlar: PartiSatiri[]; toplam: number }> {
  const where = partiKosulu(s);
  const [hamlar, toplam] = await Promise.all([
    prisma.importBatch.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: sayfa.skip, take: sayfa.take, select: SATIR }),
    prisma.importBatch.count({ where }),
  ]);
  return { satirlar: hamlar.map(satir), toplam };
}

export type PartiKpileri = { tumu: number; buAy: number; geriAlinabilir: number; geriAlindi: number };

/** KPI kartları (spec §3.1): her kart, adresinin de türediği süzgeci listenin koşuluyla sayar (X-12-2). */
export async function partiKpileri(bugun: string): Promise<PartiKpileri> {
  const k = kartSuzgecleri(bugun);
  const say = (s: PartiSuzgeci) => prisma.importBatch.count({ where: partiKosulu(s) });
  const [tumu, buAy, geriAlinabilir, geriAlindi] = await Promise.all([say(k.tumu), say(k.buAy), say(k.geriAlinabilir), say(k.geriAlindi)]);
  return { tumu, buAy, geriAlinabilir, geriAlindi };
}

export type PartiPaneli = PartiSatiri & {
  kayitlar: { ad: string; adet: number }[];
  geriAlinabilir: boolean;
  geriAlma: { eden: string | null; zaman: Date; gerekce: string | null } | null;
};

export async function partiPaneli(id: string): Promise<PartiPaneli | null> {
  const p = await prisma.importBatch.findUnique({ where: { id }, select: SATIR });
  if (!p) return null;
  return {
    ...satir(p),
    kayitlar: (Object.keys(SAYIM) as (keyof typeof SAYIM)[]).filter((k) => p._count[k] > 0).map((k) => ({ ad: KAYIT_ADI[k], adet: p._count[k] })),
    geriAlinabilir: p.revertedAt === null && GERI_ALINABILIR.includes(p.dataType),
    geriAlma: p.revertedAt ? { eden: p.revertedBy?.name ?? null, zaman: p.revertedAt, gerekce: p.revertReason } : null,
  };
}
