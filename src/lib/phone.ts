/**
 * Türkiye cep/sabit telefon normalizasyonu.
 *
 * 🔴 FR-09 KRİTİK: doktor mükerrer kaydını engelleyen tek mekanizma budur.
 * Normalize edilmezse iki satıcı aynı doktoru farklı yazımlarla ("0532 123 45 67"
 * vs "+90 532 123 4567") kaydeder; o zaman hem tekil sahiplik kuralı (RULE-02)
 * sessizce delinir hem de doktorun kongre bakiyesi ikiye bölünür.
 *
 * Kanonik biçim: `+90XXXXXXXXXX` (E.164, toplam 13 karakter).
 */

/** Normalize edilemeyen girdiler için hata. */
export class InvalidPhoneError extends Error {
  constructor(input: string) {
    super(`Geçersiz telefon numarası: "${input}"`);
    this.name = "InvalidPhoneError";
  }
}

/**
 * Telefonu `+90XXXXXXXXXX` biçimine çevirir.
 * Kabul edilen yazımlar: `0532...`, `532...`, `90532...`, `+90532...`, `0090532...`
 * ve aralarında boşluk/tire/parantez/nokta bulunan tüm varyantları.
 */
export function normalizePhone(input: string): string {
  if (typeof input !== "string") throw new InvalidPhoneError(String(input));

  // Ayraçları at; baştaki + işaretini uluslararası ön ek olarak yorumla.
  const trimmed = input.trim();
  const hadPlus = trimmed.startsWith("+");
  let digits = trimmed.replace(/\D/g, "");

  if (digits.length === 0) throw new InvalidPhoneError(input);

  // Uluslararası ön ekleri sırayla soy: 00 -> ülke kodu 90 -> ulusal 0.
  if (!hadPlus && digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length > 10 && digits.startsWith("90")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);

  // Geriye tam 10 hane kalmalı ve Türkiye'de ilk hane 0 olamaz.
  if (digits.length !== 10 || digits.startsWith("0")) {
    throw new InvalidPhoneError(input);
  }

  return `+90${digits}`;
}

/** Hata fırlatmadan normalize etmeye çalışır. */
export function tryNormalizePhone(input: string): string | null {
  try {
    return normalizePhone(input);
  } catch {
    return null;
  }
}

/** `+905321234567` -> `0532 123 45 67` (yalnızca gösterim için). */
export function formatPhone(normalized: string): string {
  const d = normalized.replace(/\D/g, "").replace(/^90/, "");
  if (d.length !== 10) return normalized;
  return `0${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`;
}
