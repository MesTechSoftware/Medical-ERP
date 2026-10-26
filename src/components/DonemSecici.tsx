import Link from "next/link";
import { KONTROL_TEK_SATIR, buton } from "@/components/stil";

/**
 * Rapor dönemi (X-1 §(2)): varsayılan içinde bulunulan aydır; "tüm zamanlar" ayrı,
 * bilinçli bir seçimdir. JS'siz GET formu — dönem URL'dedir.
 */
export default function DonemSecici({ anahtar, yol }: { anahtar: string; yol: string }) {
  const tum = anahtar === "tum";
  return (
    <form method="get" action={yol} className="mb-6 flex flex-wrap items-end gap-2">
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
        Göster
      </button>
      <Link
        href={`${yol}?donem=tum`}
        className={buton(tum ? "birincil" : "ikincil")}
      >
        Tüm zamanlar
      </Link>
      <p className="w-full text-xs text-slate-500">
        {tum ? "Tüm zamanlar gösteriliyor." : `${anahtar} ayı gösteriliyor.`} Ciro sevkiyat, tahsilat tahsilat tarihine göre.
      </p>
    </form>
  );
}
