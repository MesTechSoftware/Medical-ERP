import Link from "next/link";

/**
 * Liste ekranlarının hızlı süzgeç hapları (Ü-18 kalıbı); etkin sekme `aria-current`. Süzgeç kaydırmayı yerinde bırakır.
 * `sayi` verilirse etiketin yanında satır sayısı görünür. `kaydir`: sekmeler tek satır yatay kayan şerittir
 * (telefonda yalnız şeridin `scrollLeft`'i kayar, sayfa kaymaz — A-5-9).
 */
export function HizliSekmeler({
  sekmeler,
  kaydir = false,
}: {
  sekmeler: readonly { etiket: string; adres: string; etkin: boolean; sayi?: number }[];
  kaydir?: boolean;
}) {
  return (
    <nav
      aria-label="Hızlı süzgeçler"
      className={kaydir ? "flex min-w-0 max-w-full gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]" : "flex flex-wrap gap-2"}
    >
      {sekmeler.map((f) => (
        <Link
          key={f.etiket}
          href={f.adres}
          scroll={false}
          aria-current={f.etkin ? "page" : undefined}
          className={
            "inline-flex h-(--toolbar-h) shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition " +
            (f.etkin ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100")
          }
        >
          {f.etiket}
          {f.sayi !== undefined && <span className={"tabular-nums " + (f.etkin ? "text-slate-300" : "text-slate-400")}>{f.sayi}</span>}
        </Link>
      ))}
    </nav>
  );
}
