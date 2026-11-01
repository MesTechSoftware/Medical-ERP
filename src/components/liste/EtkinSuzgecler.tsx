import Link from "next/link";
import { Ikon } from "@/components/Ikon";

/** Etkin süzgeçlerin × ile kaldırılan etiketleri (Ü-18 kalıbı); yoksa hiçbir şey çizilmez. */
export function EtkinSuzgecler({ etiketler }: { etiketler: readonly { anahtar: string; etiket: string; kaldirAdresi: string }[] }) {
  if (etiketler.length === 0) return null;
  return (
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
  );
}
