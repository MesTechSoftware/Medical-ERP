import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { aktifUrunStoklari, konumStoklari } from "@/lib/stok";
import { stokDurumu } from "@/lib/stok-durumu";
import { HAREKET_KAYNAGI, hareketTuru, hareketTuruKodu, turKosulu } from "@/lib/stok-hareket-turu";
import { BOS_SUZGEC, type StokSuzgeci } from "@/lib/stok-listesi/suzgec";
import { yerelGunAraligi } from "@/lib/zaman";

/**
 * Stok ekranı sorguları (spec Ü-20 §4.2). Liste, sayım ve bugünkü KPI'lar tek `where` üreticisinden
 * geçer (B-4-10). Stok toplaması `stok.ts`'tedir; burada yalnız `findMany`/`count` vardır.
 */

export type StokHareketSatiri = {
  id: string;
  createdAt: Date;
  urun: { id: string; name: string; code: string };
  tur: string;
  belgeNo: string | null;
  konum: string;
  /** Girişte pozitif, çıkışta negatif. */
  miktar: number;
  not: string | null;
  /** İşlemi yapan; eski kayıtta bilinmiyorsa `null` (B-4-8). */
  yapan: string | null;
};

/** Süzgecin `where` koşulu; günler İstanbul günüdür, tek uç açık kalabilir. */
export function hareketKosulu(s: StokSuzgeci): Prisma.StockMovementWhereInput {
  const createdAt: Prisma.DateTimeFilter = {};
  if (s.baslangic) createdAt.gte = yerelGunAraligi(s.baslangic)!.baslangic;
  if (s.bitis) createdAt.lt = yerelGunAraligi(s.bitis)!.bitis;
  return {
    ...(s.baslangic || s.bitis ? { createdAt } : {}),
    ...(s.yon ? { type: s.yon } : {}),
    ...(s.tur ? turKosulu(s.tur) : {}),
  };
}

const BELGE = { select: { documentNo: true } } as const;

export async function stokHareketleri(
  s: StokSuzgeci,
  sayfa: { skip: number; take: number }
): Promise<{ satirlar: StokHareketSatiri[]; toplam: number }> {
  const where = hareketKosulu(s);
  const [hareketler, toplam] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: sayfa.skip,
      take: sayfa.take,
      select: {
        id: true,
        createdAt: true,
        quantity: true,
        note: true,
        ...HAREKET_KAYNAGI,
        product: { select: { id: true, name: true, code: true } },
        location: { select: { name: true } },
        createdBy: { select: { name: true } },
        shipment: BELGE,
        returnNote: BELGE,
        consignmentIssue: BELGE,
        stockTransfer: BELGE,
        stockAdjustment: BELGE,
        order: BELGE,
      },
    }),
    prisma.stockMovement.count({ where }),
  ]);
  return {
    satirlar: hareketler.map((h) => {
      const belge = {
        giris: null,
        acilis: null,
        sevkiyat: h.shipment,
        iade: h.returnNote,
        konsinye: h.consignmentIssue,
        transfer: h.stockTransfer,
        duzeltme: h.stockAdjustment,
        siparis: h.order,
      }[hareketTuruKodu(h)];
      return {
        id: h.id,
        createdAt: h.createdAt,
        urun: h.product,
        tur: hareketTuru(h),
        belgeNo: belge?.documentNo ?? null,
        konum: h.location.name,
        miktar: h.type === "GIRIS" ? h.quantity : -h.quantity,
        not: h.note,
        yapan: h.createdBy?.name ?? null,
      };
    }),
    toplam,
  };
}

/** KPI sayımları (spec §3.2) — süzgeçten bağımsız; `bugun` İstanbul günü `YYYY-AA-GG`. */
export async function stokKpileri(
  bugun: string
): Promise<{ stoktaki: number; toplamAdet: number; kritik: number; bugunGiris: number; bugunCikis: number }> {
  const gun = { ...BOS_SUZGEC, baslangic: bugun, bitis: bugun };
  const [stoklar, bugunGiris, bugunCikis] = await Promise.all([
    aktifUrunStoklari(),
    prisma.stockMovement.count({ where: hareketKosulu({ ...gun, yon: "GIRIS" }) }),
    prisma.stockMovement.count({ where: hareketKosulu({ ...gun, yon: "CIKIS" }) }),
  ]);
  const stokta = stoklar.filter((u) => u.stok > 0);
  return {
    stoktaki: stokta.length,
    toplamAdet: stokta.reduce((t, u) => t + u.stok, 0),
    kritik: stoklar.filter((u) => stokDurumu(u.stok) !== null).length,
    bugunGiris,
    bugunCikis,
  };
}

/**
 * Konsinyedeki mal (spec §3.7): aktif konsinye konumlarında sıfırdan farklı her ürün — pasif ürün
 * ve eksiye düşmüş konum dahil. Konumlar tanımlı sırayla (`sortOrder`, ad), konum içinde ürün adıyla.
 */
export async function konsinyedekiMal(): Promise<{ konum: string; urun: string; miktar: number }[]> {
  const konumlar = await prisma.stockLocation.findMany({
    where: { type: "KONSINYE", isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });
  const stoklar = await konumStoklari(konumlar.map((k) => k.id));
  const urunIdler = [...new Set([...stoklar.values()].flatMap((m) => [...m.keys()]))];
  const urunler = await prisma.product.findMany({ where: { id: { in: urunIdler } }, select: { id: true, name: true } });
  const ad = new Map(urunler.map((u) => [u.id, u.name]));
  return konumlar.flatMap((k) =>
    [...stoklar.get(k.id)!]
      .filter(([, miktar]) => miktar !== 0)
      .map(([urunId, miktar]) => ({ konum: k.name, urun: ad.get(urunId)!, miktar }))
      .sort((a, b) => a.urun.localeCompare(b.urun, "tr"))
  );
}
