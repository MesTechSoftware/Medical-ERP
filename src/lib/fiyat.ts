import Decimal from "decimal.js";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { policy } from "@/lib/policy";

type Db = Prisma.TransactionClient | typeof prisma;

export type FiyatSonucu =
  | { durum: "TAMAM"; listeFiyat: Decimal; fiyatListesiId: string }
  | { durum: "HATA"; neden: "LISTE_YOK" | "FIYAT_COZUMLENEMEDI" };

/**
 * `cozumleBirimFiyat()` — liste fiyatının TEK yolu (B-5 · B-6 · X-10).
 * Tek çağrı noktası listesinin 5. maddesi; bu, `CM` ilk sürümüdür
 * (FAZ1 §D.1 not 3): yalnız LİSTE SEÇİMİ yapar.
 *
 * - Liste: carinin atanmış listesi; yoksa `pricing.varsayilanFiyatListesiKodu` (X-10 §(2)).
 * - Atanmış listede ürünün satırı yoksa varsayılana DÜŞÜLMEZ → hata (X-10 §(3)).
 * - Barem (`minQuantity`) ve tarih aralığı 1B madde 5'te; ilk sürüm en küçük
 *   `minQuantity` satırını alır.
 *
 * `doktorId` boşsa (ürün ekranı) doğrudan varsayılan liste okunur.
 * X-5 §(4): parasal aritmetiğe izin verilen iki dosyadan biridir.
 */
export async function cozumleBirimFiyat(
  urunId: string,
  doktorId: string | null,
  db: Db = prisma
): Promise<FiyatSonucu> {
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
    where: { priceListId: fiyatListesiId, productId: urunId },
    orderBy: { minQuantity: "asc" },
    select: { listPrice: true },
  });
  if (!satir) return { durum: "HATA", neden: "FIYAT_COZUMLENEMEDI" };

  return { durum: "TAMAM", listeFiyat: new Decimal(satir.listPrice), fiyatListesiId };
}
