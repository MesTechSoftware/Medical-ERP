"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, SelectField, SubmitButton, FormError } from "@/components/form";
import type { ProductFormState } from "./actions";

type Action = (
  prev: ProductFormState,
  formData: FormData
) => Promise<ProductFormState>;

export default function ProductForm({
  action,
  defaults,
  submitLabel,
  showInitialStock,
}: {
  action: Action;
  defaults?: {
    name?: string;
    code?: string;
    salePriceTL?: number;
    status?: string;
  };
  submitLabel: string;
  showInitialStock?: boolean;
}) {
  const [state, formAction] = useActionState<ProductFormState, FormData>(
    action,
    {}
  );

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <Field label="Ürün Adı" name="name" required defaultValue={defaults?.name} />
      <Field label="Ürün Kodu" name="code" required defaultValue={defaults?.code} />
      <Field
        label="Satış Fiyatı (₺)"
        name="salePrice"
        type="number"
        step="0.01"
        min="0"
        required
        defaultValue={defaults?.salePriceTL}
      />
      {showInitialStock && (
        <Field
          label="Başlangıç Stoğu (adet)"
          name="initialStock"
          type="number"
          min="0"
          defaultValue={0}
        />
      )}
      <SelectField
        label="Durum"
        name="status"
        defaultValue={defaults?.status ?? "ACTIVE"}
        options={[
          { value: "ACTIVE", label: "Aktif" },
          { value: "PASSIVE", label: "Pasif" },
        ]}
      />

      <FormError message={state.error} />

      <div className="flex items-center gap-3 pt-2">
        <SubmitButton>{submitLabel}</SubmitButton>
        <Link
          href="/products"
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          İptal
        </Link>
      </div>
    </form>
  );
}
