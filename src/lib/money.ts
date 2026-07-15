// Para birimi yardımcıları.
// Tüm parasal değerler veritabanında integer KURUŞ olarak saklanır.
// Örn: 150,50 TL -> 15050 kuruş.

/** Kuruş (integer) değeri "1.250,50 ₺" biçiminde Türk Lirası metnine çevirir. */
export function formatTRY(kurus: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(kurus / 100);
}

/** TL cinsinden (ondalıklı) bir tutarı kuruşa (integer) çevirir. */
export function tlToKurus(tl: number): number {
  return Math.round(tl * 100);
}

/** Kuruş (integer) değerini TL cinsine (ondalıklı sayı) çevirir. */
export function kurusToTl(kurus: number): number {
  return kurus / 100;
}
