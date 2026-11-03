import { KpiSatiriIskeleti, SayfaBasligiIskeleti, SuzgecCubuguIskeleti, TabloIskeleti } from "@/components/Iskelet";
import { formatSayi } from "@/lib/format";

/** Kargo iskeleti: başlık, KPI satırı (kartlarla aynı metinler), bekleyenler ve sevkiyat tabloları. */
export default function Loading() {
  const kart = { para: false, trend: false } as const;
  return (
    <div role="status">
      <span className="sr-only">Yükleniyor…</span>
      <SayfaBasligiIskeleti />
      <KpiSatiriIskeleti
        kartlar={[
          { etiket: "Kargo bekleyen", varyant: "birincil", ...kart, degisim: { anlik: "şu an" }, ikincilMetrik: `${formatSayi(0)} adet kalan` },
          { etiket: "Onay bekleyen", varyant: "ikincil", ...kart, degisim: { anlik: "şu an" } },
          { etiket: "Bugün kargolanan", varyant: "ikincil", ...kart, degisim: { anlik: "bugün" } },
          { etiket: "Teslim bekleyen", varyant: "ikincil", ...kart, degisim: { anlik: "şu an" } },
        ]}
      />
      <TabloIskeleti />
      <SuzgecCubuguIskeleti sekmeler={["Tümü", "Bugün", "Son 7 gün", "Bu ay"]} dugmeler={["Filtrele", "Sütunlar"]} />
      <TabloIskeleti />
    </div>
  );
}
