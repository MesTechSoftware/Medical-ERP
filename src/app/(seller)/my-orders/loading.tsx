import { KpiSatiriIskeleti, SayfaBasligiIskeleti, SuzgecCubuguIskeleti, TabloIskeleti } from "@/components/Iskelet";
import { SATICI_DURUM_KARTLARI } from "@/components/siparis/KpiKartlari";
import { BOS_SUZGEC, hizliSekmeler } from "@/lib/siparis-listesi/suzgec";

/** Siparişlerim iskeleti: başlık, KPI satırı (kartlarla aynı metinler, varsayılan aralık), süzgeç çubuğu, tablo. */
export default function Loading() {
  const kart = { para: false, degisim: false, trend: false } as const;
  return (
    <div role="status">
      <span className="sr-only">Yükleniyor…</span>
      <SayfaBasligiIskeleti />
      <KpiSatiriIskeleti
        kartlar={[
          { etiket: "Toplam sipariş", varyant: "birincil", ...kart, altNot: "Bu ay · teklif hariç" },
          ...SATICI_DURUM_KARTLARI.map((d) => ({ etiket: d.etiket, varyant: "ikincil" as const, ...kart, altNot: "Bu ay" })),
        ]}
      />
      <SuzgecCubuguIskeleti sekmeler={hizliSekmeler(BOS_SUZGEC, "/my-orders").map((s) => s.etiket)} dugmeler={["Filtrele", "Sütunlar"]} />
      <TabloIskeleti />
    </div>
  );
}
