import { KpiSatiriIskeleti, SayfaBasligiIskeleti, SuzgecCubuguIskeleti, TabloIskeleti } from "@/components/Iskelet";
import { BOS_SUZGEC, durumSekmeleri } from "@/lib/onay-listesi/suzgec";

/** Onay iskeleti: başlık, KPI satırı (kartlarla aynı metinler), süzgeç çubuğu ve tablo. */
export default function Loading() {
  const kart = { para: false, trend: false } as const;
  return (
    <div role="status">
      <span className="sr-only">Yükleniyor…</span>
      <SayfaBasligiIskeleti />
      <KpiSatiriIskeleti
        kartlar={[
          { etiket: "Onay bekleyen", varyant: "birincil", ...kart, degisim: { anlik: "şu an" }, ikincilMetrik: "en eskisi 00 sa önce" },
          { etiket: "24 saatten eski", varyant: "ikincil", ...kart, degisim: { anlik: "şu an" } },
          { etiket: "Bugün onaylanan", varyant: "ikincil", ...kart, degisim: { anlik: "bugün" } },
          { etiket: "Bugün reddedilen", varyant: "ikincil", ...kart, degisim: { anlik: "bugün" } },
        ]}
      />
      <SuzgecCubuguIskeleti sekmeler={durumSekmeleri(BOS_SUZGEC).map((s) => s.etiket)} dugmeler={["Filtrele", "Sütunlar"]} />
      <TabloIskeleti />
    </div>
  );
}
