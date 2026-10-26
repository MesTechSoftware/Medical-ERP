import { StatusChip } from "@/components/ui";

/** Belgenin onay durumu etiketi (A-8): onay bekliyor ya da reddedildi; geçen belgede gösterilmez. */
export function OnayEtiketi({ durum }: { durum: "BEKLIYOR" | "RED" | undefined }) {
  if (!durum) return null;
  return durum === "BEKLIYOR" ? (
    <StatusChip ton="uyari">Onay bekliyor</StatusChip>
  ) : (
    <StatusChip ton="hata">Onay reddedildi</StatusChip>
  );
}
