"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { perEkle } from "@/lib/liste/sayfa";
import { Ikon } from "@/components/Ikon";

/** Etkin süzgeçlerin × ile kaldırılan etiketleri (Ü-18 kalıbı); yoksa hiçbir şey çizilmez. */
export function EtkinSuzgecler({ etiketler }: { etiketler: readonly { anahtar: string; etiket: string; kaldirAdresi: string }[] }) {
  // Adresteki sayfa boyu (`per`) kaldırma bağlantılarına taşınır (`perEkle`).
  const per = useSearchParams().get("per");
  if (etiketler.length === 0) return null;
  return (
    <ul aria-label="Etkin süzgeçler" className="flex flex-wrap gap-2">
      {etiketler.map((e) => (
        <li key={e.anahtar}>
          <Link
            href={perEkle(e.kaldirAdresi, per)}
            scroll={false}
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
