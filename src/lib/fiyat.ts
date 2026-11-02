import Decimal from "decimal.js";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { policy } from "@/lib/policy";

type Db = Prisma.TransactionClient | typeof prisma;

export type FiyatSonucu =
  | { durum: "TAMAM"; listeFiyat: Decimal; fiyatListesiId: string }
  | { durum: "HATA"; neden: "LISTE_YOK" | "FIYAT_COZUMLENEMEDI" };

/** Fiyat seçiminin koşulu: satır miktarı (barem, B-6) ve belge günü (B-5, E-1). */
export type FiyatKosulu = {
  /** Satırın toplam miktarı; bedelsiz satır barem miktarına sayılmaz (B-6). */
  miktar: number;
  /** `date` biçiminde İstanbul günü (`bugun()`); aralık yarı açıktır `[başlangıç, bitiş)` (E-1 §(4)). */
  gun: Date;
};

/**
 * `cozumleBirimFiyat()` — liste fiyatının TEK yolu (B-5 · B-6 · X-10). Tek çağrı noktası
 * listesinin 5. maddesi.
 *
 * - Liste: carinin atanmış listesi; yoksa `pricing.varsayilanFiyatListesiKodu` (X-10 §(2)).
 * - Satır: o listede, o ürün için, `gun`de geçerli (`gecerli_baslangic <= gun < gecerli_bitis`,
 *   boş uç süresiz) ve `min_adet <= miktar` olanların **en yüksek `min_adet`**'lisi (B-6 alt sınır
 *   satırları; üst sınır yok). Tarih çakışması DB'de yasaktır (B-5), seçim tektir.
 * - Uygun satır yoksa hata döner; varsayılana ya da son fiyata DÜŞÜLMEZ (X-10 §(3), B-5) →
 *   çağıran `SERT` `FIYAT_COZUMLENEMEDI` döner (X-4).
 *
 * `doktorId` boşsa (ürün ekranı) doğrudan varsayılan liste okunur.
 * X-5 §(4): parasal aritmetiğe izin verilen iki dosyadan biridir.
 */
export async function cozumleBirimFiyat(
  urunId: string,
  doktorId: string | null,
  kosul: FiyatKosulu,
  db: Db = prisma
): Promise<FiyatSonucu> {
  if (!Number.isInteger(kosul.miktar) || kosul.miktar <= 0) {
    throw new Error(`Geçersiz miktar: ${kosul.miktar}`);
  }
  let fiyatListesiId: string | null = null;

  if (doktorId) {
    const doktor = await db.doctor.findUnique({
      where: { id: doktorId },
      select: { priceListId: true },
    });
    fiyatListesiId = doktor?.priceListId ?? null;
  }
  if (!fiyatListesiId) {
    fiyatListesiId = await varsayilanListeId(db);
    if (!fiyatListesiId) return { durum: "HATA", neden: "LISTE_YOK" };
  }

  const listeFiyat = (await listedenFiyatlar(fiyatListesiId, [urunId], kosul, db)).get(urunId)?.fiyat;
  if (!listeFiyat) return { durum: "HATA", neden: "FIYAT_COZUMLENEMEDI" };

  return { durum: "TAMAM", listeFiyat, fiyatListesiId };
}

/**
 * Birden çok ürünün varsayılan liste fiyatı (ürün ekranı; X-10 §(5)). Satır seçimi
 * `cozumleBirimFiyat()` ile aynı yoldur (X-10-4). Her istenen kimlik haritadadır.
 */
export async function cozumleListeFiyatlari(
  urunIdler: readonly string[],
  kosul: FiyatKosulu,
  db: Db = prisma
): Promise<Map<string, FiyatSonucu>> {
  const sonuc = new Map<string, FiyatSonucu>();
  if (urunIdler.length === 0) return sonuc;
  const fiyatListesiId = await varsayilanListeId(db);
  const fiyatlar = fiyatListesiId ? await listedenFiyatlar(fiyatListesiId, urunIdler, kosul, db) : new Map<string, ListeSecimi>();
  for (const id of urunIdler) {
    const listeFiyat = fiyatlar.get(id)?.fiyat;
    sonuc.set(
      id,
      !fiyatListesiId
        ? { durum: "HATA", neden: "LISTE_YOK" }
        : listeFiyat
          ? { durum: "TAMAM", listeFiyat, fiyatListesiId }
          : { durum: "HATA", neden: "FIYAT_COZUMLENEMEDI" }
    );
  }
  return sonuc;
}

