"use client";

import { useActionState } from "react";
import { Field, SubmitButton, FormError } from "@/components/form";
import { adjustCongressBalance, type AdjustState } from "./actions";

export default function AdjustForm({ doctorId }: { doctorId: string }) {
  const [state, formAction] = useActionState<AdjustState, FormData>(
    adjustCongressBalance,
    {}
  );

  return (
    <form action={formAction} data-adjust={doctorId} className="grid gap-3 sm:grid-cols-3">
      <input type="hidden" name="doctorId" value={doctorId} />
      <Field
        label="Tutar (₺) — negatif = düşüm"
        name="amount"
        type="number"
        step="0.01"
        required
      />
      <div className="sm:col-span-2">
        <Field label="Gerekçe (zorunlu)" name="reason" required />
      </div>
      <div className="sm:col-span-3">
        {state.ok && (
          <p className="mb-2 text-sm font-medium text-green-700">{state.ok}</p>
        )}
        <FormError message={state.error} />
        <SubmitButton>Düzeltme Uygula</SubmitButton>
      </div>
    </form>
  );
}
