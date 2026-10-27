import {
  DashboardBloklariIskeleti,
  KpiSatiriIskeleti,
  SayfaBasligiIskeleti,
  SayfaSeridiIskeleti,
  ZamanFiltresiIskeleti,
} from "@/components/Iskelet";
import { kpiAltNotu } from "@/components/kpi/KpiCard";
import { dashboardAraligi } from "@/lib/donem";

/**
 * Dashboard iskeleti: başlık, telefonda filtre, KPI satırı (kartlarla aynı satırlar ve metinler),
 * bloklar ve sayfa şeridi. Notlar varsayılan aralığın ("bu ay") metinleridir.
 */
export default function Loading() {
  const r = dashboardAraligi("ay");
  const altNot = kpiAltNotu(r.donemNotu, r.karsilastirmaNotu);
  return (
    <div role="status">
      <span className="sr-only">Yükleniyor…</span>
      <SayfaBasligiIskeleti />
      <ZamanFiltresiIskeleti />
      <KpiSatiriIskeleti
        kartlar={[
          { etiket: "Ciro", varyant: "birincil", para: true, degisim: true, trend: true, altNot },
          { etiket: "Tahsilat", varyant: "ikincil", para: true, degisim: true, trend: true, altNot },
          {
            etiket: "Bekleyen sipariş",
            varyant: "ikincil",
            para: false,
            degisim: { anlik: "şu an" },
            trend: false,
            ikincilMetrik: "Medyan hazırlama (bu ay): 0,0 gün",
          },
          { etiket: "Kargolanacak", varyant: "baglamsal", para: false, degisim: { anlik: "şu an" }, trend: false },
        ]}
      />
      <DashboardBloklariIskeleti />
      <SayfaSeridiIskeleti />
    </div>
  );
}
