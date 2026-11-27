import { Card } from "@/components/ui";
import { BosDurum } from "@/components/liste/BosDurum";
import { Tutar } from "@/components/Tutar";
import { formatDateTime } from "@/lib/format";
import type { SaticiTahsilatSatiri } from "@/lib/reports-service";
import { BRUT } from "@/lib/taban";

/**
 * Raporum "Dönem Tahsilatları" (D-2-5, S5): Tahsilatım KPI'ının satırları. Tutar brüttür (S9); salt okunur,
 * dosya olarak indirilemez (D-5 §(4)).
 */
export function TahsilatTablosu({ satirlar }: { satirlar: readonly SaticiTahsilatSatiri[] }) {
  return (
    <Card>
      <h2 className="mb-1 text-sm font-semibold text-slate-900">Dönem Tahsilatları</h2>
      <p className="mb-3 text-xs text-slate-500">
        Tahsilat anında portföyünüzde olan doktorların tahsilatları; sahip değişirse eski tahsilat eski sahipte kalır.
      </p>
      <div className="tablo-kutusu">
        <table className="veri-tablosu" aria-label="Dönem tahsilatları">
          <thead>
            <tr>
              <th>Tarih</th>
              <th>Doktor</th>
              <th className="oncelik-dusuk">Ödeme yöntemi</th>
              <th className="oncelik-dusuk">Referans no</th>
              <th className="sayi">Tutar</th>
            </tr>
          </thead>
          <tbody>
            {satirlar.length === 0 && <BosDurum colSpan={5} ikon="yeni" baslik="Bu dönemde tahsilat yok." />}
            {satirlar.map((t) => (
              <tr key={t.id}>
                <td className="whitespace-nowrap text-slate-500">{formatDateTime(t.paidAt)}</td>
                <td className="font-medium text-slate-900">{t.doktor}</td>
                <td className="text-slate-700 oncelik-dusuk">{t.yontem}</td>
                <td className="text-slate-500 oncelik-dusuk">{t.referansNo ?? "—"}</td>
                <td className="sayi">
                  <Tutar deger={t.tutar} taban={BRUT} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
