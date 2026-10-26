import { Card } from "@/components/ui";
import { BOYUT_SINIFI, type GrafikBoyutu } from "@/components/grafik/ortak";

/*
 * Yükleme iskeletleri (ADR-009). Ölçü tahmin edilmez: gerçek bileşenlerin sınıfları ve token'ları
 * kullanılır (PageHeader ölçüsü, Card > .tablo-kutusu > .veri-tablosu, --row-h), böylece içerik
 * gelince yerleşim kaymaz. Ton en açık gri; nabız yavaş (1,6 sn) ve hafif; azaltılmış harekette durur.
 */

function Cubuk({ className }: { className: string }) {
  return <span aria-hidden="true" className={`block animate-skeleton rounded bg-slate-100 ${className}`} />;
}

/** PageHeader ile aynı ölçü: mb-6, başlık satırı 28 px (text-xl), açıklama mt-1 + 20 px (text-sm). */
export function SayfaBasligiIskeleti() {
  return (
    <div className="mb-6">
      <div className="flex h-7 items-center">
        <Cubuk className="h-5 w-48" />
      </div>
      <div className="mt-1 flex h-5 items-center">
        <Cubuk className="h-3.5 w-72 max-w-full" />
      </div>
    </div>
  );
}

/** Tablo kartı: başlık ve satır yüksekliği gerçek tablodaki gibi --row-h'den; telefonda gizlenen sütun aynı sınıfla. */
export function TabloIskeleti({ sutun = 5, satir = 8 }: { sutun?: number; satir?: number }) {
  const sutunlar = Array.from({ length: sutun }, (_, i) => i);
  const sinif = (i: number) => (i >= 3 ? "oncelik-dusuk" : undefined);
  return (
    <Card>
      <div className="tablo-kutusu">
        <table className="veri-tablosu">
          <thead>
            <tr>
              {sutunlar.map((i) => (
                <th key={i} className={sinif(i)}>
                  <Cubuk className="h-3 w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: satir }, (_, r) => (
              <tr key={r}>
                {sutunlar.map((i) => (
                  <td key={i} className={sinif(i)}>
                    <Cubuk className="h-3.5 w-24" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/** Liste sayfası iskeleti: bölgesel (kabuk yerinde kalır), tek konteyner, tek "Yükleniyor" duyurusu. */
export function SayfaIskeleti() {
  return (
    <div role="status">
      <span className="sr-only">Yükleniyor…</span>
      <SayfaBasligiIskeleti />
      <TabloIskeleti />
    </div>
  );
}

/** Mikro grafik iskeleti: grafikle aynı ölçü (`BOYUT_SINIFI`). */
export function GrafikIskeleti({ boyut }: { boyut: GrafikBoyutu }) {
  return <span aria-hidden="true" className={`block animate-skeleton rounded bg-slate-100 ${BOYUT_SINIFI[boyut]}`} />;
}
