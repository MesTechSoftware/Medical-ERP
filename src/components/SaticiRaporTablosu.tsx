import { formatla } from "@/lib/money";
import { Tutar } from "@/components/Tutar";
import { BRUT, MATRAH, tabanli } from "@/lib/taban";
import type { SellerReport } from "@/lib/reports-service";
import { EmptyRow } from "@/components/ui";

/**
 * Satıcı raporu tablosu (X-1 §(1)): üç mutlak sayı, tabanı başlıkta yazılı; oran yok.
 * Hakediş sevkiyat satırına donmuş oranla hesaplanır (X-14); "ödenebilir prim" değildir (X-1 §(7)).
 */
export default function SaticiRaporTablosu({ satirlar }: { satirlar: SellerReport[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
            <th className="px-3 py-2 font-medium">Satıcı</th>
            <th className="px-3 py-2 text-right font-medium">{tabanli("Ciro", MATRAH)}</th>
            <th className="px-3 py-2 text-right font-medium">{tabanli("Hakediş", MATRAH)}</th>
            <th className="px-3 py-2 text-right font-medium">{tabanli("Tahsilat", BRUT)}</th>
            <th className="px-3 py-2 text-right font-medium">Ort. İskonto</th>
            <th className="px-3 py-2 text-right font-medium">Doktor</th>
          </tr>
        </thead>
        <tbody>
          {satirlar.length === 0 && <EmptyRow colSpan={6} text="Satıcı yok." />}
          {satirlar.map((s) => (
            <tr key={s.sellerId} className="border-b border-slate-100 last:border-0">
              <td className="px-3 py-2 font-medium text-slate-900">{s.name}</td>
              <td className="px-3 py-2 text-right tabular-nums"><Tutar deger={s.ciro} taban={MATRAH} baslikta /></td>
              <td className="px-3 py-2 text-right tabular-nums"><Tutar deger={s.hakedis} taban={MATRAH} baslikta /></td>
              <td className="px-3 py-2 text-right tabular-nums"><Tutar deger={s.tahsilat} taban={BRUT} baslikta /></td>
              <td className="px-3 py-2 text-right tabular-nums text-slate-500">
                {formatla(s.ortalamaIskonto, "oran")}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{s.doktorSayisi}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
