import { donemAciklamasi } from "@/components/DonemSecici";
import { DonemSeciciIskeleti, KpiSatiriIskeleti, SayfaBasligiIskeleti, TabloIskeleti } from "@/components/Iskelet";
import { kpiAltNotu } from "@/components/kpi/KpiCard";
import { donemCoz, karsilastirmaNotu } from "@/lib/donem";

/** Raporum iskeleti: başlık, dönem seçici, KPI satırı (kartlarla aynı satır ve metinler) ve tablo. */
export default function Loading() {
  const altNot = kpiAltNotu(undefined, karsilastirmaNotu(true));
  return (
    <div role="status">
      <span className="sr-only">Yükleniyor…</span>
      <SayfaBasligiIskeleti />
      <DonemSeciciIskeleti aciklama={donemAciklamasi(donemCoz(undefined).anahtar)} />
      <KpiSatiriIskeleti
        kartlar={[
          { etiket: "Cirom", varyant: "birincil", para: true, degisim: true, trend: true, altNot },
          { etiket: "Hakedişim", varyant: "ikincil", para: true, degisim: true, trend: false, altNot },
          { etiket: "Tahsilatım", varyant: "ikincil", para: true, degisim: true, trend: false, altNot },
          { etiket: "İadem", varyant: "baglamsal", para: true, degisim: true, trend: false, altNot },
        ]}
      />
      <TabloIskeleti sutun={7} satir={1} />
      {/* Doktorlarıma göre cirom kartı: yer tutucu, akış bitince sayfa yüksekliği zıplamasın. */}
      <div className="mt-6">
        <TabloIskeleti sutun={4} satir={5} />
      </div>
    </div>
  );
}
