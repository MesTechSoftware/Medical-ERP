import Link from "next/link";

import { StatusChip } from "@/components/ui";
import { formatSayi } from "@/lib/format";
import type { Istisna } from "@/lib/istisnalar";

/**
 * Dikkat gerektirenler (brief §3.5): tüm istisnalar tek kartta (üstte ayrı bant yoktur — Paket 16). Sayı uyarı ya da
 * hata etiketinde, yanında metin ve eylem bağlantısı; rolün göremediği madde listede hiç yoktur
 * (`istisnalar()`). İstisna yoksa sakin metin: yeşil "uygun" rozeti ve ünlem yok.
 */
export function DikkatListesi({ istisnalar }: { istisnalar: readonly Istisna[] }) {
  const var_ = istisnalar.length > 0;
  return (
    <div
      id="dikkat"
      className={`scroll-mt-4 rounded-xl border p-4 shadow-sm ${var_ ? "border-critical/30 bg-critical-bg/40" : "border-slate-200 bg-white"}`}
    >
      <h2 className="mb-3 text-sm font-semibold text-slate-900">Dikkat gerektirenler</h2>
      {var_ ? (
        <ul className="space-y-2">
          {istisnalar.map((i) => (
            <li key={i.kod} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <StatusChip ton={i.ton}>{formatSayi(i.adet)}</StatusChip>
              <span className="min-w-0 flex-1 text-slate-900">{i.metin}</span>
              <Link href={i.href} className="dokunma-hedefi font-medium text-link hover:underline">
                {i.eylem}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">Dikkat gerektiren bir şey yok.</p>
      )}
    </div>
  );
}
