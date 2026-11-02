import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { baremMatrisi, cozumleListeFiyatlari, gecerliSatir, type BaremMatrisi } from "@/lib/fiyat";
import { policy } from "@/lib/policy";
import { bugun } from "@/lib/zaman";
import type { ListeSuzgeci } from "@/lib/fiyat-listesi-listesi/suzgec";

/**
 * Fiyat listesi ekranı sorguları (spec Ü-21 §4.2). "Bugün geçerli satır" koşulu `fiyat.ts`'in
 * `gecerliSatir`'ıdır; liste, sayım ve "Aktif liste" kartı aynı `where` üreticisini kullanır (X-10-6).
 */

/** Bir cari panelde en çok bu kadar listelenir; fazlası sayıyla yazılır (spec §3.5). */
const PANEL_CARI_SINIRI = 20;

export type ListeSatiri = {
  id: string;
  code: string;
  name: string;
  varsayilan: boolean;
  /** Bugün geçerli satırı olan farklı ürün sayısı. */
  urunSayisi: number;
  /** Bugün geçerli satırlardan `min_adet > 1` olanlar. */
  baremSayisi: number;
  /** Atanmış cari (pasif dahil — atama verisi). */
  cariSayisi: number;
  /** Bugün geçerli en az bir satırı var. */
  aktif: boolean;
};

export type ListeKpileri = {
  toplam: number;
  aktif: number;
  ozelListeliCari: number;
  varsayilanKullanan: number;
  fiyatsizUrun: number;
  varsayilanListeId: string | null;
};

export type ListePaneli = {
  liste: ListeSatiri;
  toplamSatir: number;
  tarihliSatir: number;
  matris: BaremMatrisi;
  cariler: { id: string; fullName: string; pasif: boolean }[];
  cariToplam: number;
};

/** Tek `where` üreticisi: `aktif` bugün geçerli satırı olan, `bos` olmayan liste. */
export function listeKosulu(s: ListeSuzgeci, gun: Date): Prisma.PriceListWhereInput {
  if (s.durum === "aktif") return { items: { some: gecerliSatir(gun) } };
  if (s.durum === "bos") return { items: { none: gecerliSatir(gun) } };
  return {};
}

const LISTE_SECIMI = { id: true, code: true, name: true, _count: { select: { doctors: true } } } as const;
type ListeKaydi = Prisma.PriceListGetPayload<{ select: typeof LISTE_SECIMI }>;

/** Listelerin bugün geçerli satırlarından ürün/barem sayıları — tek okuma. */
async function satirSayilari(listeIdler: string[], gun: Date): Promise<Map<string, { urunler: string[]; barem: number }>> {
  const satirlar = await prisma.priceListItem.findMany({
    where: { priceListId: { in: listeIdler }, ...gecerliSatir(gun) },
    select: { priceListId: true, productId: true, minQuantity: true },
  });
  const sayilar = new Map<string, { urunler: string[]; barem: number }>();
  for (const s of satirlar) {
    const k = sayilar.get(s.priceListId) ?? { urunler: [], barem: 0 };
    if (!k.urunler.includes(s.productId)) k.urunler.push(s.productId);
    if (s.minQuantity > 1) k.barem += 1;
    sayilar.set(s.priceListId, k);
  }
  return sayilar;
}

function satir(l: ListeKaydi, sayi: { urunler: string[]; barem: number } | undefined): ListeSatiri {
  return {
    id: l.id,
    code: l.code,
    name: l.name,
    varsayilan: l.code === policy.pricing.varsayilanFiyatListesiKodu,
    urunSayisi: sayi?.urunler.length ?? 0,
    baremSayisi: sayi?.barem ?? 0,
    cariSayisi: l._count.doctors,
    aktif: (sayi?.urunler.length ?? 0) > 0,
  };
}

/** Süzülmüş ve sayfalanmış liste, koda göre. */
export async function fiyatListeleri(
  s: ListeSuzgeci,
  sayfa: { skip: number; take: number }
): Promise<{ satirlar: ListeSatiri[]; toplam: number }> {
  const gun = bugun();
  const where = listeKosulu(s, gun);
  const [listeler, toplam] = await Promise.all([
    prisma.priceList.findMany({ where, orderBy: [{ code: "asc" }], skip: sayfa.skip, take: sayfa.take, select: LISTE_SECIMI }),
    prisma.priceList.count({ where }),
  ]);
  const sayilar = await satirSayilari(listeler.map((l) => l.id), gun);
  return { satirlar: listeler.map((l) => satir(l, sayilar.get(l.id))), toplam };
}

/** KPI (spec §3.2) — süzgeçten bağımsız. */
export async function fiyatListesiKpileri(): Promise<ListeKpileri> {
  const gun = bugun();
  const [toplam, aktif, ozelListeliCari, aktifCari, aktifUrunler, varsayilan] = await Promise.all([
    prisma.priceList.count(),
    prisma.priceList.count({ where: listeKosulu({ durum: "aktif" }, gun) }),
    prisma.doctor.count({ where: { status: "AKTIF", priceListId: { not: null } } }),
    prisma.doctor.count({ where: { status: "AKTIF" } }),
    prisma.product.findMany({ where: { status: "AKTIF" }, select: { id: true } }),
    prisma.priceList.findUnique({ where: { code: policy.pricing.varsayilanFiyatListesiKodu }, select: { id: true } }),
  ]);
  // Satıcının sipariş giremeyeceği ürün: fiyat seçiminin tek yolu `HATA` döner (X-10 §(3)).
  const fiyatlar = await cozumleListeFiyatlari(aktifUrunler.map((u) => u.id), { miktar: 1, gun });
  return {
    toplam,
    aktif,
    ozelListeliCari,
    varsayilanKullanan: aktifCari - ozelListeliCari,
    fiyatsizUrun: [...fiyatlar.values()].filter((f) => f.durum === "HATA").length,
    varsayilanListeId: varsayilan?.id ?? null,
  };
}

/** Yan panel verisi (spec §3.5); kayıt yoksa `null`. */
export async function fiyatListesiPaneli(id: string): Promise<ListePaneli | null> {
  const liste = await prisma.priceList.findUnique({ where: { id }, select: LISTE_SECIMI });
  if (!liste) return null;
  const gun = bugun();
  const [sayilar, toplamSatir, tarihliSatir, matris, cariler] = await Promise.all([
    satirSayilari([id], gun),
    prisma.priceListItem.count({ where: { priceListId: id } }),
    prisma.priceListItem.count({ where: { priceListId: id, OR: [{ validFrom: { not: null } }, { validTo: { not: null } }] } }),
    baremMatrisi(id, gun),
    prisma.doctor.findMany({
      where: { priceListId: id },
      orderBy: [{ fullName: "asc" }, { id: "asc" }],
      take: PANEL_CARI_SINIRI,
      select: { id: true, fullName: true, status: true },
    }),
  ]);
  return {
    liste: satir(liste, sayilar.get(id)),
    toplamSatir,
    tarihliSatir,
    matris,
    cariler: cariler.map((c) => ({ id: c.id, fullName: c.fullName, pasif: c.status === "PASIF" })),
    cariToplam: liste._count.doctors,
  };
}
