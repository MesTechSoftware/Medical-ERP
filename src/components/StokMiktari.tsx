import { StatusChip } from "@/components/ui";
import { stokDurumu } from "@/lib/stok-durumu";

/** Stok miktarı + iki seviyeli durum etiketi (tükendi / kritik); renk tek başına bilgi taşımaz. */
export function StokMiktari({ miktar }: { miktar: number }) {
  const durum = stokDurumu(miktar);
  return (
    <span className="inline-flex items-center justify-end gap-2">
      {durum && <StatusChip ton={durum.ton}>{durum.etiket}</StatusChip>}
      <span className={durum ? "font-semibold text-slate-900" : "text-slate-900"}>{miktar}</span>
    </span>
  );
}
