/** Belgenin onay durumu etiketi (A-8): onay bekliyor ya da reddedildi; geçen belgede gösterilmez. */
export function OnayEtiketi({ durum }: { durum: "BEKLIYOR" | "RED" | undefined }) {
  if (!durum) return null;
  return durum === "BEKLIYOR" ? (
    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Onay bekliyor</span>
  ) : (
    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">Onay reddedildi</span>
  );
}
