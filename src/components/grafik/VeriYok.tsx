import { BOYUT_SINIFI, type GrafikBoyutu } from "@/components/grafik/ortak";

/** Grafik alanında veri yokken aynı ölçüde yer tutucu — yerleşim kaymaz. */
export function VeriYok({ boyut }: { boyut: GrafikBoyutu }) {
  return <span className={`flex items-center text-xs text-slate-400 ${BOYUT_SINIFI[boyut]}`}>Veri yok</span>;
}