async function varsayilanListeId(db: Db): Promise<string | null> {
  const kod = policy.pricing.varsayilanFiyatListesiKodu;
  return (await db.priceList.findUnique({ where: { code: kod }, select: { id: true } }))?.id ?? null;
}

/**
 * Satırın `gun`de geçerli olma koşulu (B-5, E-1 §(4)): yarı açık `[başlangıç, bitiş)`, boş uç süresiz.
 * Tek tanımdır; fiyat listesi ekranının "aktif liste" sayımı da bunu kullanır (X-10-6). Çağıran yaymaz,
 * `AND: [gecerliSatir(gun)]` içine koyar — kendi `AND` anahtarı koşulu ezmesin.
 */
export function gecerliSatir(gun: Date): Prisma.PriceListItemWhereInput {
  return {
    AND: [
      { OR: [{ validFrom: null }, { validFrom: { lte: gun } }] },
      { OR: [{ validTo: null }, { validTo: { gt: gun } }] },
    ],
  };
}

/** Seçilen satırın fiyatı ve eşiği. */
type ListeSecimi = { fiyat: Decimal; minQuantity: number };

/** Listede, `kosul`da geçerli satırlardan ürün başına en yüksek `min_adet`'linin fiyatı ve eşiği (B-5, B-6). */
async function listedenFiyatlar(
  fiyatListesiId: string,
  urunIdler: readonly string[],
  kosul: FiyatKosulu,
  db: Db
): Promise<Map<string, ListeSecimi>> {
  const satirlar = await db.priceListItem.findMany({
    where: {
      priceListId: fiyatListesiId,
      productId: { in: [...urunIdler] },
      minQuantity: { lte: kosul.miktar },
      AND: [gecerliSatir(kosul.gun)],
    },
    orderBy: { minQuantity: "desc" },
    select: { productId: true, listPrice: true, minQuantity: true },
  });
  const fiyatlar = new Map<string, ListeSecimi>();
  for (const s of satirlar) {
    if (!fiyatlar.has(s.productId)) fiyatlar.set(s.productId, { fiyat: new Decimal(s.listPrice), minQuantity: s.minQuantity });
  }
  return fiyatlar;
}

/**
 * Matris hücresi: o eşik miktarında seçilen liste fiyatı ve seçilen satırın eşiği (`kaynakEsik`); alt
 * eşikten geliyorsa `devralinan`. Satır yoksa `null`.
 */
export type BaremHucresi = { fiyat: Decimal; kaynakEsik: number; devralinan: boolean } | null;
export type BaremMatrisi = {
  esikler: number[];
  urunler: { id: string; name: string; code: string; hucreler: BaremHucresi[] }[];
};

/**
 * Listenin `gun`deki barem matrisi (spec Ü-21 §3.6, X-10-5): satırlar bugün geçerli satırı olan ürünler
 * (ada göre), sütunlar bu satırların farklı `min_adet`'leri. Her hücre `listedenFiyatlar` ile seçilir —
 * `cozumleBirimFiyat()`'ın kullandığı yol; ikinci bir seçim kuralı yazılmaz. Salt okunur gösterimdir.
 * Bedeli eşik başına bir sorgudur (liste başına birkaç eşik); bellekte seçim ikinci kural olurdu.
 */
export async function baremMatrisi(fiyatListesiId: string, gun: Date, db: Db = prisma): Promise<BaremMatrisi> {
  const satirlar = await db.priceListItem.findMany({
    where: { priceListId: fiyatListesiId, AND: [gecerliSatir(gun)] },
    orderBy: [{ product: { name: "asc" } }, { product: { code: "asc" } }],
    select: { minQuantity: true, product: { select: { id: true, name: true, code: true } } },
  });
  const urunler = [...new Map(satirlar.map((s) => [s.product.id, s.product])).values()];
  const esikler = [...new Set(satirlar.map((s) => s.minQuantity))].sort((a, b) => a - b);
  const idler = urunler.map((u) => u.id);
  const secimler = await Promise.all(esikler.map((miktar) => listedenFiyatlar(fiyatListesiId, idler, { miktar, gun }, db)));
  return {
    esikler,
    urunler: urunler.map((u) => ({
      ...u,
      hucreler: esikler.map((esik, i) => {
        const sec = secimler[i].get(u.id);
        return sec ? { fiyat: sec.fiyat, kaynakEsik: sec.minQuantity, devralinan: sec.minQuantity !== esik } : null;
      }),
    })),
  };
}
