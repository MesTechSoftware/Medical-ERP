import { BOYUT_SINIFI, VIEWBOX, type GrafikBoyutu } from "@/components/grafik/ortak";
import { VeriYok } from "@/components/grafik/VeriYok";
import { olcekle, type Nokta, type OlcekGirdisi } from "@/lib/kpi/olcek";

/**
 * Trend çizgisi: eksen yok. `null` boşluktur — çizgi kesilir, araya nokta uydurulmaz. Son nokta
 * vurguludur; devam eden ayda içi boştur (değer henüz kesinleşmedi). İkiden az nokta varsa
 * çizilmez, aynı ölçüde "Veri yok" görünür. Grafik ekran okuyucudan gizlidir; `ozet` görünmez
 * metin olarak yanındadır (tutarlar `<Tutar>` ile verilir).
 */
export function Sparkline({
  seri,
  ozet,
  boyut = "S",
  sonDevamEdiyor = false,
}: {
  seri: readonly OlcekGirdisi[];
  ozet: React.ReactNode;
  boyut?: GrafikBoyutu;
  sonDevamEdiyor?: boolean;
}) {
  if (seri.filter((d) => d !== null).length < 2) return <VeriYok boyut={boyut} />;

  const { genislik, yukseklik, pay } = VIEWBOX;
  const noktalar = olcekle(seri, { genislik, yukseklik: yukseklik - 2 * pay }).noktalar.map((n) =>
    n ? { x: n.x, y: n.y + pay } : null
  );
  const parcalar: Nokta[][] = [[]];
  for (const n of noktalar) {
    if (n) parcalar[parcalar.length - 1].push(n);
    else if (parcalar[parcalar.length - 1].length > 0) parcalar.push([]);
  }
  // Tek noktalık parça sıfır uzunluklu yuvarlak uçlu çizgiyle nokta olarak görünür.
  const yol = (p: Nokta[]) => p.map((n, i) => `${i === 0 ? "M" : "L"}${n.x} ${n.y}`).join("") + (p.length === 1 ? "h0" : "");
  const son = noktalar.filter((n): n is Nokta => n !== null).at(-1)!;

  return (
    // Kök konumlu: mutlak konumlu sr-only özet kaydırma kutusunun (.tablo-kutusu) kırpmasından kaçmasın.
    <span className={`relative block ${BOYUT_SINIFI[boyut]}`}>
      <svg
        viewBox={`0 0 ${genislik} ${yukseklik}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        className="block h-full w-full overflow-visible"
      >
        {parcalar
          .filter((p) => p.length > 0)
          .map((p, i) => (
            <path
              key={i}
              d={yol(p)}
              fill="none"
              className="stroke-slate-400"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        <path
          d={`M${son.x} ${son.y}h0`}
          className="stroke-brand"
          strokeWidth={6}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {sonDevamEdiyor && (
          <path
            data-devam-ediyor=""
            d={`M${son.x} ${son.y}h0`}
            className="stroke-white"
            strokeWidth={3}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
      <span className="sr-only">{ozet}</span>
    </span>
  );
}
