// Liste ekranlarının metin araması yardımcıları. Saf modül.

/**
 * Metin aramasının Türkçe varyantları. Veritabanı `en_US` yerelinde büyük/küçük harf katlarken `I`'yı
 * `i`'ye indirir, `ı`'yı katlamaz: "kılıç" "KILIÇ"ı, "ışık" "Işık"ı bulmaz. Varyantlar bu iki kalıbı
 * kapsar — bütün harfleri büyük kayıt (bütün ı→I) ve büyük I ile başlayan kelime (kelime başı ı→I).
 */
export function metinVaryantlari(q: string): string[] {
  const kucuk = q.toLocaleLowerCase("tr");
  const varyantlar = [q, kucuk, kucuk.replace(/ı/g, "I"), kucuk.replace(/(^|[^\p{L}])ı/gu, "$1I")];
  return varyantlar.filter((v, i) => varyantlar.indexOf(v) === i);
}
