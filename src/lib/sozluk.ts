import { formatla } from "@/lib/money";
import type { FreeReason } from "@/generated/prisma/enums";
import type { BlokKuralKodu } from "@/lib/onay-blogu";
import type { Bildirim, KuralKodu, Parametreler } from "@/lib/sonuc";
import { BRUT, TABAN_ETIKETI } from "@/lib/taban";

/**
 * Kural kodu → kullanıcı metni. Tek sözlük (X-4 §(3)): aynı kural her ekranda aynı cümledir.
 * Sunucu bu dosyayı okumaz (`hata-yuzeyi.test.ts`). Metin yetki ve varlık sızdırmaz (X-4 §(9)).
 */
export const KURAL_METNI: Record<KuralKodu, (p: Parametreler) => string> = {
  ALAN_ZORUNLU: () => "Bu alan zorunludur.",
  GEREKCE_ZORUNLU: () => "Gerekçe zorunludur.",
  GECERSIZ_TUTAR: () => "Geçerli bir tutar giriniz.",
  GECERSIZ_MIKTAR: () => "Geçerli bir miktar giriniz.",
  GECERSIZ_TARIH: () => "Geçerli bir tarih giriniz.",
  TARIH_ARALIGI_TERS: () => "Bitiş günü başlangıç gününden önce olamaz.",
  GECERSIZ_TELEFON: () => "Geçerli bir telefon numarası giriniz (örn. 0532 123 45 67).",

  GIRIS_HATALI: () => "E-posta veya şifre hatalı.",
  GIRIS_KILITLI: (p) => `Çok fazla başarısız deneme. Lütfen ${p.dakika} dakika sonra tekrar deneyin.`,
  PAROLA_KISA: (p) => `Parola en az ${p.asgari} karakter olmalıdır.`,
  PAROLA_YAYGIN: () => "Bu parola çok yaygın; başka bir parola seçin.",
  PAROLA_MEVCUT_HATALI: () => "Mevcut parola hatalı.",
  PAROLA_TEKRAR_UYUSMUYOR: () => "Yeni parola ile tekrarı aynı değil.",
  PAROLA_DEGISMEDI: () => "Yeni parola geçici paroladan farklı olmalıdır.",

  KULLANICI_BULUNAMADI: () => "Kullanıcı bulunamadı.",
  EPOSTA_KAYITLI: () => "Bu e-posta zaten kayıtlı.",
  KENDINI_PASIFLESTIREMEZ: () => "Kendi hesabınızı pasifleştiremezsiniz.",
  SON_YONETICI: () => "Son aktif yönetici pasifleştirilemez.",
  PORTFOY_HEDEFI_SECILMEDI: (p) =>
    `Satıcının ${p.doktorSayisi} doktoru var. Doktorların devredileceği satıcıyı ya da "sahipsiz bırak"ı seçin.`,
  ESZAMANLI_DEGISIKLIK: () => "Aynı anda başka bir değişiklik yapıldı; tekrar deneyin.",

  TELEFON_KAYITLI: (p) =>
    p.portfoyunuzde === 1
      ? `Bu telefon numarası (${p.telefon}) zaten kendi portföyünüzde kayıtlı.`
      : `Bu telefon numarası (${p.telefon}) sistemde zaten kayıtlı. Yöneticinize başvurun.`,
  DOKTOR_KAPSAM_DISI: () => "Bu doktor sizin portföyünüzde değil.",
  DOKTOR_PASIF: () => "Doktor kaydı pasif durumda.",
  DOKTOR_SAHIPSIZ: () =>
    "Bu doktorun sorumlu satıcısı yok. Yönetici bir satıcıya atayana kadar sipariş girilemez.",
  SAHIP_AKTIF_SATICI_DEGIL: () => "Doktorlar yalnız aktif bir satıcıya devredilebilir.",
  BAYI_SAHIP_ATANAMAZ: () => "Bayinin sorumlu satıcısı olmaz.",
  SAHIP_DEGISTI: () => "Bu doktorun sorumlu satıcısı değişti; sipariş kaydedilmedi.",
  DEVIR_DOKTOR_SECILMEDI: () => "Devredilecek doktor seçilmedi.",
  DEVIR_DEGISIKLIK_YOK: () => "Seçilen doktorlar zaten bu sahiplikte.",

  URUN_BULUNAMADI: () => "Ürün bulunamadı.",
  URUN_PASIF: (p) => `${p.urun} pasif durumda.`,
  URUN_KODU_KAYITLI: () => "Bu ürün kodu zaten kullanılıyor.",
  URUN_SIPARISTE_KULLANILDI: () =>
    "Bu ürün siparişlerde kullanıldığı için silinemez. Bunun yerine durumunu Pasif yapın.",
  FIYAT_COZUMLENEMEDI: (p) => `${p.urun} için fiyat çözümlenemedi.`,
  SIPARIS_KALEMI_GECERSIZ: () => "En az bir ürün ve geçerli miktar giriniz.",
  BEDELSIZ_ACIKLAMA_ZORUNLU: () => "Bedelsiz satırda \"Diğer\" sebebi için açıklama zorunludur.",
  SIPARIS_DURUMU_UYGUN_DEGIL: () => "Siparişin durumu bu işleme uygun değil; sayfayı yenileyin.",
  SIPARIS_IPTAL_EDILEMEZ: () =>
    "Sevk edilmiş, teslim edilmiş ya da zaten iptal edilmiş sipariş iptal edilemez; sevk edilen mal iade ile geri alınır.",
  SEVK_KALEMI_YOK: () => "Sevk edilecek en az bir kalem ve geçerli miktar giriniz.",
  SEVK_MIKTARI_ASILDI: (p) => `${p.urun} için sevk edilebilecek kalan miktar ${p.kalan}.`,
  IADE_KALEMI_YOK: () => "İade edilecek en az bir kalem ve geçerli miktar giriniz.",
  IADE_MIKTARI_ASILDI: (p) => `${p.urun} için iade edilebilecek miktar ${p.kalan}.`,

  ODEME_YONTEMI_BULUNAMADI: () => "Ödeme yöntemi bulunamadı.",
  TAHSILAT_BULUNAMADI: () => "Tahsilat bulunamadı.",
  TAHSILAT_ZATEN_IPTAL: () => "Bu tahsilat zaten iptal.",
  CARI_HAREKET_BULUNAMADI: () => "Cari hareket bulunamadı.",
  VADE_YALNIZ_BORC: () => "Vade yalnız borç hareketinde değişir.",
  // X-6 §(6)/(7): tutar değil varlık; tahsilat borçlarla eşleştirilmez (20.10 eki).
  VADESI_GECMIS_HAREKET: (p) =>
    `Vadesi geçmiş hareket var; en eski vade ${String(p.enEskiVade).split("-").reverse().join(".")}. ` +
    "Tahsilatlar borçlarla eşleştirilmez; bu tarih o borcun hâlâ açık olduğunu göstermez.",
  FATURA_SABLONU_TANIMSIZ: () =>
    "Fatura hazırlık şablonu tanımlı değil; dosya, entegratörün sütun eşlemesi kurulumda girildikten sonra üretilir.",
  // K-4 §(6)-d: sistem tarih hesaplar, vergisel sonucu hesaplamaz.
  FATURA_GERIYE_DONUK: (p) =>
    `${p.adet} satırın sevk tarihi ${p.gun} günden eski; e-Fatura geriye dönük en fazla ${p.gun} gün düzenlenebilir.`,
  // A-15 §(5): sistem "uygundur" demez; uyarı neyi kontrol etmediğini yazar.
  NAKIT_TEVSIK_LIMITI: (p) =>
    `Bu carinin aynı gün nakit tahsilat toplamı ${formatla(p.toplam)} (${TABAN_ETIKETI[BRUT]}); ${formatla(p.limit)} tevsik sınırını aşıyor. ` +
    "Bu uyarı yalnız aynı gün ve aynı cari için yapılan nakit tahsilatları toplar; bir faturanın parça parça " +
    "tahsil edilmesi hâlindeki yükümlülüğü değerlendirmez.",

  NEGATIF_STOK: (p) => `Stok yetersiz${p.urun ? ` (${p.urun})` : ""}: işlem sonrası stok ${p.sonra} adet olur.`,
  BEDELSIZ_ONAYI: (p) => `Bedelsiz satır (${p.urun}, ${BEDELSIZ_SEBEP_ADI[p.sebep as FreeReason] ?? p.sebep}) yönetici onayı gerektirir.`,
  ONAY_BEKLIYOR: () => "Bu sipariş yönetici onayı bekliyor; karar verilmeden sevk edilemez.",
  ONAY_REDDEDILDI: () => "Bu siparişin onay talebi reddedildi; sevk edilemez.",
  ONAY_KARARI_VERILMIS: () => "Bu onay talebine zaten karar verilmiş.",
};

/** Onay bekleyenler ekranında bloğun kural adı (A-8); blok parametre saklamaz. */
export const BLOK_KURAL_ADI: Record<BlokKuralKodu, string> = {
  NEGATIF_STOK: "Negatif stok",
  BEDELSIZ_ONAYI: "Bedelsiz satır",
};

/** Bedelsiz satır sebebi (A-2 eki 20.10.2026). */
export const BEDELSIZ_SEBEP_ADI: Record<FreeReason, string> = {
  NUMUNE: "Numune",
  PROMOSYON: "Promosyon",
  MAL_FAZLASI: "Mal fazlası",
  DIGER: "Diğer",
};

export function bildirimMetni(b: Pick<Bildirim, "kural_kodu" | "parametreler">): string {
  return KURAL_METNI[b.kural_kodu](b.parametreler);
}
