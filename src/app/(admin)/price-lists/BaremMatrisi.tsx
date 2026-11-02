import { Tutar } from "@/components/Tutar";
import type { BaremMatrisi as Matris } from "@/lib/fiyat";
import { MATRAH, tabanli } from "@/lib/taban";

/**
 * Salt okunur barem matrisi (spec Ü-21 §3.6, X-10-5): ürün × `min_adet` eşiği, bugün geçerli fiyatlar.
 * Alt eşikten devralınan hücre soluktur (B-6'da üst eşik yoktur, o miktarda bu fiyat uygulanır);
 * eşiğe kadar satır yoksa "—". Düzenleme satır formundadır.
 */
export function BaremMatrisi({ matris }: { matris: Matris }) {
  if (matris.urunler.length === 0) return <p className="text-sm text-slate-500">Bu listede bugün geçerli satır yok.</p>;
  return (
    <div className="tablo-kutusu" data-barem-matrisi>
      <table className="veri-tablosu">
        <caption className="sr-only">{tabanli("Liste fiyatı", MATRAH)}</caption>
        <thead>
          <tr>
            <th>Ürün</th>
            {matris.esikler.map((e) => (
              <th key={e} className="sayi">
                {e}+
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matris.urunler.map((u) => (
            <tr key={u.id}>
              <td className="text-slate-900">
                {u.name}
                <span className="ml-1 text-xs text-slate-400">{u.code}</span>
              </td>
              {u.hucreler.map((h, i) => {
                if (!h) {
                  return (
                    <td key={matris.esikler[i]} className="sayi text-slate-400">
                      —
                    </td>
                  );
                }
                // Devralınan hücrenin kaynağı soldaki ilk devralınmamış hücrenin eşiğidir.
                const kaynak = h.devralinan ? matris.esikler[u.hucreler.slice(0, i).findLastIndex((x) => x && !x.devralinan)] : null;
                return (
                  <td
                    key={matris.esikler[i]}
                    className={h.devralinan ? "sayi text-slate-400" : "sayi"}
                    title={kaynak ? `${kaynak}+ eşiğinden` : undefined}
                    data-devralinan={h.devralinan || undefined}
                  >
                    <Tutar deger={h.fiyat} taban={MATRAH} baslikta />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-slate-500">{tabanli("Liste fiyatı", MATRAH)} · soluk hücre alt eşikten gelir.</p>
    </div>
  );
}
