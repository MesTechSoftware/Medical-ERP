"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/form";
import { SonucGosterimi, type SonucDurumu } from "@/components/Sonuc";
import { transferDoctor } from "./actions";
import { KONTROL_TEK_SATIR } from "@/components/stil";
import { GEREKCE_AZAMI } from "@/lib/sonuc";

/**
 * Toplu devir formu (X-17 §(4)). Doktor seçimi listedeki kutulardan gelir; kutular
 * `form={formId}` niteliğiyle bu forma bağlıdır. Gerekçe bir kez girilir.
 */
export default function TransferForm({
  formId,
  sellers,
}: {
  formId: string;
  sellers: { id: string; name: string }[];
}) {
  const [state, formAction] = useActionState<SonucDurumu, FormData>(transferDoctor, null);

  return (
    <form id={formId} action={formAction} className="flex flex-wrap items-end gap-2">
      <div>
        <label htmlFor="toplu-satici" className="mb-1 block text-xs text-slate-500">
          Seçilen doktorların yeni sorumlu satıcısı
        </label>
        <select
          id="toplu-satici"
          name="sellerId"
          defaultValue=""
          className={KONTROL_TEK_SATIR}
        >
          <option value="">— Sahipsiz havuz —</option>
          {sellers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="min-w-[180px] flex-1">
        <label htmlFor="toplu-gerekce" className="mb-1 block text-xs text-slate-500">
          Gerekçe
        </label>
        <input
          id="toplu-gerekce"
          name="reason"
          maxLength={GEREKCE_AZAMI}
          placeholder="Örn. bölge değişikliği"
          className={`w-full ${KONTROL_TEK_SATIR}`}
        />
      </div>

      <SubmitButton ikon="devret">Devret</SubmitButton>

      <div className="w-full">
        <SonucGosterimi sonuc={state} basari={(p) => `Devir tamamlandı: ${p.degisen} doktor.`} />
      </div>
    </form>
  );
}
