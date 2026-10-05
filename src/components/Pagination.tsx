import Link from "next/link";

/**
 * Sunucu bileşeni sayfalama kontrolü. Mevcut arama parametrelerini korur
 * (ör. `?status=BEKLIYOR` filtresi sayfa değiştirince kaybolmaz).
 */
export default function Pagination({
  page,
  totalPages,
  total,
  basePath,
  params,
}: {
  page: number;
  totalPages: number;
  total: number;
  basePath: string;
  params?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const href = (target: number) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params ?? {})) {
      if (v) qs.set(k, v);
    }
    qs.set("page", String(target));
    return `${basePath}?${qs.toString()}`;
  };

  const linkClass =
    "rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50";
  const disabledClass =
    "rounded-md border border-slate-100 px-3 py-1.5 text-sm text-slate-300";

  return (
    <nav
      aria-label="Sayfalama"
      className="mt-4 flex items-center justify-between"
    >
      <p className="text-sm text-slate-500">
        Sayfa {page} / {totalPages} · toplam {total} kayıt
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={href(page - 1)} className={linkClass} rel="prev">
            Önceki
          </Link>
        ) : (
          <span className={disabledClass}>Önceki</span>
        )}
        {page < totalPages ? (
          <Link href={href(page + 1)} className={linkClass} rel="next">
            Sonraki
          </Link>
        ) : (
          <span className={disabledClass}>Sonraki</span>
        )}
      </div>
    </nav>
  );
}
