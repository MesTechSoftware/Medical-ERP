/**
 * Kargo takip linki — KARARLAR D-3: firma tanım tablosundaki `takip_url_sablonu` içindeki `{takip_no}`
 * takip numarasıyla doldurulur; entegrasyon olmadan da çalışır. Şablon ya da numara yoksa `null`.
 */
export function takipLinki(sablon: string | null | undefined, takipNo: string | null | undefined): string | null {
  if (!sablon || !takipNo || !sablon.includes("{takip_no}")) return null;
  return sablon.replaceAll("{takip_no}", encodeURIComponent(takipNo.trim()));
}
