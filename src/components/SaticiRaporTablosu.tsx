import Link from "next/link";
import { formatla } from "@/lib/money";
import { Tutar } from "@/components/Tutar";
import { BRUT, MATRAH, tabanli } from "@/lib/taban";
import type { SellerReport } from "@/lib/reports-service";
import { EmptyRow } from "@/components/ui";
import { ColumnMicro } from "@/components/grafik/ColumnMicro";
import { KovaOzeti } from "@/components/kpi/KovaOzeti";
import type { Ay } from "@/lib/donem";
import type Decimal from "decimal.js";
import { BAGLANTI } from "@/components/stil";

/**
 * Satıcı raporu tablosu (X-1 §(1)): üç mutlak sayı, tabanı başlıkta yazılı; oran yok.
 * Hakediş sevkiyat satırına donmuş oranla hesaplanır (X-14); "ödenebilir prim" değildir (X-1 §(7)).
 */
export default function SaticiRaporTablosu({
  satirlar,
  seriler,
  saticiBaglantisi,
}: {
  satirlar: SellerReport[];
  /** Verilirse satıcı adı bu adrese bağlantıdır (Raporlar: o satıcının carileri, Ü-27). */
  saticiBaglantisi?: (saticiId: string) => string;
  /** Satıcı başına son 6 ay cirosu (matrah) — "Son 6 ay" hücresi; verilmezse kolon yok. */
  seriler?: { aylar: readonly Ay[]; degerler: Map<string, Decimal[]> };
}) {
  const kolon = seriler ? 1 : 0;
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
            {seriler && <th className="oncelik-dusuk">Son 6 ay</th>}
          </tr>
        </thead>
        <tbody>
          {satirlar.length === 0 && <EmptyRow colSpan={6 + kolon} text="Satıcı yok." />}
          {satirlar.map((s) => (
            <tr key={s.sellerId}>
              <td className="font-medium text-slate-900">
                {saticiBaglantisi ? (
                  <Link href={saticiBaglantisi(s.sellerId)} scroll={false} className={BAGLANTI}>
                    {s.name}
                  </Link>
                ) : (
                  s.name
                )}
              </td>
              <td className="sayi"><Tutar deger={s.ciro} taban={MATRAH} baslikta /></td>
              <td className="sayi"><Tutar deger={s.hakedis} taban={MATRAH} baslikta /></td>
              <td className="sayi"><Tutar deger={s.tahsilat} taban={BRUT} baslikta /></td>
              <td className="sayi text-slate-500 oncelik-dusuk">
                {formatla(s.ortalamaIskonto, "oran")}
              </td>
              <td className="sayi oncelik-dusuk">{s.doktorSayisi}</td>
              {seriler && (
                <td className="oncelik-dusuk">
                  <ColumnMicro
                    seri={seriler.degerler.get(s.sellerId) ?? []}
                    sonDevamEdiyor={seriler.aylar[seriler.aylar.length - 1]?.devamEdiyor ?? false}
                    ozet={
                      <KovaOzeti
                        baslik={`${s.name} son 6 ay ciro`}
                        kovalar={seriler.aylar} tur="ay"
                        seri={seriler.degerler.get(s.sellerId) ?? []}
                        taban={MATRAH}
                      />
                    }
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
