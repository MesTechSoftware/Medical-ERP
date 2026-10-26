import { Tutar } from "@/components/Tutar";
import type { Ay } from "@/lib/donem";
import { ayEtiketi } from "@/lib/format";
import type { ParaDegeri } from "@/lib/money";
import type { Taban } from "@/lib/taban";

/**
 * Mikro grafiğin ekran okuyucu özeti (grafik `aria-hidden`): ay ay değer; tutar `<Tutar>` ile,
 * tabanı yazılı. Görünmez metin olarak grafiğin yanına konur.
 */
export function AyOzeti({
  baslik,
  aylar,
  seri,
  taban,
}: {
  baslik: string;
  aylar: readonly Ay[];
  seri: readonly (ParaDegeri | null)[];
  taban: Taban;
}) {
  return (
    <>
      {baslik}:{" "}
      {aylar.map((a, i) => (
        <span key={`${a.yil}-${a.ay}`}>
          {ayEtiketi(a.yil, a.ay)} {a.devamEdiyor ? "(devam ediyor) " : ""}
          {seri[i] === null ? "veri yok" : <Tutar deger={seri[i]} taban={taban} />}
          {i < aylar.length - 1 ? ", " : ""}
        </span>
      ))}
    </>
  );
}
