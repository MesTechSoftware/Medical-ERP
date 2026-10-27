import { Tutar } from "@/components/Tutar";
import type { Kova, KovaTuru } from "@/lib/donem";
import { kovaEtiketi } from "@/lib/format";
import type { ParaDegeri } from "@/lib/money";
import type { Taban } from "@/lib/taban";

/**
 * Mikro grafiğin ekran okuyucu özeti (grafik `aria-hidden`): kova kova (gün, hafta ya da ay) değer;
 * tutar `<Tutar>` ile, tabanı yazılı. Görünmez metin olarak grafiğin yanına konur.
 */
export function KovaOzeti({
  baslik,
  kovalar,
  tur,
  seri,
  taban,
}: {
  baslik: string;
  kovalar: readonly Kova[];
  tur: KovaTuru;
  seri: readonly (ParaDegeri | null)[];
  taban: Taban;
}) {
  return (
    <>
      {baslik}:{" "}
      {kovalar.map((k, i) => (
        <span key={k.aralik.baslangic.toISOString()}>
          {kovaEtiketi(k, tur)} {k.devamEdiyor ? "(devam ediyor) " : ""}
          {seri[i] === null ? "veri yok" : <Tutar deger={seri[i]} taban={taban} />}
          {i < kovalar.length - 1 ? ", " : ""}
        </span>
      ))}
    </>
  );
}
