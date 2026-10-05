import { policy } from "@/lib/policy";

// Gösterim daima `zaman.saatDilimi`'ne sabittir; sunucunun ve tarayıcının dilimi
// okunmaz (E-1 §(2)/(7)).
const timeZone = policy.zaman.saatDilimi;

export function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(d: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/**
 * `date` kolonu (takvim günü) gösterimi. Değer UTC gece yarısıdır ve dilim
 * taşımaz (E-1 §(1)); İstanbul'a çevrilmez, olduğu gibi okunur.
 */
export function formatGun(d: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}
