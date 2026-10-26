import { donemAciklamasi } from "@/components/DonemSecici";
import { DonemSeciciIskeleti, KpiSatiriIskeleti, SayfaBasligiIskeleti, TabloIskeleti } from "@/components/Iskelet";
import { kpiAltNotu } from "@/components/kpi/KpiCard";
import { donemCoz, karsilastirmaNotu } from "@/lib/donem";

/**
 * Raporlar iskeleti: başlık, dönem seçici, KPI satırı ve iki tablo. Varsayılan dönem (içinde
 * bulunulan ay) içindir; "tüm zamanlar"da gerçek kartlarda karşılaştırma notu yoktur.
 */
export default function Loading() {
  const altNot = kpiAltNotu(undefined, karsilastirmaNotu(true));
  return (
    <div role="status">
      <span className="sr-only">Yükleniyor…</span>
      <SayfaBasligiIskeleti />
      <DonemSeciciIskeleti aciklama={donemAciklamasi(donemCoz(undefined).anahtar)} />
      <KpiSatiriIskeleti
        kartlar={[
          { etiket: "Dönem Cirosu", varyant: "birincil", para: true, degisim: true, trend: true, altNot },
          { etiket: "Dönem Hakedişi", varyant: "ikincil", para: true, degisim: true, trend: false, altNot },
          { etiket: "Dönem Tahsilatı", varyant: "ikincil", para: true, degisim: true, trend: false, altNot },
          { etiket: "Dönem İadesi", varyant: "baglamsal", para: true, degisim: true, trend: false, altNot },
        ]}
      />
      <TabloIskeleti sutun={7} satir={5} />
      <div className="mt-6">
        <TabloIskeleti sutun={4} satir={8} />
      </div>
    </div>
  );
}
