import { Card } from "@/components/ui";
import { StokMiktari } from "@/components/StokMiktari";

type Satir = { id: string; name: string; code: string; depo: number; konsinye: number; toplam: number };

const SAYI = "px-1 py-1.5 text-right tabular-nums";

/**
 * Mevcut stok (B-4-11): her aktif ürünün depo, konsinye ve toplam adedi. Toplamın durum etiketi
 * Ürünler ekranı ve dashboard ile aynı eşiktendir (`StokMiktari`). Uzun liste kart içinde kayar.
 */
export function MevcutStokKarti({ satirlar }: { satirlar: Satir[] }) {
  return (
    <Card>
      <h2 id="mevcut-stok" className="mb-3 text-sm font-semibold text-slate-900">
        Mevcut Stok
      </h2>
      {satirlar.length === 0 ? (
        <p className="text-sm text-slate-500">Aktif ürün yok.</p>
      ) : (
        <div className="max-h-96 overflow-y-auto">
          <table aria-labelledby="mevcut-stok" className="w-full text-sm text-slate-700">
            <thead className="sticky top-0 bg-white text-xs text-slate-500">
              <tr>
                <th scope="col" className="px-1 py-1.5 text-left font-medium">
                  Ürün
                </th>
                <th scope="col" className={`${SAYI} font-medium`}>
                  Depo
                </th>
                <th scope="col" className={`${SAYI} font-medium`}>
                  Konsinye
                </th>
                <th scope="col" className={`${SAYI} font-medium`}>
                  Toplam
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {satirlar.map((s) => (
                <tr key={s.id} data-urun={s.id}>
                  <td className="px-1 py-1.5">
                    {s.name} <span className="text-xs text-slate-500">({s.code})</span>
                  </td>
                  <td className={SAYI}>{s.depo}</td>
                  <td className={SAYI}>{s.konsinye}</td>
                  <td className={SAYI}>
                    <StokMiktari miktar={s.toplam} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
