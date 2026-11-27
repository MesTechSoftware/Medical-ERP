import Link from "next/link";
import { Ikon } from "@/components/Ikon";

/**
 * Sunucu bileşeni sayfalama kontrolü. Mevcut arama parametrelerini korur
 * (ör. `?status=BEKLIYOR` filtresi sayfa değiştirince kaybolmaz).
 * Telefonda kısa biçim (yalnız ikonlar ve 3 / 12); çubuk yüksekliği tablo araç çubuğuyla aynı.
 */
export default function Pagination({
  page,
  totalPages,
  total,
  basePath,
  params,
  sayfaParametresi = "page",
}: {
  page: number;
  totalPages: number;
  total: number;
  basePath: string;
  params?: Record<string, string | undefined>;
  /** Sayfa numarasının adres parametresi; aynı ekranda ikinci bir liste için `page`'den farklı verilir. */
  sayfaParametresi?: string;
}) {
  if (totalPages <= 1) return null;

  const href = (target: number) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params ?? {})) {
      if (v) qs.set(k, v);
    }
    qs.set(sayfaParametresi, String(target));
    return `${basePath}?${qs.toString()}`;
  };

  const kutu =
    "inline-flex h-(--toolbar-h) min-w-11 items-center justify-center gap-1 rounded-md border px-3 text-sm";
  const linkClass = `${kutu} border-slate-200 text-slate-700 hover:bg-slate-50`;
  const disabledClass = `${kutu} border-slate-100 text-slate-300`;

  // Erişilebilir ad her genişlikte "Önceki"/"Sonraki"; telefonda yalnız ikon görünür.
  const metin = (m: string) => <span className="sr-only md:not-sr-only">{m}</span>;
  const onceki = (
    <>
      <Ikon ad="onceki" />
      {metin("Önceki")}
    </>
  );
  const sonraki = (
    <>
      {metin("Sonraki")}
      <Ikon ad="sonraki" />
    </>
  );

  return (
    <nav
      aria-label="Sayfalama"
      className="mt-4 flex items-center justify-center gap-3 md:justify-between"
    >
      <p className="order-2 text-sm tabular-nums text-slate-500 md:order-1 md:mr-auto">
        <span className="md:hidden">
          {page} / {totalPages}
        </span>
        <span className="hidden md:inline">
          Sayfa {page} / {totalPages} · toplam {total} kayıt
        </span>
      </p>
      {page > 1 ? (
        <Link href={href(page - 1)} className={`${linkClass} order-1 md:order-2`} rel="prev">
          {onceki}
        </Link>
      ) : (
        <span className={`${disabledClass} order-1 md:order-2`}>{onceki}</span>
      )}
      {page < totalPages ? (
        <Link href={href(page + 1)} className={`${linkClass} order-3`} rel="next">
          {sonraki}
        </Link>
      ) : (
        <span className={`${disabledClass} order-3`}>{sonraki}</span>
      )}
    </nav>
  );
}
