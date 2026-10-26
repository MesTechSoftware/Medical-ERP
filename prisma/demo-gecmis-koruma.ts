/**
 * Demo geçmiş seed'inin ortam korumaları (tasarım 2-7b). Saf: veritabanına dokunmaz. Veritabanı
 * düzeyindeki korumalar (demo işareti, geçmişin zaten üretilmiş olması) `demo-gecmis.ts`'tedir.
 * Bağlantı adresinin tamamı hiçbir mesajda yazılmaz; yalnız sunucu adı.
 */
export function korumaHatasi(
  ortam: { NODE_ENV?: string; DEMO_GECMIS?: string; DEMO_GECMIS_HOST?: string },
  veritabaniUrl: string | undefined
): string | null {
  if (ortam.NODE_ENV === "production") return "db:seed:gecmis canlıda çalıştırılamaz.";
  if (ortam.DEMO_GECMIS !== "evet") return "DEMO_GECMIS=evet bayrağı yok: demo geçmişi bilinçli bir seçimdir.";
  if (!veritabaniUrl) return "DATABASE_URL tanımlı değil.";
  let sunucu: string;
  try {
    sunucu = new URL(veritabaniUrl).hostname;
  } catch {
    return "DATABASE_URL çözümlenemedi.";
  }
  const izinli = (ortam.DEMO_GECMIS_HOST ?? "")
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean);
  if (izinli.length === 0) return "DEMO_GECMIS_HOST tanımlı değil (virgülle ayrılmış izinli veritabanı sunucuları).";
  if (!izinli.includes(sunucu)) return `Veritabanı sunucusu (${sunucu}) DEMO_GECMIS_HOST izin listesinde değil.`;
  return null;
}
