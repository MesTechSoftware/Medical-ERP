import type Decimal from "decimal.js";
import type { Prisma } from "@/generated/prisma/client";
import type { EntityStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { cozumleListeFiyatlari, type FiyatSonucu } from "@/lib/fiyat";
import { policy } from "@/lib/policy";
import { hesaplaSatirTutarlari } from "@/lib/satir-tutarlari";
import { aktifUrunStoklari, hesaplaStoklar, stokSerisi } from "@/lib/stok";
import { stokDurumu } from "@/lib/stok-durumu";
import { HAREKET_KAYNAGI, hareketTuru } from "@/lib/stok-hareket-turu";
import { bugun } from "@/lib/zaman";
import type { UrunSuzgeci } from "@/lib/urun-listesi/suzgec";

/**
 * Ürün listesi sorguları (spec Ü-19 §4.2). Stok `hesaplaStoklar` (B-4-7), liste fiyatı
 * `cozumleListeFiyatlari` (X-10-4) ile toplu okunur; KDV dahil fiyat 1 adetlik satırın toplamıdır (Ü-3-2).
 */

export type UrunSatiri = {
  id: string;
  name: string;
  code: string;
  status: EntityStatus;
  kdvOrani: Prisma.Decimal;
  stok: number;
  /** Varsayılan listenin bugünkü 1 adetlik fiyatı, KDV hariç; çözülemezse `null`. */
  fiyat: Decimal | null;
  fiyatKdvDahil: Decimal | null;
};

export type UrunPaneli = {
  urun: UrunSatiri;
  seri: { gun: string; stok: number }[];
  hareketler: { id: string; createdAt: Date; tur: string; konum: string; miktar: number; note: string | null }[];
  listeler: {
    id: string;
    code: string;
    name: string;
    isActive: boolean;
    varsayilan: boolean;
    satirlar: { minQuantity: number; listPrice: Prisma.Decimal; validFrom: Date | null; validTo: Date | null }[];
  }[];
};

const URUN_SECIMI = {
  id: true,
  name: true,
  code: true,
  status: true,
  taxRate: { select: { rate: true } },
} as const;

type UrunKaydi = Prisma.ProductGetPayload<{ select: typeof URUN_SECIMI }>;

/** 1 adetlik satırın KDV dahil toplamı — satır yuvarlamasıyla aynı (X-5 §(4), Ü-3-2). */
function kdvDahil(fiyat: Decimal, oran: Prisma.Decimal): Decimal {
  return hesaplaSatirTutarlari([{ birimFiyat: fiyat, listeFiyat: fiyat, miktar: 1, kdvOrani: oran }]).toplam.toplam;
}

function satir(u: UrunKaydi, stok: number, fiyat: FiyatSonucu | undefined): UrunSatiri {
  const liste = fiyat?.durum === "TAMAM" ? fiyat.listeFiyat : null;
  return {
    id: u.id,
    name: u.name,
    code: u.code,
    status: u.status,
    kdvOrani: u.taxRate.rate,
    stok,
    fiyat: liste,
    fiyatKdvDahil: liste ? kdvDahil(liste, u.taxRate.rate) : null,
  };
}

function stokUyar(stok: number, suzgec: UrunSuzgeci["stok"]): boolean {
  if (suzgec === "kritik") return stokDurumu(stok) !== null;
  if (suzgec === "tukendi") return stok <= 0;
  return true;
}

/**
 * Süzülmüş ve sayfalanmış ürün listesi. `durum` SQL'de, `stok` hesaplanan değer olduğundan bellekte
 * süzülür (katalog binler mertebesinde); sayfalama süzmeden sonradır.
 */
export async function urunListesi(
  s: UrunSuzgeci,
  sayfa: { skip: number; take: number }
): Promise<{ satirlar: UrunSatiri[]; toplam: number }> {
  const urunler = await prisma.product.findMany({
    where: s.durum ? { status: s.durum } : {},
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: URUN_SECIMI,
  });
  const stoklar = await hesaplaStoklar(urunler.map((u) => u.id));
  const suzulmus = urunler.filter((u) => stokUyar(stoklar.get(u.id)!, s.stok));
  const gorunen = suzulmus.slice(sayfa.skip, sayfa.skip + sayfa.take);
  const fiyatlar = await cozumleListeFiyatlari(
    gorunen.map((u) => u.id),
    { miktar: 1, gun: bugun() }
  );
  return {
    satirlar: gorunen.map((u) => satir(u, stoklar.get(u.id)!, fiyatlar.get(u.id))),
    toplam: suzulmus.length,
  };
}

/** KPI sayımları (spec §3.1) — süzgeçten bağımsız; kritik yalnız aktif ürünlerde, tükendi dahil. */
export async function urunKpileri(): Promise<{ toplam: number; aktif: number; kritik: number; pasif: number }> {
  const [toplam, aktif, pasif, stoklar] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { status: "AKTIF" } }),
    prisma.product.count({ where: { status: "PASIF" } }),
    aktifUrunStoklari(),
  ]);
  return { toplam, aktif, kritik: stoklar.filter((u) => stokDurumu(u.stok) !== null).length, pasif };
}

/** Yan panel verisi (spec §3.6); kayıt yoksa `null`. */
export async function urunPaneli(id: string): Promise<UrunPaneli | null> {
  const urun = await prisma.product.findUnique({ where: { id }, select: URUN_SECIMI });
  if (!urun) return null;
  const [seri, hareketler, fiyatSatirlari, fiyatlar] = await Promise.all([
    stokSerisi(id, 90),
    prisma.stockMovement.findMany({
      where: { productId: id },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 10,
      select: { id: true, createdAt: true, quantity: true, note: true, location: { select: { name: true } }, ...HAREKET_KAYNAGI },
    }),
    prisma.priceListItem.findMany({
      where: { productId: id, OR: [{ validTo: null }, { validTo: { gt: bugun() } }] },
      orderBy: [{ priceList: { code: "asc" } }, { minQuantity: "asc" }, { validFrom: "asc" }],
      select: {
        minQuantity: true,
        listPrice: true,
        validFrom: true,
        validTo: true,
        priceList: { select: { id: true, code: true, name: true, isActive: true } },
      },
    }),
    cozumleListeFiyatlari([id], { miktar: 1, gun: bugun() }),
  ]);

  const listeler = new Map<string, UrunPaneli["listeler"][number]>();
  for (const { priceList: l, ...s } of fiyatSatirlari) {
    if (!listeler.has(l.id)) {
      listeler.set(l.id, { ...l, varsayilan: l.code === policy.pricing.varsayilanFiyatListesiKodu, satirlar: [] });
    }
    listeler.get(l.id)!.satirlar.push(s);
  }

  return {
    // Başlıktaki stok serinin son noktasıdır (bugünkü stok, B-4-7): ikisi aynı okumadan gelir.
    urun: satir(urun, seri.at(-1)!.stok, fiyatlar.get(id)),
    seri,
    hareketler: hareketler.map((h) => ({
      id: h.id,
      createdAt: h.createdAt,
      tur: hareketTuru(h),
      konum: h.location.name,
      miktar: h.type === "GIRIS" ? h.quantity : -h.quantity,
      note: h.note,
    })),
    listeler: [...listeler.values()],
  };
}
