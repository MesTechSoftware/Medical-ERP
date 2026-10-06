import Decimal from "decimal.js";

/**
 * Para birimi yardımcıları (X-5).
 *
 * Parasal alanlar veritabanında `Decimal`dir: birim fiyat (18,4) · tutar (18,2) ·
 * oran (5,2). Bu dosyada ARİTMETİK YOKTUR — ham aritmetik yalnız
 * `hesaplaSatirTutarlari()` ve `cozumleBirimFiyat()` içindedir (X-5 §(4)).
 *
 * `formatla()` istemciye giden her parasal değerin TEK çıkış noktasıdır ve
 * değeri `string` olarak verir: `Decimal` sunucu–istemci sınırında serileşmez
 * (X-5 §(6)). Başka yerde `toString()`/`toNumber()` çağrılması kaçış yoludur.
 */

/** Prisma `Decimal`, decimal.js `Decimal` veya ham metin. */
export type ParaDegeri = Decimal.Value | { toFixed(dp?: number): string };

const TRY = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" });

/**
 * Parasal değeri istemciye `string` olarak verir.
 * - `"para"`: gösterim — "₺1.250,50"
 * - `"ham"`: form alanı / istemci hesabı girdisi — "1250.5" (nokta ondalık, üssüz)
 * - `"oran"`: yüzde gösterimi — "%12,66"
 * `null` → "—".
 */
export function formatla(
  deger: ParaDegeri | null | undefined,
  bicim: "para" | "ham" | "oran" = "para"
): string {
  if (deger === null || deger === undefined) return "—";
  const d = new Decimal(deger as Decimal.Value);
  if (bicim === "ham") return d.toFixed();
  if (bicim === "oran") {
    return `%${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(
      d.toFixed(2) as unknown as number
    )}`;
  }
  // Intl.NumberFormat ondalık metni kayıpsız biçimlendirir (float'a düşmez).
  return TRY.format(d.toFixed(2) as unknown as number);
}

/**
 * Kullanıcının girdiği TL metnini `Decimal`e çevirir. "1250,5" ve "1250.5" kabul;
 * en fazla 4 ondalık (birim fiyat ölçeği). Geçersizse `null`.
 */
export function paraOku(metin: string): Decimal | null {
  const t = metin.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,4})?$/.test(t)) return null;
  return new Decimal(t);
}
