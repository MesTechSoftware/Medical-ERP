import type Decimal from "decimal.js";
import type { BakiyeYonu } from "@/lib/doctor-cari";
import { BRUT, tabanli } from "@/lib/taban";
import { Tutar } from "@/components/Tutar";

export const BAKIYE_ETIKETI = {
  BORC: "Doktor borçlu",
  ALACAK: "Doktor alacaklı (avans)",
  KAPALI: "Bakiye kapalı",
} as const;

/** Bakiye kolonunun başlığı; hücre tabanı başlıktadır (Ü-3-1). */
export const BAKIYE_BASLIGI = tabanli("Bakiye", BRUT);

/**
 * Tablo hücresinde bakiye (K-2): çıplak negatif gösterilmez — tutar mutlak değer, yön etikette.
 * Taban etiketi kolon başlığındadır (`BAKIYE_BASLIGI`).
 */
export function BakiyeHucresi({ bakiye, yon }: { bakiye: Decimal; yon: BakiyeYonu }) {
  return (
    <>
      <Tutar deger={bakiye.abs()} taban={BRUT} baslikta />
      <span className="block text-xs text-slate-500">{BAKIYE_ETIKETI[yon]}</span>
    </>
  );
}
