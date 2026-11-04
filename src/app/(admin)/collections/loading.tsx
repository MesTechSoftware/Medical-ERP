import { KpiSatiriIskeleti, SayfaBasligiIskeleti, SuzgecCubuguIskeleti, TabloIskeleti } from "@/components/Iskelet";
import { hizliSekmeler } from "@/lib/tahsilat-listesi/suzgec";
import { KARTLAR, adetMetni } from "./KpiKartlari";

/** Tahsilat iskeleti: başlık, KPI satırı (kartlarla aynı metinler, varsayılan aralık), süzgeç çubuğu, tablo. */
export default function Loading() {
  const kart = { para: true, degisim: false, trend: false, altNot: "Bu ay" } as const;
  return (
    <div role="status">
      <span className="sr-only">Yükleniyor…</span>
      <SayfaBasligiIskeleti />
      <KpiSatiriIskeleti
        kartlar={KARTLAR.map(({ tip, etiket }) => ({
          etiket,
          varyant: tip ? ("ikincil" as const) : ("birincil" as const),
          ...kart,
          ikincilMetrik: adetMetni(0),
        }))}
      />
      <SuzgecCubuguIskeleti sekmeler={hizliSekmeler("2026-01-01").map((s) => s.etiket)} dugmeler={["Filtrele", "Sütunlar"]} />
      <TabloIskeleti />
    </div>
  );
}
