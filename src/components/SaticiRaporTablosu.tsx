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
    <div className="tablo-kutusu">
      <table className="veri-tablosu">
        <thead>
          <tr>
            <th>Satıcı</th>
            <th className="sayi">{tabanli("Ciro", MATRAH)}</th>
            <th className="sayi">{tabanli("Hakediş", MATRAH)}</th>
            <th className="sayi">{tabanli("Tahsilat", BRUT)}</th>
            <th className="sayi oncelik-dusuk">Ort. İskonto</th>
            <th className="sayi oncelik-dusuk">Doktor</th>
          </tr>
        </thead>
        <tbody>
          {satirlar.length === 0 && <EmptyRow colSpan={6} text="Satıcı yok." />}
          {satirlar.map((s) => (
            <tr key={s.sellerId}>
              <td className="font-medium text-slate-900">{s.name}</td>
              <td className="sayi"><Tutar deger={s.ciro} taban={MATRAH} baslikta /></td>
              <td className="sayi"><Tutar deger={s.hakedis} taban={MATRAH} baslikta /></td>
              <td className="sayi"><Tutar deger={s.tahsilat} taban={BRUT} baslikta /></td>
              <td className="sayi text-slate-500 oncelik-dusuk">
                {formatla(s.ortalamaIskonto, "oran")}
              </td>
              <td className="sayi oncelik-dusuk">{s.doktorSayisi}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
