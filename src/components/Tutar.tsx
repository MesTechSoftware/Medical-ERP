import { formatla, type ParaDegeri } from "@/lib/money";
import { TABAN_ETIKETI, type Taban } from "@/lib/taban";

/**
 * Ekranda para tutarının TEK gösterimi (Ü-3 §(6)): tutar + taban etiketi. Taban zorunludur.
 * Tablo hücresinde etiket kolon başlığındadır (`baslikta`; başlık `tabanli()` ile yazılır) —
 * bir kolon tek tabanlıdır (Ü-3 §(7)). Tabanı çözülemeyen tutar boş kalır ("—"), etiket
 * gösterilmez (Ü-3 §(13)).
 */
export function Tutar({
  deger,
  taban,
  baslikta,
}: {
  deger: ParaDegeri | null | undefined;
  taban: Taban;
  baslikta?: boolean;
}) {
  const bos = deger === null || deger === undefined;
  return (
    <>
      {formatla(deger)}
      {!baslikta && !bos && (
        <span data-taban={taban} className="ml-1 text-xs font-normal text-slate-400">
          {TABAN_ETIKETI[taban]}
        </span>
      )}
    </>
  );
}
