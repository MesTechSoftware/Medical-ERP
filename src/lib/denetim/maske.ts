import Decimal from "decimal.js";

import { formatla } from "@/lib/money";

/**
 * Denetim kaydının biçimi ve maskelemesi (KARARLAR X-18 §(6)). Hassas alanın değeri kayda `***`
 * olarak yazılır, alan adı kalır; yazım anında ve rol bağımsız uygulanır. Değerin içeriğine bakan
 * desen (TCKN, kart numarası) yoktur: barkod ve parti numarasında yanlış pozitif üretir.
 */

export const MASKE = "***";

// Adıyla hassas alanlar: kimlik ve fatura seti (A-13 §(7)) ad kuralına uymaz, açıkça sayılır.
const HASSAS_ANAHTARLAR = new Set([
  "passwordHash",
  "password",
  "token",
  "tokenHash",
  "accessToken",
  "refreshToken",
  "secret",
  "taxId",
  "invoiceTitle",
  "taxOffice",
  "invoiceAddress",
  "invoiceDistrict",
  "invoiceCity",
]);

// Adı bu kelimelerden birini taşıyan alan da hassastır (camelCase ya da alt çizgiyle bölünür).
const HASSAS_KELIMELER = new Set(["password", "parola", "sifre", "token", "secret", "tckn", "vkn", "iban", "card", "kart", "cvv"]);

function kelimeler(ad: string): string[] {
  return (ad.match(/[A-Z]+(?![a-z])|[A-Z]?[a-z]+|\d+/g) ?? []).map((k) => k.toLowerCase());
}

export function hassasMi(ad: string): boolean {
  return HASSAS_ANAHTARLAR.has(ad) || kelimeler(ad).some((k) => HASSAS_KELIMELER.has(k));
}

/** Değeri JSON'a yazılabilir biçime çevirir; maskelemez (fark maskelemeden önce kurulur). */
export function normallestir(veri: unknown): unknown {
  if (veri instanceof Date) return veri.toISOString();
  // Parasal alanlar Decimal (X-5); kayda ham metin olarak tek çıkıştan yazılır.
  if (Decimal.isDecimal(veri)) return formatla(veri, "ham");
  if (typeof veri === "bigint") return veri.toString();
  if (Array.isArray(veri)) return veri.map(normallestir);
  if (veri && typeof veri === "object") {
    return Object.fromEntries(Object.entries(veri).map(([anahtar, deger]) => [anahtar, normallestir(deger)]));
  }
  return veri;
}

/** Normalleştirir ve hassas alanların dolu değerini `***` yapar (iç içe nesne ve dizide de). */
export function maskele(veri: unknown): unknown {
  return gizle(normallestir(veri));
}

function gizle(veri: unknown): unknown {
  if (Array.isArray(veri)) return veri.map(gizle);
  if (veri && typeof veri === "object") {
    return Object.fromEntries(
      Object.entries(veri).map(([anahtar, deger]) => [anahtar, hassasMi(anahtar) && deger != null ? MASKE : gizle(deger)])
    );
  }
  return veri;
}
