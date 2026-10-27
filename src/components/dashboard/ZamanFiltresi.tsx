import Link from "next/link";

import { ARALIKLAR, type AralikAnahtari } from "@/lib/donem";

const ETIKET: Record<AralikAnahtari, string> = { bugun: "Bugün", hafta: "Bu Hafta", ay: "Bu Ay", yil: "Bu Yıl" };

/**
 * Dashboard zaman filtresi (K-D2, brief §3.7): bağlantı grubu; seçim URL'dedir (`?aralik=`), sunucu
 * yeniden çizer, istemci durumu yoktur. Yalnız dönem KPI'ları ve blokları değişir; anlık sayılar
 * (bekleyen, kargolanacak, kritik stok, istisnalar) değişmez. Telefonda tam genişlik segment.
 */
export function ZamanFiltresi({ secili, className = "" }: { secili: AralikAnahtari; className?: string }) {
  return (
    <nav aria-label="Zaman aralığı" className={className}>
      <ul className="flex rounded-lg bg-slate-100 p-0.5">
        {ARALIKLAR.map((a) => (
          <li key={a} className="flex-1">
            <Link
              href={`/dashboard?aralik=${a}`}
              aria-current={a === secili ? "page" : undefined}
              className={`flex h-(--toolbar-h) items-center justify-center whitespace-nowrap rounded-md px-3 text-sm font-medium ${
                a === secili ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {ETIKET[a]}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
