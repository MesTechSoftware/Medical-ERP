"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, SelectField, SubmitButton, FormError } from "@/components/form";
import type { SellerFormState } from "./actions";

type Action = (
  prev: SellerFormState,
  formData: FormData
) => Promise<SellerFormState>;

export default function SellerForm({
  action,
  defaults,
  submitLabel,
  isEdit,
}: {
  action: Action;
  defaults?: {
    name?: string;
    email?: string;
    phone?: string;
    status?: string;
  };
  submitLabel: string;
  isEdit?: boolean;
}) {
  const [state, formAction] = useActionState<SellerFormState, FormData>(
    action,
    {}
  );

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <Field label="Ad Soyad" name="name" required defaultValue={defaults?.name} />
      <Field
        label="E-posta"
        name="email"
        type="email"
        required
        defaultValue={defaults?.email}
      />
      <Field label="Telefon" name="phone" defaultValue={defaults?.phone} />
      <Field
        label={isEdit ? "Yeni Şifre (boş bırakılırsa değişmez)" : "Şifre"}
        name="password"
        type="password"
        required={!isEdit}
      />
      <SelectField
        label="Durum"
        name="status"
        defaultValue={defaults?.status ?? "AKTIF"}
        options={[
          { value: "AKTIF", label: "Aktif" },
          { value: "PASIF", label: "Pasif" },
        ]}
      />

      <FormError message={state.error} />

      <div className="flex items-center gap-3 pt-2">
        <SubmitButton>{submitLabel}</SubmitButton>
        <Link
          href="/sellers"
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          İptal
        </Link>
      </div>
    </form>
  );
}
