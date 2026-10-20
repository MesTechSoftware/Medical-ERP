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
    const kod = policy.pricing.varsayilanFiyatListesiKodu;
    const varsayilan = await db.priceList.findUnique({ where: { code: kod }, select: { id: true } });
    if (!varsayilan) return { durum: "HATA", neden: "LISTE_YOK" };
    fiyatListesiId = varsayilan.id;
  }

  const satir = await db.priceListItem.findFirst({
    where: {
      priceListId: fiyatListesiId,
      productId: urunId,
      minQuantity: { lte: kosul.miktar },
      AND: [
        { OR: [{ validFrom: null }, { validFrom: { lte: kosul.gun } }] },
        { OR: [{ validTo: null }, { validTo: { gt: kosul.gun } }] },
      ],
    },
    orderBy: { minQuantity: "desc" },
    select: { listPrice: true },
  });
  if (!satir) return { durum: "HATA", neden: "FIYAT_COZUMLENEMEDI" };

  return { durum: "TAMAM", listeFiyat: new Decimal(satir.listPrice), fiyatListesiId };
}
