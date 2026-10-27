import Link from "next/link";

import { Ikon } from "@/components/Ikon";

/**
 * Dashboard'daki sayfa özeti kartı: başlık sayfaya bağlantıdır, altında birkaç sayı (etiket —
 * değer) ve isteğe bağlı kısa liste. Ton yalnız ilgilenilmesi gereken sıfırdan büyük sayıda:
 * uyarı (`text-critical`) ya da hata (`text-negative`). Sorgu düşerse yalnız bu kart "Yüklenemedi"
 * ve log satırıyla aynı referansı gösterir (X-3).
 */

export type OzetSatiri = { etiket: string; deger: React.ReactNode; ton?: "uyari" | "hata"; href?: string };

/** Özet ızgarası (iskeletle ortak): satırın kendi genişliğinden, KPI satırıyla aynı eşikler. */
export const OZET_IZGARASI = "grid grid-cols-1 gap-4 @min-[576px]:grid-cols-2 @min-[984px]:grid-cols-3";

const TON = { uyari: "text-critical", hata: "text-negative" } as const;

export function SayfaOzeti({
  baslik,
  href,
  satirlar = [],
  liste,
  hataReferansi,
}: {
  baslik: string;
  href: string;
  satirlar?: readonly OzetSatiri[];
  liste?: React.ReactNode;
  hataReferansi?: string;
}) {
  return (
    <div role="group" aria-label={baslik} className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <Link href={href} className="dokunma-hedefi -mx-1 flex items-center justify-between gap-2 rounded px-1 text-sm font-semibold text-slate-900 hover:underline">
        <span>{baslik}</span>
        <span className="flex text-slate-400">
          <Ikon ad="ileri" />
        </span>
      </Link>
      {hataReferansi ? (
        <div className="mt-2">
          <p className="text-sm font-medium text-negative">Yüklenemedi</p>
          <p className="text-xs text-slate-500">
            Hata referansı: <span className="font-mono">{hataReferansi}</span>
          </p>
        </div>
      ) : (
        <>
          <dl className="mt-2 space-y-1 text-sm">
            {satirlar.map((s) => (
              <div key={s.etiket} className="flex items-baseline justify-between gap-3">
                <dt className="shrink-0 text-slate-500">
                  {s.href ? (
                    <Link href={s.href} className="hover:underline">
                      {s.etiket}
                    </Link>
                  ) : (
                    s.etiket
                  )}
                </dt>
                <dd className={`min-w-0 text-right font-medium tabular-nums ${s.ton ? TON[s.ton] : "text-slate-900"}`}>{s.deger}</dd>
              </div>
            ))}
          </dl>
          {liste && <div className="mt-3 border-t border-slate-100 pt-3 text-sm">{liste}</div>}
        </>
      )}
    </div>
  );
}
