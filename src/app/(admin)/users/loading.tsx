import { KpiSatiriIskeleti, SayfaBasligiIskeleti, SuzgecCubuguIskeleti, TabloIskeleti } from "@/components/Iskelet";
import { hizliSekmeler } from "@/lib/kullanici-listesi/suzgec";

/** Kullanıcılar iskeleti: başlık, KPI satırı (yönetici kartlarıyla aynı metinler), süzgeç çubuğu ve tablo. */
export default function Loading() {
  const kart = { para: false, degisim: { anlik: "şu an" }, trend: false } as const;
  return (
    <div role="status">
      <span className="sr-only">Yükleniyor…</span>
      <SayfaBasligiIskeleti />
      <KpiSatiriIskeleti
        kartlar={[
          { etiket: "Aktif kullanıcı", varyant: "birincil", ...kart },
          { etiket: "Aktif satıcı", varyant: "ikincil", ...kart },
          { etiket: "Portföysüz aktif satıcı", varyant: "ikincil", ...kart },
          { etiket: "İlk girişi bekleyen", varyant: "ikincil", ...kart },
        ]}
      />
      <SuzgecCubuguIskeleti sekmeler={hizliSekmeler("YONETICI").map((s) => s.etiket)} dugmeler={["Sütunlar"]} />
      <TabloIskeleti />
    </div>
  );
}
