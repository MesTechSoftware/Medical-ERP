/**
 * Dashboard içerik alanları (brief §2), sayfa ve iskelet ortak. Statik sınıflar; eşik KPI satırıyla
 * aynı ölçüdür: içerik satırı ≥ 984 px (kenar çubuğuyla ekran ≈ 1272 px).
 * - Telefon ve dar içerik: tek kolon, öncelik sırasıyla — dağılım, kritik stok, dikkat, akış, en çok sevk.
 * - Geniş (yönetici): sol 2/3 bloklar, sağ 1/3 akış; akış uzunsa boşluğu son satır alır.
 * - Geniş (OPERASYON — akış yok, D-2): iki eşit kolon; akışın yerini kritik stok ve dikkat alır.
 */
export const YERLESIM = {
  yonetici:
    "grid-cols-1 [grid-template-areas:'dagilim'_'kritik'_'dikkat'_'akis'_'encok'] @min-[984px]:grid-cols-3 @min-[984px]:[grid-template-areas:'dagilim_dagilim_akis'_'kritik_kritik_akis'_'dikkat_dikkat_akis'_'encok_encok_akis'] @min-[984px]:[grid-template-rows:auto_auto_auto_1fr]",
  operasyon:
    "grid-cols-1 [grid-template-areas:'dagilim'_'kritik'_'dikkat'_'encok'] @min-[984px]:grid-cols-2 @min-[984px]:[grid-template-areas:'dagilim_kritik'_'encok_dikkat']",
} as const;

export const ALAN = {
  dagilim: "[grid-area:dagilim]",
  kritik: "[grid-area:kritik]",
  dikkat: "[grid-area:dikkat]",
  akis: "[grid-area:akis]",
  encok: "[grid-area:encok]",
} as const;
