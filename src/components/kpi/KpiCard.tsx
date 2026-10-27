import { Sparkline } from "@/components/grafik/Sparkline";
import { Tutar } from "@/components/Tutar";
import { formatSayi } from "@/lib/format";
import { degisimYuzdesi, yon, type OlcekGirdisi, type Yon } from "@/lib/kpi/olcek";
import { formatla, type ParaDegeri } from "@/lib/money";
import type { Taban } from "@/lib/taban";

/**
 * KPI kartı (ADR-010; brief §3.1): etiket → büyük değer → değişim (▲/▼ + yüzde) → ikincil metrik → trend → alt not
 * (dönem ve karşılaştırma tabanı: "Bu ay · geçen ayın aynı günlerine göre"). Her KPI "iyi yön" ve
 * "boş davranışı" bildirir; kötü yön uyarı tonundadır (hata değil — kötü trend bir hata değildir).
 * Renk tek başına bilgi taşımaz: ok, yönün adı (ekran okuyucuya), yüzde ve karşılaştırma notu
 * yazılıdır. Para değeri yalnız `<Tutar>` ile; taban etiketi değerin altında kendi satırındadır.
 *
 * Ölçü kartın kendi genişliğinden gelir (`@container`): değer tek satırdır, kart daraldıkça küçülür,
 * kesilmez ve taşmaz. Satır yükseklikleri veriye bağlı değildir — iskelet (`KpiSatiriIskeleti`) aynı
 * sınıf ve metinlerle birebir eşleşir.
 */

export type IyiYon = "yukari-iyi" | "asagi-iyi" | "notr";
export type BosDavranisi = "sifir" | "veri-yok";
export type KpiVaryanti = "birincil" | "ikincil" | "baglamsal";

type Ortak = {
  etiket: string;
  varyant: KpiVaryanti;
  iyiYon: IyiYon;
  /** Kaynak kayıt yokken: "sifir" gerçek sıfırdır (sayım, ciro); "veri-yok" sıfır anlamsızdır. */
  bosDavranisi: BosDavranisi;
  /**
   * Dönem karşılaştırması — önceki dönemin değeri; `not` ("geçen ayın aynı günlerine göre") alt
   * satıra yazılır — ya da anlık sayı notu ("şu an"), değişim satırının yerinde.
   */
  karsilastirma?: { onceki: OlcekGirdisi; not: string } | { anlik: string };
  trend?: { seri: readonly OlcekGirdisi[]; sonDevamEdiyor: boolean; ozet: React.ReactNode };
  /** Değerin dönemi ("Bu ay"): alt satırda, karşılaştırma notunun önünde. */
  donemNotu?: string;
  /** Tek ikincil metrik ("Medyan hazırlama süresi: 1,4 gün"): değerin altında küçük, nötr satır. */
  ikincilMetrik?: string;
  /** Değerin kendisi bir uyarıysa (ör. bekleyen iş > 0). */
  vurgu?: "uyari";
  /**
   * Sorgu hata verdiyse yalnız bu kart düşer (X-3): sabit metin + log satırıyla aynı referans.
   * Hata gövdesi hiçbir koşulda gösterilmez (X-3 §(2)).
   */
  hataReferansi?: string;
};

export type KpiCardProps =
  | (Ortak & { tutar: ParaDegeri | null; taban: Taban; adet?: never })
  | (Ortak & { adet: number | null; tutar?: never; taban?: never });

/**
 * Değer satırı (iskeletle ortak). Yazı boyu kart içeriğinin %13'ü, varyantın üst sınırına dek:
 * ₺99.999.999,99 yaklaşık 7,5 em tutar, %13 ile en dar kartta da tek satıra sığar.
 */
export const DEGER_SATIRI = "mt-1 whitespace-nowrap font-semibold tabular-nums [line-height:1.25]";
export const DEGER_BOYU: Record<KpiVaryanti, string> = {
  birincil: "[font-size:clamp(1.25rem,13cqi,1.875rem)]",
  ikincil: "[font-size:clamp(0.875rem,13cqi,1.5rem)]",
  baglamsal: "[font-size:clamp(0.875rem,13cqi,1.25rem)]",
};

/** Kartın alt satırı: dönem ve karşılaştırma tabanı. İskelet aynı metni bununla kurar. */
export function kpiAltNotu(donemNotu?: string, karsilastirmaNotu?: string): string {
  return [donemNotu, karsilastirmaNotu].filter(Boolean).join(" · ");
}

