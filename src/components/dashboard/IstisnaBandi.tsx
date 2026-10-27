import Link from "next/link";

import { Ikon } from "@/components/Ikon";
import type { Istisna } from "@/lib/istisnalar";

/** Bantta en çok bu kadar madde; fazlası sayfadaki "Dikkat gerektirenler" bölümündedir. */
const EN_COK = 3;

const BANT = { hata: "border-negative/30 bg-negative-bg", uyari: "border-critical/30 bg-critical-bg" } as const;
const IKON_RENGI = { hata: "text-negative", uyari: "text-critical" } as const;
const BAGLANTI = "dokunma-hedefi font-medium text-link hover:underline";

/**
 * İstisna bandı (brief §3.1): yalnız istisna varken çizilir. Sabittir — kayan yazı, hareket,
 * kapatma ve canlı bölge yoktur. Madde başına semantik ikon, kısa metin ve eylem bağlantısı; en çok
 * üç madde, önem sırası `istisnalar()`'dan gelir. Bandın tonu en ağır maddenin tonudur.
 */
export function IstisnaBandi({ istisnalar }: { istisnalar: readonly Istisna[] }) {
  if (istisnalar.length === 0) return null;
  const ton = istisnalar.some((i) => i.ton === "hata") ? "hata" : "uyari";
  const kalan = istisnalar.length - EN_COK;
  return (
    <section role="region" aria-label="Dikkat gerektirenler" className={`mb-6 rounded-xl border px-4 py-2 ${BANT[ton]}`}>
      <ul className="flex flex-col md:flex-row md:flex-wrap md:items-center md:gap-x-6">
        {istisnalar.slice(0, EN_COK).map((i) => (
          <li key={i.kod} className="flex flex-wrap items-center gap-x-2 text-sm">
            <span className={`flex ${IKON_RENGI[i.ton]}`}>
              <Ikon ad={i.ton} />
            </span>
            <span className="text-slate-900">{i.metin}</span>
            <Link href={i.href} className={BAGLANTI}>
              {i.eylem}
            </Link>
          </li>
        ))}
        {kalan > 0 && (
          <li className="text-sm">
            <Link href="#dikkat" className={BAGLANTI}>
              +{kalan} uyarı daha
            </Link>
          </li>
        )}
      </ul>
    </section>
  );
}
