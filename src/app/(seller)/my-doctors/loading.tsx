import { KpiSatiriIskeleti, SayfaBasligiIskeleti, SuzgecCubuguIskeleti, TabloIskeleti } from "@/components/Iskelet";
import { SATICI_KARTLARI, SATICI_SEKMELERI } from "@/lib/doktor-listesi/suzgec";

/** Doktorlarım iskeleti: başlık, KPI satırı (kartlarla aynı metinler), süzgeç çubuğu, tablo. */
export default function Loading() {
  const kart = { para: false, degisim: false, trend: false } as const;
  return (
    <div role="status">
      <span className="sr-only">Yükleniyor…</span>
      <SayfaBasligiIskeleti />
      <KpiSatiriIskeleti
        kartlar={SATICI_KARTLARI.map((k, i) => ({ etiket: k.etiket, varyant: i === 0 ? ("birincil" as const) : ("ikincil" as const), ...kart, degisim: { anlik: "şu an" } }))}
      />
      <SuzgecCubuguIskeleti sekmeler={SATICI_SEKMELERI.map((s) => s.etiket)} dugmeler={["Filtrele", "Sütunlar"]} />
      <TabloIskeleti />
    </div>
  );
}
