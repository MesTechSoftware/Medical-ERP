import { hataKapsulu, type KapsulSonucu } from "@/lib/hata-kapsulu";

/**
 * KPI kartının verisi: okuma hata verirse yalnız o kart düşer ("Yüklenemedi" + referans). Kapsül
 * `hataKapsulu`'dur; bu ad kart çağrılarında okunurluk içindir.
 */
export type KpiSonucu<T> = KapsulSonucu<T>;
export const kpiGetir = hataKapsulu;
