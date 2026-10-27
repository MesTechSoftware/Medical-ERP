import Link from "next/link";

import { formatSayi } from "@/lib/format";
import { yigilmisOranlar } from "@/lib/kpi/olcek";
import { formatla } from "@/lib/money";

/** Dilim tonu: anlam taşıyan durum semantik renktedir, süreç adımları nötrün iki tonu. */
export type DilimTonu = "uyari" | "hata" | "olumlu" | "notr" | "notrAcik";

export type Dilim = { anahtar: string; etiket: string; adet: number; ton: DilimTonu; href: string };

const DOLGU: Record<DilimTonu, string> = {
  uyari: "fill-critical",
  hata: "fill-negative",
  olumlu: "fill-positive",
  notr: "fill-slate-500",
  notrAcik: "fill-slate-300",
};
const ISARET: Record<DilimTonu, string> = {
  uyari: "bg-critical",
  hata: "bg-negative",
  olumlu: "bg-positive",
  notr: "bg-slate-500",
  notrAcik: "bg-slate-300",
};

/**
 * Yığılmış oran çubuğu (brief §3.3): tek yatay çubuk ve lejant (durum, adet, oran). Çubuk süstür
 * (`aria-hidden`); veri lejantta metindir ve her öğe süzülmüş listeye bağlantıdır. Oranlar
 * `yigilmisOranlar()`'dan gelir (binde, toplamı tam 1); viewBox genişliği 1000 birimdir, dilim
 * genişliği oranın binde değeridir — yuvarlama boşluğu kalmaz. Sunucuda saf SVG.
 */
export function YigilmisOranCubugu({ dilimler, bosMetin }: { dilimler: readonly Dilim[]; bosMetin: string }) {
  if (dilimler.every((d) => d.adet === 0)) return <p className="py-2 text-sm text-slate-500">{bosMetin}</p>;
  const binde = yigilmisOranlar(dilimler.map((d) => d.adet)).map((o) => Math.round(o * 1000));
  const baslar = binde.map((_, i) => binde.slice(0, i).reduce((a, b) => a + b, 0));
  return (
    <div>
      <svg viewBox="0 0 1000 8" preserveAspectRatio="none" aria-hidden="true" className="block h-3 w-full overflow-hidden rounded-full">
        {dilimler.map((d, i) =>
          binde[i] > 0 ? <rect key={d.anahtar} x={baslar[i]} y={0} width={binde[i]} height={8} className={DOLGU[d.ton]} /> : null
        )}
      </svg>
      <ul className="mt-3 grid grid-cols-1 gap-x-6 sm:grid-cols-2">
        {dilimler.map((d, i) => (
          <li key={d.anahtar}>
            <Link href={d.href} className="dokunma-hedefi w-full justify-start gap-2 py-1 text-sm hover:underline">
              <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-full ${ISARET[d.ton]}`} />
              <span className="min-w-0 truncate text-slate-700">{d.etiket}</span>
              <span className="ml-auto font-medium tabular-nums text-slate-900">{formatSayi(d.adet)}</span>
              <span className="w-14 text-right tabular-nums text-slate-500">{formatla(binde[i] / 10, "oran")}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
