"use client";

import { startTransition, useActionState, useRef } from "react";
import { Ikon } from "@/components/Ikon";
import { SonucGosterimi } from "@/components/Sonuc";
import { buton } from "@/components/stil";
import { bildirimMetni } from "@/lib/sozluk";
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
      {sonuc && sonuc.satirlar.length > 0 && (
        <section role="status" aria-label="Toplu hazırlık sonucu" className="rounded-lg border border-slate-200 p-3">
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Toplu hazırlık sonucu</h3>
          <ul className="divide-y divide-slate-100 text-sm">
            {sonuc.satirlar.map((r) => (
              <li key={r.siparisId} className="flex flex-wrap items-baseline gap-x-2 py-1.5">
                <span className="font-medium text-slate-900">{r.belge ?? "Sipariş bulunamadı"}</span>
                {r.cari && <span className="text-slate-500">{r.cari}</span>}
                <span className={r.tamamlandi ? "text-positive" : "text-negative"}>
                  {r.tamamlandi
                    ? "Hazırlığa alındı"
                    : r.durum === "TEKNIK"
                      ? `Teknik bir hata oluştu; sipariş değişmedi. Referans: ${r.referans}`
                      : r.bildirimler.map(bildirimMetni).join(" ")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
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
