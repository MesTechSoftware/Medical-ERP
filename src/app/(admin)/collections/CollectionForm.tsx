"use client";

import { useActionState } from "react";
import { Field, SelectField, TextArea, SubmitButton } from "@/components/form";
import { SonucGosterimi, type SonucDurumu } from "@/components/Sonuc";
import { recordCollection } from "./actions";

const ALANLAR = ["doctorId", "amount", "paymentMethodId"] as const;

export default function CollectionForm({
  doctors,
  paymentMethods,
}: {
  doctors: { id: string; label: string }[];
  /** Ödeme yöntemi tanım tablosu satırları (A-11); yönetim ekranı 1B'dedir. */
  paymentMethods: { id: string; name: string }[];
}) {
  const [state, formAction] = useActionState<SonucDurumu, FormData>(recordCollection, null);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <SelectField
        label="Doktor"
        name="doctorId"
        required
        sonuc={state}
        options={[
          { value: "", label: "Seçiniz..." },
          ...doctors.map((d) => ({ value: d.id, label: d.label })),
        ]}
      />
      <Field label="Tutar (₺)" name="amount" required sonuc={state} />
      <SelectField
        label="Yöntem"
        name="paymentMethodId"
        required
        sonuc={state}
        options={[
          { value: "", label: "Seçiniz..." },
          ...paymentMethods.map((m) => ({ value: m.id, label: m.name })),
        ]}
      />
      <Field label="Tahsilat Tarihi" name="paidAt" type="date" />
      <Field label="Dekont / Referans No" name="referenceNo" />
      <div className="sm:col-span-2">
        <TextArea label="Açıklama" name="note" />
      </div>

      <div className="sm:col-span-2">
        <p className="mb-2 text-xs text-slate-500">
          Tahsilat, vadesi en eski siparişten başlayarak otomatik mahsup edilir.
        </p>
        <div className="mb-2">
          <SonucGosterimi sonuc={state} alanlar={ALANLAR} basari={() => "Tahsilat kaydedildi."} />
        </div>
        <SubmitButton>Tahsilat Kaydet</SubmitButton>
      </div>
    </form>
  );
}
