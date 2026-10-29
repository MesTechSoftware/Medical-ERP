import Link from "next/link";
import { Ikon } from "@/components/Ikon";
import { HIZLI_SEKMELER, ayniSuzgec, etkinSuzgecler, urunAdresi, type UrunSuzgeci } from "@/lib/urun-listesi/suzgec";

/**
 * Ürün listesinin süzgeç çubuğu (spec Ü-19 §3.2): hızlı sekmeler, etkin süzgeç etiketleri ve sütun
 * menüsünün yuvası. İki süzgeç alanı olduğu için Filtrele paneli yoktur; süzgeç adres çubuğundadır.
 */
export function SuzgecCubugu({ suzgec, sutunMenusu }: { suzgec: UrunSuzgeci; sutunMenusu?: React.ReactNode }) {
  const etiketler = etkinSuzgecler(suzgec);

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-start gap-2">
        <nav aria-label="Hızlı süzgeçler" className="flex flex-wrap gap-2">
          {HIZLI_SEKMELER.map((f) => {
            const etkin = ayniSuzgec(suzgec, f.suzgec);
            return (
              <Link
                key={f.etiket}
                href={urunAdresi(f.suzgec)}
                aria-current={etkin ? "page" : undefined}
                className={
                  "inline-flex h-(--toolbar-h) items-center rounded-full px-3 text-sm font-medium transition " +
                  (etkin ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100")
                }
              >
                {f.etiket}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex flex-wrap items-start gap-2">{sutunMenusu}</div>
      </div>

      {etiketler.length > 0 && (
        <ul aria-label="Etkin süzgeçler" className="flex flex-wrap gap-2">
          {etiketler.map((e) => (
            <li key={e.anahtar}>
              <Link
                href={e.kaldirAdresi}
                aria-label={`Kaldır: ${e.etiket}`}
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
              >
                {e.etiket}
                <Ikon ad="vazgec" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
