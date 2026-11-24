"use client";

import { startTransition, useActionState } from "react";
import { SonucGosterimi, type SonucDurumu } from "@/components/Sonuc";
import { SelectField, TextArea } from "@/components/form";
import type { IslemSonucu } from "@/lib/sonuc";
import { KAPATMA_GEREKCESI_ADI } from "@/lib/sozluk";
import { buton } from "@/components/stil";
import { Ikon } from "@/components/Ikon";

/**
 * Kalanı kapat (A-3 eki): sevk edilmeyecek kalan miktar gerekçeyle kapatılır; `DIGER`'de açıklama
 * zorunludur. Kalan kapatma tahsilat-borç eşleştirmesi (X-6) değildir; yalnız açık sipariş miktarını düşürür.
 */
export default function KalaniKapatFormu({
  action,
  kalan,
}: {
  action: (prev: SonucDurumu, formData: FormData) => Promise<IslemSonucu>;
  kalan: number;
}) {
  const [sonuc, formAction] = useActionState<SonucDurumu, FormData>(action, null);
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const veri = new FormData(e.currentTarget);
        if (!window.confirm(`Sevk edilmeyen ${kalan} adet kapatılacak ve sipariş kargolandı sayılacak. Onaylıyor musunuz?`)) return;
        startTransition(() => formAction(veri));
      }}
    >
      <SelectField
        label="Kapatma gerekçesi"
        name="closeReason"
        required
        sonuc={sonuc}
        options={Object.entries(KAPATMA_GEREKCESI_ADI).map(([value, label]) => ({ value, label }))}
      />
      <TextArea label="Açıklama (Diğer'de zorunlu)" name="closeNote" sonuc={sonuc} />
      <button type="submit" className={buton("olumsuz-cerceve")}>
        <Ikon ad="iptalEt" />
        Kalanı Kapat ({kalan} adet)
      </button>
      <SonucGosterimi sonuc={sonuc} alanlar={["closeReason", "closeNote"]} basari={() => "Kalan kapatıldı."} />
    </form>
  );
}
