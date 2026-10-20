/**
 * İş sonucu sözleşmesi — X-4 §(1)–(7), §0.3. Bütün server action'lar `IslemSonucu` döner;
 * iş hatası `throw` edilmez (`throw` = teknik hata → X-3).
 *
 * Sunucu metin üretmez: `kural_kodu` + `parametreler` döner, metin `sozluk.ts`'ten gelir
 * (X-4 §(3)). Bu dosya sunucu ve istemci tarafından okunur; veritabanına dokunmaz.
 */

/** §0.3'ün üç kademesi. Dördüncü hâl (salt kayıt alanı) bildirim üretmez (X-4 §(1)). */
export type Kademe = "SERT" | "YUMUSAK" | "BILGI";

export type Durum = "BASARILI" | "ENGELLENDI" | "ONAY_GEREKLI" | "BASARILI_UYARILI";

/** Kural kodu kataloğu — kodda kapalıdır (X-4 §(3), §0.1.1); metni `sozluk.ts`'te. */
export const KURAL_KODLARI = [
  // Form girdisi
  "ALAN_ZORUNLU",
  "GEREKCE_ZORUNLU",
  "GECERSIZ_TUTAR",
  "GECERSIZ_MIKTAR",
  "GECERSIZ_TARIH",
  "GECERSIZ_TELEFON",
  // Giriş ve parola (E-2)
  "GIRIS_HATALI",
  "GIRIS_KILITLI",
  "PAROLA_KISA",
  "PAROLA_YAYGIN",
  "PAROLA_MEVCUT_HATALI",
  "PAROLA_TEKRAR_UYUSMUYOR",
  "PAROLA_DEGISMEDI",
  // Kullanıcı yönetimi (E-2)
  "KULLANICI_BULUNAMADI",
  "EPOSTA_KAYITLI",
  "KENDINI_PASIFLESTIREMEZ",
  "SON_YONETICI",
  "PORTFOY_HEDEFI_SECILMEDI",
  "ESZAMANLI_DEGISIKLIK",
  // Cari ve sahiplik (X-13, X-15, X-17)
  "TELEFON_KAYITLI",
  "DOKTOR_KAPSAM_DISI",
  "DOKTOR_PASIF",
  "DOKTOR_SAHIPSIZ",
  "SAHIP_AKTIF_SATICI_DEGIL",
  "BAYI_SAHIP_ATANAMAZ",
  "SAHIP_DEGISTI",
  "DEVIR_DOKTOR_SECILMEDI",
  "DEVIR_DEGISIKLIK_YOK",
  // Ürün ve sipariş
  "URUN_BULUNAMADI",
  "URUN_PASIF",
  "URUN_KODU_KAYITLI",
  "URUN_SIPARISTE_KULLANILDI",
  "FIYAT_COZUMLENEMEDI",
  "SIPARIS_KALEMI_GECERSIZ",
  "SIPARIS_DURUMU_UYGUN_DEGIL",
  "SIPARIS_IPTAL_EDILEMEZ",
  // Tahsilat ve cari hareket
  "ODEME_YONTEMI_BULUNAMADI",
  "TAHSILAT_BULUNAMADI",
  "TAHSILAT_ZATEN_IPTAL",
  "CARI_HAREKET_BULUNAMADI",
  "VADE_YALNIZ_BORC",
  "NAKIT_TEVSIK_LIMITI",
  "VADESI_GECMIS_HAREKET",
  // OnayBlogu (A-8)
  "NEGATIF_STOK",
] as const;

export type KuralKodu = (typeof KURAL_KODLARI)[number];

export type Parametreler = Record<string, string | number>;

/** Tek bir iş kuralı bildirimi. `alan` verilirse `SERT` bildirim o form alanının altında gösterilir. */
export type Bildirim = {
  kademe: Kademe;
  kural_kodu: KuralKodu;
  parametreler: Parametreler;
  alan?: string;
};

export type IslemSonucu = {
  durum: Durum;
  /** Bildirimlerin en yükseği — akışı o belirler (X-4 §(7)). Bildirim yoksa `null`. */
  kademe: Kademe | null;
  /** Bütün bildirimler, kademeye göre sıralı; hiçbiri atılmaz (X-4 §(7)). */
  bildirimler: Bildirim[];
  /** Başarı sonucunun parametreleri (ör. devredilen doktor sayısı); metin UI'dadır. */
  parametreler?: Parametreler;
};

const SIRA: Record<Kademe, number> = { SERT: 0, YUMUSAK: 1, BILGI: 2 };

export function sert(kural_kodu: KuralKodu, parametreler: Parametreler = {}, alan?: string): Bildirim {
  return alan ? { kademe: "SERT", kural_kodu, parametreler, alan } : { kademe: "SERT", kural_kodu, parametreler };
}

export function yumusak(kural_kodu: KuralKodu, parametreler: Parametreler = {}): Bildirim {
  return { kademe: "YUMUSAK", kural_kodu, parametreler };
}

export function bilgi(kural_kodu: KuralKodu, parametreler: Parametreler = {}): Bildirim {
  return { kademe: "BILGI", kural_kodu, parametreler };
}

/**
 * Bildirimlerden sonuç: en yüksek kademe akışı belirler (X-4 §(4)/(7)).
 * `SERT` → `ENGELLENDI` · `YUMUSAK` → `ONAY_GEREKLI` · `BILGI` → `BASARILI_UYARILI` · yok → `BASARILI`.
 * Gerekçeyle geçilmiş yumuşak kısıtın `BASARILI_UYARILI` sonucu `OnayBlogu`'nundur (A-8).
 */
export function sonucOlustur(bildirimler: readonly Bildirim[], parametreler?: Parametreler): IslemSonucu {
  const sirali = [...bildirimler].sort((a, b) => SIRA[a.kademe] - SIRA[b.kademe]);
  const kademe = sirali[0]?.kademe ?? null;
  const durum: Durum =
    kademe === "SERT"
      ? "ENGELLENDI"
      : kademe === "YUMUSAK"
        ? "ONAY_GEREKLI"
        : kademe === "BILGI"
          ? "BASARILI_UYARILI"
          : "BASARILI";
  return parametreler ? { durum, kademe, bildirimler: sirali, parametreler } : { durum, kademe, bildirimler: sirali };
}

export function basarili(parametreler?: Parametreler): IslemSonucu {
  return sonucOlustur([], parametreler);
}

/** Tek `SERT` bildirimle engel — action'ların en sık dönüşü. */
export function engel(kural_kodu: KuralKodu, parametreler: Parametreler = {}, alan?: string): IslemSonucu {
  return sonucOlustur([sert(kural_kodu, parametreler, alan)]);
}
