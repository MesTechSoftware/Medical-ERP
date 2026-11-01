import { KpiSatiriIskeleti, SayfaBasligiIskeleti, SuzgecCubuguIskeleti, TabloIskeleti } from "@/components/Iskelet";

/** Stok iskeleti: başlık, KPI satırı (kartlarla aynı metinler), formlar sütunu ve hareket geçmişi. */
export default function Loading() {
  const kart = (degisim: string) => ({ para: false, degisim: { anlik: degisim }, trend: false }) as const;
  return (
    <div role="status">
      <span className="sr-only">Yükleniyor…</span>
      <SayfaBasligiIskeleti />
      <KpiSatiriIskeleti
        kartlar={[
          { etiket: "Stoktaki ürün", varyant: "birincil", ...kart("şu an") },
          { etiket: "Kritik stok", varyant: "ikincil", ...kart("şu an") },
          { etiket: "Bugün giriş", varyant: "ikincil", ...kart("bugün") },
          { etiket: "Bugün çıkış", varyant: "ikincil", ...kart("bugün") },
        ]}
      />
      <div aria-hidden="true" className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="h-64 rounded-xl bg-slate-100 lg:col-span-1" />
        <div className="lg:col-span-2">
          <SuzgecCubuguIskeleti sekmeler={["Tümü", "Bugün", "Son 7 gün", "Bu ay"]} dugmeler={["Filtrele", "Sütunlar"]} />
          <TabloIskeleti sutun={7} />
        </div>
      </div>
    </div>
  );
}
