"use client";

import { useActionState, useEffect, useRef } from "react";
import { SelectField, Field, TextArea, SubmitButton, FormError } from "@/components/form";
import { addStockEntry, type StockFormState } from "./actions";

export default function StockEntryForm({
  products,
}: {
  products: { id: string; name: string; code: string }[];
}) {
  const [state, formAction] = useActionState<StockFormState, FormData>(
    addStockEntry,
    {}
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <SelectField
        label="Ürün"
        name="productId"
        required
        options={products.map((p) => ({
          value: p.id,
          label: `${p.name} (${p.code})`,
        }))}
      />
      <Field label="Miktar (adet)" name="quantity" type="number" min="1" required />
      <TextArea label="Açıklama (opsiyonel)" name="note" placeholder="Örn: Tedarikçi girişi" />

      <FormError message={state.error} />
      {state.ok && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          Stok girişi kaydedildi.
        </p>
      )}

      <SubmitButton>Stok Girişi Ekle</SubmitButton>
    </form>
  );
}
