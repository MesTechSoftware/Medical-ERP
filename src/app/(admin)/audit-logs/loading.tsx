import { KpiSatiriIskeleti, SayfaBasligiIskeleti, SuzgecCubuguIskeleti, TabloIskeleti } from "@/components/Iskelet";
import { hizliSekmeler } from "@/lib/denetim/suzgec";

/** Denetim iskeleti: başlık, KPI satırı (kartlarla aynı metinler), süzgeç çubuğu ve tablo. */
export default function Loading() {
  const kart = { para: false, trend: false } as const;
  return (
    <div role="status">
      <span className="sr-only">Yükleniyor…</span>
      <SayfaBasligiIskeleti />
      <KpiSatiriIskeleti
        kartlar={[
          { etiket: "Bugün işlem", varyant: "birincil", ...kart, degisim: { anlik: "bugün" } },
          { etiket: "Son 7 gün işlem", varyant: "ikincil", ...kart, degisim: { anlik: "son 7 gün" } },
          { etiket: "Bugün başarısız giriş", varyant: "ikincil", ...kart, degisim: { anlik: "bugün" } },
          { etiket: "Bugün silme", varyant: "ikincil", ...kart, degisim: { anlik: "bugün" } },
        ]}
      />
      <SuzgecCubuguIskeleti sekmeler={hizliSekmeler("2026-01-01").map((s) => s.etiket)} dugmeler={["Filtrele", "Sütunlar"]} />
      <TabloIskeleti />
    </div>
  );
}
