import { Card } from "@/components/ui";
import { BOYUT_SINIFI, type GrafikBoyutu } from "@/components/grafik/ortak";
import { KPI_YERLESIMI } from "@/components/kpi/KpiSatiri";
import { DEGER_BOYU, DEGER_SATIRI, type KpiVaryanti } from "@/components/kpi/KpiCard";

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

/** KPI kartının iskelette taşıdığı yapı — gerçek kartla aynı satırlar ve aynı metinler. */
export type KpiIskeletYapisi = {
  etiket: string;
  varyant: KpiVaryanti;
  /** Para KPI'sı: değerin altında taban satırı var. */
  para: boolean;
  /** Değişim satırı ("▲ %12,4") ya da anlık not (karttaki metin). */
  degisim: boolean | { anlik: string };
  trend: boolean;
  /** Alt satır: `kpiAltNotu()` ile kurulur, karttaki metnin aynısıdır. */
  altNot?: string;
};

/**
 * Metnin kendisi kadar yer kaplayan çubuk: satır kırılımı ve yüksekliği gerçek metinle aynı. Metin
 * DOM'a değil CSS içeriğine yazılır — akış sırasında gerçek sayfayla yan yana dururken metin
 * seçicilerine (getByText) ve kopyalamaya karışmaz.
 */
function MetinCubugu({ children }: { children: string }) {
  return (
    <span
      data-metin={children}
      className="animate-skeleton rounded bg-slate-100 text-transparent box-decoration-clone before:content-[attr(data-metin)]"
    />
  );
}

/** Satır içi çubuk: içinde bulunduğu satırın yüksekliğini değiştirmez (satır kutusu yazı boyundan). */
function SatirCubugu({ className }: { className: string }) {
  return <span className={`inline-block animate-skeleton rounded bg-slate-100 ${className}`} />;
}

/**
 * KPI satırı iskeleti: `KpiSatiri` ile aynı grid (aynı container eşikleri), her kart `KpiCard` ile
 * aynı satırlar ve sınıflar. Uzunluğu değişebilen metinler (etiket, anlık not, alt not) aynı metinle
 * saydam yazılır, kırılımı gerçekle aynıdır; değer tek satırdır ve taban etiketi kendi satırındadır.
 * Kartlar veriye bakmadan birebir eşleşir (e2e kart kart ölçer).
 */
export function KpiSatiriIskeleti({ kartlar }: { kartlar: readonly KpiIskeletYapisi[] }) {
  const yer = KPI_YERLESIMI[kartlar.length as 1 | 2 | 3 | 4];
  return (
    <div aria-hidden="true" className="@container mb-6">
      <div data-kpi-satiri={kartlar.length} className={`grid gap-4 ${yer.kap}`}>
        {kartlar.map((k, i) => (
          <div key={i} className={`min-w-0 ${i === 0 ? yer.birincil : ""}`}>
            <div className="@container flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-medium uppercase">
                <MetinCubugu>{k.etiket}</MetinCubugu>
              </div>
              <div className={`${DEGER_SATIRI} ${DEGER_BOYU[k.varyant]}`}>
                <SatirCubugu className="h-[0.8em] w-[5.5em] max-w-full" />
                {k.para && (
                  <span className="block text-xs">
                    <SatirCubugu className="h-2.5 w-14" />
                  </span>
                )}
              </div>
              {k.degisim && (
                <p className="mt-1 text-xs">
                  <MetinCubugu>{typeof k.degisim === "object" ? k.degisim.anlik : "▲ %00,0"}</MetinCubugu>
                </p>
              )}
              {k.trend && (
                <div className="mt-3">
                  <GrafikIskeleti boyut="S" />
                </div>
              )}
              {k.altNot && (
                <p className="mt-auto pt-2 text-xs">
                  <MetinCubugu>{k.altNot}</MetinCubugu>
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
