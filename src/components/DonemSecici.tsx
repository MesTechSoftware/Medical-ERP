import Link from "next/link";
import { KONTROL_TEK_SATIR, buton } from "@/components/stil";
import { Ikon } from "@/components/Ikon";
import { SuzgecFormu } from "@/components/liste/SuzgecFormu";

/** Seçicinin altındaki açıklama — iskelet (`DonemSeciciIskeleti`) aynı metni kullanır. */
export function donemAciklamasi(anahtar: string): string {
  const donem = anahtar === "tum" ? "Tüm zamanlar gösteriliyor." : `${anahtar} ayı gösteriliyor.`;
  return `${donem} Ciro sevkiyat, tahsilat tahsilat tarihine göre.`;
}

/**
 * Rapor dönemi (X-1 §(2)): varsayılan içinde bulunulan aydır; "tüm zamanlar" ayrı,
 * bilinçli bir seçimdir. GET formu — dönem URL'dedir; `SuzgecFormu` istemci tarafında gezer, JS'siz de
 * çalışır ve ay alanını hep uygulanan dönemle gösterir.
 */
export default function DonemSecici({ anahtar, yol }: { anahtar: string; yol: string }) {
  const tum = anahtar === "tum";
  return (
    <SuzgecFormu action={yol} anahtar={anahtar} className="mb-6 flex flex-wrap items-end gap-2">
      <div>
        <label htmlFor="donem" className="mb-1 block text-xs text-slate-500">
          Dönem (ay)
        </label>
        <input
          id="donem"
          name="donem"
          type="month"
          defaultValue={tum ? "" : anahtar}
          className={KONTROL_TEK_SATIR}
        />
      </div>
      <button
        type="submit"
        className={buton("ikincil")}
      >
        <Ikon ad="filtrele" />
        Göster
      </button>
      <Link
        href={`${yol}?donem=tum`}
        scroll={false}
        className={buton(tum ? "birincil" : "ikincil")}
      >
        <Ikon ad="tumZamanlar" />
        Tüm zamanlar
      </Link>
      <p className="w-full text-xs text-slate-500">{donemAciklamasi(anahtar)}</p>
    </SuzgecFormu>
  );
}
