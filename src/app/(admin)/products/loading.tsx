import { KpiSatiriIskeleti, SayfaBasligiIskeleti, SuzgecCubuguIskeleti, TabloIskeleti } from "@/components/Iskelet";
import { HIZLI_SEKMELER } from "@/lib/urun-listesi/suzgec";

/** Ürünler iskeleti: başlık, KPI satırı (kartlarla aynı metinler), süzgeç çubuğu ve tablo. */
export default function Loading() {
  const kart = { para: false, degisim: { anlik: "şu an" }, trend: false } as const;
  return (
    <div role="status">
      <span className="sr-only">Yükleniyor…</span>
      <SayfaBasligiIskeleti />
      <KpiSatiriIskeleti
        kartlar={[
          { etiket: "Toplam ürün", varyant: "birincil", ...kart },
          { etiket: "Aktif", varyant: "ikincil", ...kart },
          { etiket: "Kritik stok", varyant: "ikincil", ...kart },
          { etiket: "Pasif", varyant: "ikincil", ...kart },
        ]}
      />
      <SuzgecCubuguIskeleti sekmeler={HIZLI_SEKMELER.map((s) => s.etiket)} dugmeler={["Sütunlar"]} arama />
      <TabloIskeleti />
    </div>
  );
}