/** Yön ve iyi yöne göre ton: iyi → olumlu, kötü → uyarı, eşit ya da nötr KPI → nötr. */
export function degisimTonu(y: Yon, iyiYon: IyiYon): "olumlu" | "uyari" | "notr" {
  if (y === "esit" || iyiYon === "notr") return "notr";
  const iyi = (y === "artis") === (iyiYon === "yukari-iyi");
  return iyi ? "olumlu" : "uyari";
}

const TON_SINIFI = { olumlu: "text-positive", uyari: "text-critical", notr: "text-slate-500" } as const;
const OK = { artis: "▲", azalis: "▼", esit: "■" } as const;
const YON_ADI = { artis: "artış", azalis: "azalış", esit: "değişim yok" } as const;

function Degisim({ y, simdi, onceki, iyiYon }: { y: Yon; simdi: OlcekGirdisi; onceki: OlcekGirdisi; iyiYon: IyiYon }) {
  const d = degisimYuzdesi(simdi, onceki);
  const metin = d.tur === "yuzde" ? formatla(Math.abs(d.deger), "oran") : d.tur === "yeni" ? "yeni" : "";
  return (
    <p className={`mt-1 whitespace-nowrap text-xs font-medium ${TON_SINIFI[degisimTonu(y, iyiYon)]}`} data-yon={y}>
      <span aria-hidden="true">{OK[y]}</span>
      <span className="sr-only">{YON_ADI[y]}</span> {metin}
    </p>
  );
}

export function KpiCard(props: KpiCardProps) {
  const { etiket, varyant, iyiYon, bosDavranisi, karsilastirma, trend, donemNotu, ikincilMetrik, vurgu, hataReferansi } = props;
  const paraMi = props.tutar !== undefined;
  const ham = paraMi ? props.tutar : props.adet;
  // "sifir": kayıt yoksa gerçek değer sıfırdır; "veri-yok": sıfır anlamsızdır, "Veri yok" yazılır.
  const deger = ham ?? (bosDavranisi === "sifir" ? (paraMi ? "0" : 0) : null);
  const kiyas = karsilastirma && "onceki" in karsilastirma ? karsilastirma : null;
  const y = !hataReferansi && deger !== null && kiyas ? yon(deger, kiyas.onceki) : null;
  // Karşılaştırma notu yalnız değişim satırı varken yazılır.
  const altNot = kpiAltNotu(donemNotu, y !== null ? kiyas?.not : undefined);

  return (
    <div
      role="group"
      aria-label={etiket}
      className="@container flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="text-xs font-medium uppercase text-slate-500">{etiket}</div>
      {hataReferansi ? (
        <div className="mt-1">
          <p className="text-sm font-medium text-negative">Yüklenemedi</p>
          <p className="text-xs text-slate-500">
            Hata referansı: <span className="font-mono">{hataReferansi}</span>
          </p>
        </div>
      ) : deger === null ? (
        <p className="mt-1 text-sm text-slate-400">Veri yok</p>
      ) : (
        <>
          {/* Taban etiketi (<Tutar>'ın data-taban'ı) değerin altında kendi satırında. */}
          <div
            className={`${DEGER_SATIRI} ${DEGER_BOYU[varyant]} ${vurgu === "uyari" ? "text-critical" : "text-slate-900"} [&_[data-taban]]:ml-0 [&_[data-taban]]:block`}
          >
            {paraMi ? <Tutar deger={deger} taban={props.taban} /> : formatSayi(deger as number)}
          </div>
          {y !== null && kiyas && <Degisim y={y} simdi={deger} onceki={kiyas.onceki} iyiYon={iyiYon} />}
          {karsilastirma && "anlik" in karsilastirma && (
            <p className="mt-1 text-xs text-slate-500">{karsilastirma.anlik}</p>
          )}
          {ikincilMetrik && <p className="mt-1 text-xs text-slate-500">{ikincilMetrik}</p>}
          {trend && (
            <div className="mt-3">
              <Sparkline seri={trend.seri} sonDevamEdiyor={trend.sonDevamEdiyor} ozet={trend.ozet} />
            </div>
          )}
        </>
      )}
      {altNot && <p className="mt-auto pt-2 text-xs text-slate-400">{altNot}</p>}
    </div>
  );
}
