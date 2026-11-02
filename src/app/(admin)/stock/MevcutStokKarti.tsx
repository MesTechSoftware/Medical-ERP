import { Card } from "@/components/ui";
import { StokMiktari } from "@/components/StokMiktari";

type Satir = { id: string; name: string; code: string; depo: number; konsinye: number; toplam: number };

/**
 * Mevcut stok (B-4-11): her aktif ürünün depo, konsinye ve toplam adedi. Toplamın durum etiketi
 * Ürünler ekranı ve dashboard ile aynı eşiktendir (`StokMiktari`). Ortak tablo sınıflarıyla çizilir:
 * masaüstünde tablo yüksekliği sınırlı ve kayar, telefonda iç kaydırma yoktur (ADR-009).
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
        <div className="tablo-kutusu">
          <table aria-labelledby="mevcut-stok" className="veri-tablosu">
            <thead>
              <tr>
                <th>Ürün</th>
                <th className="sayi">Depo</th>
                <th className="sayi">Konsinye</th>
                <th className="sayi">Toplam</th>
              </tr>
            </thead>
            <tbody>
              {satirlar.map((s) => (
                <tr key={s.id} data-urun={s.id}>
                  <td className="text-slate-900">
                    {s.name}
                    <span className="ml-1 text-xs text-slate-400">{s.code}</span>
                  </td>
                  <td className="sayi">{s.depo}</td>
                  <td className="sayi">{s.konsinye}</td>
                  <td className="sayi">
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
