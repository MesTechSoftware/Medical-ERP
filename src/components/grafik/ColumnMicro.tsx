import { BOYUT_SINIFI, VIEWBOX, type GrafikBoyutu } from "@/components/grafik/ortak";
import { VeriYok } from "@/components/grafik/VeriYok";
import { olcekle, type OlcekGirdisi } from "@/lib/kpi/olcek";

/**
 * Küçük sütun serisi (son 6 ay gibi zaman kategorisi). Sıfır çizgisi incedir; negatif değer onun
 * altına iner. `null` boşluktur (sütun yok). Devam eden ay açık tonlu ve kesik kenarlıdır — değer
 * henüz kesinleşmedi. Grafik ekran okuyucudan gizlidir; `ozet` görünmez metin olarak yanındadır.
 */
export function ColumnMicro({
  seri,
  ozet,
  boyut = "XS",
  sonDevamEdiyor = false,
}: {
  seri: readonly OlcekGirdisi[];
  ozet: React.ReactNode;
  boyut?: GrafikBoyutu;
  sonDevamEdiyor?: boolean;
}) {
  if (seri.every((d) => d === null)) return <VeriYok boyut={boyut} />;

  const { genislik, yukseklik, pay } = VIEWBOX;
  const { noktalar, tabanY } = olcekle(seri, { genislik, yukseklik: yukseklik - pay });
  const adim = genislik / seri.length;
  const sonIndis = seri.length - 1;

  return (
    // Kök konumlu: mutlak konumlu sr-only özet kaydırma kutusunun (.tablo-kutusu) kırpmasından kaçmasın.
    <span className={`relative block ${BOYUT_SINIFI[boyut]}`}>
      <svg
        viewBox={`0 0 ${genislik} ${yukseklik}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        className="block h-full w-full"
      >
        <path
          d={`M0 ${tabanY + pay}H${genislik}`}
          className="stroke-slate-200"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
        {noktalar.map((n, i) => {
          if (!n) return null;
          const ust = Math.min(n.y, tabanY) + pay;
          const boy = Math.abs(n.y - tabanY);
          const devam = sonDevamEdiyor && i === sonIndis;
          return (
            <rect
              key={i}
              x={i * adim + adim * 0.15}
              y={ust}
              width={adim * 0.7}
              height={boy}
              className={devam ? "fill-slate-200 stroke-slate-400" : "fill-slate-400"}
              strokeDasharray={devam ? "2 2" : undefined}
              strokeWidth={devam ? 1 : undefined}
              vectorEffect={devam ? "non-scaling-stroke" : undefined}
              data-devam-ediyor={devam ? "" : undefined}
            />
          );
        })}
      </svg>
      <span className="sr-only">{ozet}</span>
    </span>
  );
}
