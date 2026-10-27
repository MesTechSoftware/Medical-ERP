import Link from "next/link";

import { Ikon } from "@/components/Ikon";
import { buton } from "@/components/stil";
import { Card } from "@/components/ui";
import type { AktiviteSatiri } from "@/lib/aktivite";
import { formatDateTime, goreliZaman } from "@/lib/format";

/** Telefonda görünen satır; fazlası geniş ekranda ve "Tümünü gör"le denetim kaydında (brief §3.6). */
const TELEFONDA = 5;

/**
 * Aktivite akışı (brief §3.6): insan diliyle son hareketler. Zaman göreli yazılır, tam an `title`'da
 * (İstanbul) ve `dateTime`'da. Yalnız okuma; satır metni `aktiviteAkisi()`'nden gelir.
 */
export function AktiviteAkisi({ satirlar, simdi }: { satirlar: readonly AktiviteSatiri[]; simdi: Date }) {
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-900">Son hareketler</h2>
        <Link href="/audit-logs" className={buton("metin")}>
          Tümünü gör
          <Ikon ad="ileri" />
        </Link>
      </div>
      {satirlar.length === 0 ? (
        <p className="text-sm text-slate-500">Henüz hareket yok.</p>
      ) : (
        <ol className="divide-y divide-slate-100">
          {satirlar.map((s, i) => (
            <li key={s.id} className={`py-2 text-sm first:pt-0 last:pb-0${i >= TELEFONDA ? " max-md:hidden" : ""}`}>
              <p className="text-slate-700">{s.metin}</p>
              <time dateTime={s.an.toISOString()} title={formatDateTime(s.an)} className="text-xs text-slate-500">
                {goreliZaman(s.an, simdi)}
              </time>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
