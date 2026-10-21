/**
 * Bildirim olay noktaları — KARARLAR D-1. Faz 1'de noktalar akışlara yerleşir ve çağrılır; **işleyicileri
 * boştur** (`notifications.enabled = false`). Bildirim modülü (Faz 2, kademe 1) bu fonksiyonların
 * gövdesini doldurur; akışlar değişmez.
 *
 * Çağrı, belgeyi yazan transaction'ın içindedir. Gerçek işleyici yan etkiyi commit'ten sonraya
 * bırakmalıdır (geri alınan işlem için e-posta gitmesin) — Faz 2'nin konusudur.
 */
export function onBlokAcildi(olay: { belgeTipi: string; belgeId: string; kuralKodu: string }): void {
  void olay; // işleyici boş (D-1)
}

export function onBlokKararaBaglandi(olay: { blokId: string; karar: "ONAY" | "RED" }): void {
  void olay; // işleyici boş (D-1)
}

export function onSevkiyatTamamlandi(olay: { sevkiyatId: string; siparisId: string; siparisTamamlandi: boolean }): void {
  void olay; // işleyici boş (D-1)
}

export function onIadeKaydedildi(olay: { iadeId: string; siparisId: string }): void {
  void olay; // işleyici boş (D-1)
}
