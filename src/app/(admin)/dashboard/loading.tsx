import { KpiSatiriIskeleti, SayfaBasligiIskeleti, TabloIskeleti } from "@/components/Iskelet";
import { kpiAltNotu } from "@/components/kpi/KpiCard";
import { karsilastirmaNotu } from "@/lib/donem";

/** Dashboard iskeleti: başlık, KPI satırı (kartlarla aynı satırlar ve metinler) ve iki içerik kartı. */
export default function Loading() {
  const altNot = kpiAltNotu("Bu ay", karsilastirmaNotu(true));
  return (
    <div role="status">
      <span className="sr-only">Yükleniyor…</span>
      <SayfaBasligiIskeleti />
      <KpiSatiriIskeleti
        kartlar={[
          { etiket: "Ciro", varyant: "birincil", para: true, degisim: true, trend: true, altNot },
          { etiket: "Tahsilat", varyant: "ikincil", para: true, degisim: true, trend: true, altNot },
          { etiket: "Bekleyen sipariş", varyant: "ikincil", para: false, degisim: { anlik: "şu an" }, trend: false },
          { etiket: "Kargolanacak", varyant: "baglamsal", para: false, degisim: { anlik: "şu an" }, trend: false },
        ]}
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TabloIskeleti sutun={3} satir={5} />
        <TabloIskeleti sutun={2} satir={5} />
      </div>
    </div>
  );
}
