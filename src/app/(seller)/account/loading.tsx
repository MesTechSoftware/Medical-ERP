import { KpiSatiriIskeleti, SayfaBasligiIskeleti, TanimListesiIskeleti } from "@/components/Iskelet";
import { kpiAltNotu } from "@/components/kpi/KpiCard";
import { karsilastirmaNotu } from "@/lib/donem";

/** Hesabım iskeleti: başlık, KPI satırı (kartlarla aynı satır ve metinler), profil tanım listesi (satırlar profille aynı ızgarada). */
export default function Loading() {
  return (
    <div role="status">
      <span className="sr-only">Yükleniyor…</span>
      <SayfaBasligiIskeleti />
      <KpiSatiriIskeleti
        kartlar={[
          { etiket: "Doktorlarım", varyant: "birincil", para: false, degisim: { anlik: "şu an" }, trend: false },
          { etiket: "Bu ay siparişim", varyant: "ikincil", para: false, degisim: false, trend: false, altNot: "Bu ay · teklif hariç" },
          // Bu ay devam ediyor: karşılaştırma notu "geçen ayın aynı günlerine göre" (Raporum'un varsayılanı gibi).
          { etiket: "Bu ay cirom", varyant: "ikincil", para: true, degisim: true, trend: true, altNot: kpiAltNotu(undefined, karsilastirmaNotu(true)) },
        ]}
      />
      <TanimListesiIskeleti satir={5} etiket="cok-genis" />
    </div>
  );
}
