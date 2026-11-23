"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { perEkle } from "@/lib/liste/sayfa";

/**
 * Liste ekranlarının hızlı süzgeç hapları (Ü-18 kalıbı); etkin sekme `aria-current`. Süzgeç kaydırmayı yerinde bırakır;
 * adresteki sayfa boyu (`per`) bağlantılara taşınır (`perEkle`).
 */
export function HizliSekmeler({ sekmeler }: { sekmeler: readonly { etiket: string; adres: string; etkin: boolean }[] }) {
  const per = useSearchParams().get("per");
  return (
    <nav aria-label="Hızlı süzgeçler" className="flex flex-wrap gap-2">
      {sekmeler.map((f) => (
        <Link
          key={f.etiket}
          href={perEkle(f.adres, per)}
          scroll={false}
          aria-current={f.etkin ? "page" : undefined}
          className={
            "inline-flex h-(--toolbar-h) items-center rounded-full px-3 text-sm font-medium transition " +
            (f.etkin ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100")
          }
        >
          {f.etiket}
        </Link>
      ))}
    </nav>
  );
}
