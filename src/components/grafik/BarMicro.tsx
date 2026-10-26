/**
 * Karşılaştırma çubukları (büyükten küçüğe sıralı liste, ör. en çok sevk edilen ürünler) ve tablo
 * hücresi için tek oran çubuğu. Değer asla kesilmez — yer yoksa etiket kısalır. Oranlar
 * `cubukOranlari()`'ndan gelir (0–1); çubuk süs değildir, değer metin olarak yanındadır.
 */

export type BarSatiri = { anahtar: string; etiket: string; deger: React.ReactNode; oran: number | null };

export function OranCubugu({ oran, className = "" }: { oran: number | null; className?: string }) {
  return (
    <svg viewBox="0 0 100 4" preserveAspectRatio="none" aria-hidden="true" className={`block h-1.5 ${className}`}>
      <rect x={0} y={0} width={100} height={4} rx={2} className="fill-slate-100" />
      {oran !== null && oran > 0 && <rect x={0} y={0} width={oran * 100} height={4} rx={2} className="fill-slate-400" />}
    </svg>
  );
}

export function BarMicro({ satirlar }: { satirlar: readonly BarSatiri[] }) {
  if (satirlar.length === 0) return <p className="py-2 text-sm text-slate-400">Veri yok</p>;
  return (
    <ul className="space-y-2">
      {satirlar.map((s) => (
        <li key={s.anahtar} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-1 text-sm">
          <span className="truncate text-slate-700" title={s.etiket}>
            {s.etiket}
          </span>
          <span className="whitespace-nowrap text-right font-medium tabular-nums text-slate-900">{s.deger}</span>
          <OranCubugu oran={s.oran} className="col-span-2 w-full" />
        </li>
      ))}
    </ul>
  );
}
