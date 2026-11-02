import { KpiSatiriIskeleti, SayfaBasligiIskeleti, SuzgecCubuguIskeleti, TabloIskeleti } from "@/components/Iskelet";
import { HIZLI_SEKMELER } from "@/lib/fiyat-listesi-listesi/suzgec";

/** Fiyat listeleri iskeleti: başlık, KPI satırı (kartlarla aynı metinler), süzgeç çubuğu ve tablo. */
export default function Loading() {
  const kart = { para: false, degisim: { anlik: "şu an" }, trend: false } as const;
  return (
    <div role="status">
      <span className="sr-only">Yükleniyor…</span>
      <SayfaBasligiIskeleti />
      <KpiSatiriIskeleti
        kartlar={[
          { etiket: "Toplam liste", varyant: "birincil", ...kart },
          { etiket: "Aktif liste", varyant: "ikincil", ...kart },
          { etiket: "Özel listeli cari", varyant: "ikincil", ...kart },
          { etiket: "Fiyatsız ürün", varyant: "ikincil", ...kart },
        ]}
      />
      <SuzgecCubuguIskeleti sekmeler={HIZLI_SEKMELER.map((s) => s.etiket)} dugmeler={["Sütunlar"]} />
      <TabloIskeleti />
    </div>
  );
}
