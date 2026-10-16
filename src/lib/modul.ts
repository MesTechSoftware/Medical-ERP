import { policy } from "@/lib/policy";

/**
 * `modulAcikMi(kod)` — modül açık/kapalı durumunun TEK okuma noktası (K-9, §1.3 §(4)).
 * Tek çağrı noktası listesinin 10. maddesi.
 *
 * Değer `policy.modules`'tadır: kurulum düzeyi karardır, müşteri açamaz; ayar ekranı ve
 * kullanıcı toggle'ı yoktur (§1.3 §(5)). `process.env`'den okunmaz. Kapalı modülün menüsü,
 * rotası ve server action'ı bu fonksiyona bakarak kapanır — action fail-closed davranır.
 */
export type ModulKodu = keyof typeof policy.modules;

export function modulAcikMi(kod: ModulKodu): boolean {
  return policy.modules[kod];
}
