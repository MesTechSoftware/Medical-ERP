import Link from "next/link";

import { Ikon } from "@/components/Ikon";

/**
 * İmleçli sayfalama (KARARLAR X-18 §(9)): toplam sayı okunmaz, yalnız "Daha yeni / Daha eski". Kutular
 * `Pagination` ile aynı ölçüdedir; telefonda yalnız ikon görünür, erişilebilir ad her genişlikte yazılı.
 */
export function ImlecSayfalama({ dahaYeni, dahaEski }: { dahaYeni: string | null; dahaEski: string | null }) {
  if (!dahaYeni && !dahaEski) return null;
  const kutu = "inline-flex h-(--toolbar-h) min-w-11 items-center justify-center gap-1 rounded-md border px-3 text-sm";
  const etkin = `${kutu} border-slate-200 text-slate-700 hover:bg-slate-50`;
  const pasif = `${kutu} border-slate-100 text-slate-300`;
  const metin = (m: string) => <span className="sr-only md:not-sr-only">{m}</span>;
  const yeni = (
    <>
      <Ikon ad="onceki" />
      {metin("Daha yeni")}
    </>
  );
  const eski = (
    <>
      {metin("Daha eski")}
      <Ikon ad="sonraki" />
    </>
  );
  return (
    <nav aria-label="Sayfalama" className="mt-4 flex items-center justify-center gap-3 md:justify-end">
      {dahaYeni ? (
        <Link href={dahaYeni} className={etkin} rel="prev">
          {yeni}
        </Link>
      ) : (
        <span className={pasif}>{yeni}</span>
      )}
      {dahaEski ? (
        <Link href={dahaEski} className={etkin} rel="next">
          {eski}
        </Link>
      ) : (
        <span className={pasif}>{eski}</span>
      )}
    </nav>
  );
}
