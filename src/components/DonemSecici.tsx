import Link from "next/link";

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
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
        />
      </div>
      <button
        type="submit"
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Göster
      </button>
      <Link
        href={`${yol}?donem=tum`}
        className={`rounded-lg px-3 py-2 text-sm font-medium ${
          tum ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
        }`}
      >
        Tüm zamanlar
      </Link>
      <p className="w-full text-xs text-slate-500">
        {tum ? "Tüm zamanlar gösteriliyor." : `${anahtar} ayı gösteriliyor.`} Ciro sevkiyat, tahsilat tahsilat tarihine göre.
      </p>
    </form>
  );
}
