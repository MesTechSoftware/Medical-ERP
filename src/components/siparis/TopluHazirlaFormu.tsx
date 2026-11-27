"use client";

import { startTransition, useActionState, useRef } from "react";
import { Ikon } from "@/components/Ikon";
import { SonucGosterimi, TopluHazirlaSonucListesi } from "@/components/Sonuc";
import { buton } from "@/components/stil";
import { TOPLU_SINIR, tumunuSecDurumu } from "@/lib/kargo-listesi/suzgec";
import { topluHazirla, type TopluHazirlaSonucu } from "@/app/(admin)/orders/actions";

/**
 * Siparişler "Bekliyor" sekmesinin toplu Hazırlığa Al formu (A-3-10, S8): tablo `children` (satır seçim
 * kutuları `name="secili"`), Tümünü seç (en çok `TOPLU_SINIR`) ve Seçilenleri hazırlığa al. Sonuç sipariş başına listelenir.
 */
export function TopluHazirlaFormu({ children }: { children: React.ReactNode }) {
  const [sonuc, formAction, bekliyor] = useActionState<TopluHazirlaSonucu | null, FormData>(topluHazirla, null);
  const form = useRef<HTMLFormElement>(null);
  const tumunuSec = () => {
    const kutular = [...(form.current?.querySelectorAll<HTMLInputElement>('input[name="secili"]:not(:disabled)') ?? [])];
    tumunuSecDurumu(kutular.map((k) => k.checked)).forEach((d, i) => (kutular[i].checked = d));
  };
  return (
    <form
      ref={form}
      aria-label="Toplu hazırlık"
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const veri = new FormData(e.currentTarget);
        startTransition(() => formAction(veri));
      }}
    >
      <SonucGosterimi sonuc={sonuc} />
      {sonuc && <TopluHazirlaSonucListesi satirlar={sonuc.satirlar} />}
      {children}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={tumunuSec} className={buton("ikincil")}>
          <Ikon ad="onayla" />
          {`Tümünü seç (en çok ${TOPLU_SINIR})`}
        </button>
        <button type="submit" disabled={bekliyor} className={buton("birincil")}>
          <Ikon ad="hazirla" />
          Seçilenleri hazırlığa al
        </button>
      </div>
    </form>
  );
}
