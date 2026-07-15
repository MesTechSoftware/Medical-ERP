"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  Field,
  SelectField,
  TextArea,
  SubmitButton,
  FormError,
} from "@/components/form";
import { createPayment, type PaymentFormState } from "./actions";

export default function PaymentForm({
  sellers,
}: {
  sellers: { id: string; name: string }[];
}) {
  const [state, formAction] = useActionState<PaymentFormState, FormData>(
    createPayment,
    {}
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <SelectField
        label="Satıcı"
        name="sellerId"
        required
        options={sellers.map((s) => ({ value: s.id, label: s.name }))}
      />
      <Field label="Tutar (₺)" name="amount" type="number" step="0.01" min="0" required />
      <Field label="Tarih" name="date" type="date" defaultValue={today} />
      <SelectField
        label="Ödeme Yöntemi"
        name="method"
        defaultValue="TRANSFER"
        options={[
          { value: "CASH", label: "Nakit" },
          { value: "TRANSFER", label: "Havale / EFT" },
          { value: "CARD", label: "Kredi Kartı" },
          { value: "OTHER", label: "Diğer" },
        ]}
      />
      <TextArea label="Açıklama (opsiyonel)" name="note" />

      <FormError message={state.error} />
      {state.ok && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          Ödeme kaydedildi.
        </p>
      )}

      <SubmitButton>Ödeme Kaydet</SubmitButton>
    </form>
  );
}
