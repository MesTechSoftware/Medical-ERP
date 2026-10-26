"use client";

import { startTransition, useActionState } from "react";
import { SonucGosterimi, type SonucDurumu } from "@/components/Sonuc";
import { TextArea } from "@/components/form";
import type { IslemSonucu } from "@/lib/sonuc";
import { KONTROL_TEK_SATIR, buton } from "@/components/stil";

/**
 * İade formu (A-1): kalem başına iade miktarı (varsayılan 0) ve zorunlu sebep. Hata sonrası
 * girilen değerler korunur (`IslemFormu` deseni); başarıda form temizlenir.
 */
export default function IadeFormu({
  action,
  kalemler,
}: {
  action: (prev: SonucDurumu, formData: FormData) => Promise<IslemSonucu>;
  kalemler: { id: string; urun: string; kod: string; iadeEdilebilir: number }[];
}) {
  const [sonuc, formAction] = useActionState<SonucDurumu, FormData>(action, null);
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const veri = new FormData(e.currentTarget);
        startTransition(() => formAction(veri));
      }}
      // Başarılı iade formu yeniden kurar: miktarlar ve sebep temizlenir.
      key={sonuc?.durum === "BASARILI" ? String(sonuc.parametreler?.documentNo) : "iade"}
    >
      <div className="space-y-1">
        {kalemler.map((k) => (
          <div key={k.id} className="flex items-center justify-between gap-3 text-sm">
            <label htmlFor={`iade_${k.id}`} className="text-slate-700">
              {k.urun}
              <span className="ml-1 text-xs text-slate-400">
                {k.kod} · iade edilebilir {k.iadeEdilebilir}
              </span>
            </label>
            <input
              id={`iade_${k.id}`}
              name={`iade_${k.id}`}
              type="number"
              min={0}
              max={k.iadeEdilebilir}
              defaultValue={0}
              className={`w-20 sayi ${KONTROL_TEK_SATIR}`}
            />
          </div>
        ))}
      </div>
      <TextArea label="İade sebebi" name="reason" sonuc={sonuc} />
      <button
        type="submit"
        className={buton("ikincil")}
      >
        İade Kaydet
      </button>
      <SonucGosterimi sonuc={sonuc} alanlar={["reason"]} basari={(p) => `İade kaydedildi: ${p.documentNo}.`} />
    </form>
  );
}
