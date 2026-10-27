import { isIP } from "node:net";

/**
 * İstek bağlamının başlıklardan ayrıştırılması (KARARLAR X-18 §(3)/(8), ADR-011 §8). Saf modül;
 * başlıkları okuyan taraf `baglam.ts`'tir.
 */

/** Sayfa yolunun kayda yazılan en uzun hâli. */
const YOL_SINIRI = 200;

/**
 * `x-forwarded-for`'un en sağdaki girdisi: en yakın atlamanın eklediği adres. Geliştirmede Next
 * soket adresini yazar; canlıda ters vekil istemci adresini ekler. IP olmayan değer kaydedilmez.
 */
export function istemciAdresi(xff: string | null): string | null {
  const girdiler = (xff ?? "")
    .split(",")
    .map((g) => g.trim())
    .filter((g) => g !== "");
  const son = girdiler.at(-1);
  return son !== undefined && isIP(son) !== 0 ? son : null;
}

/** `Referer`'ın yolu; sorgu dizesi ve parça yazılmaz (aramalar kişisel veri taşıyabilir). */
export function sayfaYolu(referer: string | null): string | null {
  if (!referer) return null;
  let yol: string;
  try {
    yol = new URL(referer).pathname;
  } catch {
    // Geçersiz URL: tarayıcının gönderdiği başlık bozuksa uç bilinmiyor demektir.
    return null;
  }
  return yol.startsWith("/") ? yol.slice(0, YOL_SINIRI) : null;
}

/** Server action isteği `next-action` başlığı taşır ve daima POST'tur (ADR-003: route handler yok). */
export function istekYontemi(nextAction: string | null): "POST" | null {
  return nextAction ? "POST" : null;
}
