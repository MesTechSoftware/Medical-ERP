import bcrypt from "bcryptjs";

/**
 * Parola politikası — E-2 §(5), 20.10.2026 eki. TEK YER: kural ve hash'leme yalnız buradadır
 * (`tek-cagri.test.ts`).
 *
 * Asgari uzunluk 8; karmaşıklık kuralı yoktur. Yaygın parolalar büyük/küçük harf farkı
 * gözetilmeden reddedilir. Zorunlu periyodik değişim yoktur (E-2 §(5)).
 */

export const ASGARI_UZUNLUK = 8;

const BCRYPT_TUR = 10;

/**
 * Yaygın parola listesi (asgari uzunluğu geçenler — kısası zaten reddedilir). Kaynak: yaygın
 * sızıntı listelerinin başı + Türkçe klavye/kelime ve kuruma özgü tahminler.
 */
const YAYGIN = new Set([
  "12345678", "123456789", "1234567890", "12345678910", "87654321", "11111111", "00000000",
  "22222222", "88888888", "99999999", "12341234", "11223344", "12121212", "123123123",
  "1q2w3e4r", "1q2w3e4r5t", "q1w2e3r4", "qwertyui", "qwerty123", "qwerty1234", "qwertyuiop",
  "asdfghjk", "asdfghjkl", "zxcvbnm1", "1qaz2wsx", "1qaz2wsx3edc", "zaq12wsx", "abcd1234",
  "abc12345", "abcdefgh", "a1b2c3d4", "aa123456", "password", "password1", "password12",
  "password123", "passw0rd", "p@ssw0rd", "p@ssword", "iloveyou", "sunshine", "princess",
  "football", "baseball", "superman", "starwars", "whatever", "trustno1", "letmein1",
  "welcome1", "welcome123", "admin123", "admin1234", "administrator", "changeme", "default1",
  "computer", "internet", "michael1", "jennifer", "dragon12", "monkey12", "master12",
  "shadow12", "qazwsxedc", "q1w2e3r4t5", "1234qwer", "qwer1234", "asdf1234", "zxcv1234",
  "secret12", "test1234", "testtest", "deneme123", "deneme1234", "denemedeneme", "sifre123",
  "sifre1234", "şifre123", "parola123", "parola1234", "parolam1", "galatasaray",
  "fenerbahce", "besiktas", "trabzonspor", "istanbul", "ankara06", "izmir035", "turkiye1",
  "türkiye1", "turkey123", "ataturk1", "mustafa1", "mehmet12", "ahmet123", "qwertyu1",
  "anka1234", "ankawest", "ankawest1", "anka2026", "medikal1", "medikal123",
  "medikal2026", "satici123", "yonetici", "yonetici1", "yonetici123", "operasyon",
  "operasyon1", "operasyon123",
]);

/** Parola politikaya uyuyorsa `null`, uymuyorsa kullanıcıya gösterilecek mesaj. */
export function parolaHatasi(parola: string): string | null {
  if (parola.length < ASGARI_UZUNLUK) return `Parola en az ${ASGARI_UZUNLUK} karakter olmalıdır.`;
  // İki küçültme: "IZMIR035" → "izmir035" (genel) · "ŞİFRE123" → "şifre123" (Türkçe).
  if (YAYGIN.has(parola.toLowerCase()) || YAYGIN.has(parola.toLocaleLowerCase("tr"))) return "Bu parola çok yaygın; başka bir parola seçin.";
  return null;
}

export function parolaHashle(parola: string): Promise<string> {
  return bcrypt.hash(parola, BCRYPT_TUR);
}

export function parolaDogru(parola: string, hash: string): Promise<boolean> {
  return bcrypt.compare(parola, hash);
}
