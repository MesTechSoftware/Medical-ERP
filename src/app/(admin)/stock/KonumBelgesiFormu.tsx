"use client";

import { startTransition, useActionState } from "react";
import { SonucGosterimi, type SonucDurumu } from "@/components/Sonuc";
import type { IslemSonucu } from "@/lib/sonuc";

type Secenek = { value: string; label: string };

const KUTU =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500";

/**
 * Tek satırlık konum belgesi (konsinye çıkış — A-4, transfer — B-4): seçimler + ürün + miktar.
 * Negatif stokta yönetici gerekçe diyaloğu aynı formu yeniden gönderir; değerler korunur.
 */
export default function KonumBelgesiFormu({
  ad,
  action,
  secimler,
  gizli,
  urunler,
  dugme,
  basari,
}: {
  /** id öneki — aynı sayfada birden çok form. */
  ad: string;
  action: (prev: SonucDurumu, formData: FormData) => Promise<IslemSonucu>;
  secimler: { name: string; label: string; options: Secenek[] }[];
  gizli?: Record<string, string>;
  urunler: Secenek[];
  dugme: string;
  basari: string;
}) {
  const [sonuc, formAction] = useActionState<SonucDurumu, FormData>(action, null);
  return (
    <form
      className="space-y-3"
      key={sonuc?.durum === "BASARILI" ? String(sonuc.parametreler?.documentNo) : ad}
      onSubmit={(e) => {
        e.preventDefault();
        const veri = new FormData(e.currentTarget);
        startTransition(() => formAction(veri));
      }}
    >
      {Object.entries(gizli ?? {}).map(([n, v]) => (
        <input key={n} type="hidden" name={n} value={v} />
      ))}
      {[...secimler, { name: "productId", label: "Ürün", options: urunler }].map((s) => (
        <div key={s.name}>
          <label htmlFor={`${ad}-${s.name}`} className="mb-1 block text-sm font-medium text-slate-700">
            {s.label}
          </label>
          <select id={`${ad}-${s.name}`} name={s.name} required defaultValue="" className={KUTU}>
            <option value="" disabled>
              Seçiniz...
            </option>
            {s.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      ))}
      <div>
        <label htmlFor={`${ad}-quantity`} className="mb-1 block text-sm font-medium text-slate-700">
          Miktar (adet)
        </label>
        <input id={`${ad}-quantity`} name="quantity" type="number" min={1} required className={KUTU} />
      </div>
      <SonucGosterimi sonuc={sonuc} basari={(p) => `${basari}: ${p.documentNo}.`} />
      <button
        type="submit"
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        {dugme}
      </button>
    </form>
  );
}
