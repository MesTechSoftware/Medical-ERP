import { KpiSatiriIskeleti, SayfaBasligiIskeleti, SuzgecCubuguIskeleti, TabloIskeleti } from "@/components/Iskelet";
import { BOS_SUZGEC, durumSekmeleri } from "@/lib/ice-aktarim-listesi/suzgec";

/** İçe aktarım iskeleti: başlık, KPI satırı (kartlarla aynı metinler), süzgeç çubuğu ve tablo. */
export default function Loading() {
  const kart = { para: false, trend: false } as const;
  return (
    <div role="status">
      <span className="sr-only">Yükleniyor…</span>
      <SayfaBasligiIskeleti />
      <KpiSatiriIskeleti
        kartlar={[
          { etiket: "Parti", varyant: "birincil", ...kart, degisim: { anlik: "şu an" } },
          { etiket: "Bu ay", varyant: "ikincil", ...kart, degisim: { anlik: "bu ay" } },
          { etiket: "Geri alınabilir", varyant: "ikincil", ...kart, degisim: { anlik: "şu an" } },
          { etiket: "Geri alındı", varyant: "ikincil", ...kart, degisim: { anlik: "şu an" } },
        ]}
      />
      <SuzgecCubuguIskeleti sekmeler={durumSekmeleri(BOS_SUZGEC).map((s) => s.etiket)} dugmeler={["Filtrele", "Sütunlar"]} />
      <TabloIskeleti />
    </div>
  );
}
