import { SayfaBasligiIskeleti, SuzgecCubuguIskeleti, TabloIskeleti } from "@/components/Iskelet";
import { BOS_SUZGEC, hizliSekmeler } from "@/lib/siparis-listesi/suzgec";

/** Siparişler iskeleti: başlık, süzgeç çubuğu, tablo. */
export default function Loading() {
  return (
    <div role="status">
      <span className="sr-only">Yükleniyor…</span>
      <SayfaBasligiIskeleti />
      <SuzgecCubuguIskeleti sekmeler={hizliSekmeler(BOS_SUZGEC).map((s) => s.etiket)} dugmeler={["Filtrele", "Sütunlar"]} />
      <TabloIskeleti />
    </div>
  );
}
