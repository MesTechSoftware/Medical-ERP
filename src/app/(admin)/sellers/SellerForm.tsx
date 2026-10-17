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
  portfoy,
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
  /** Doktoru olan aktif satıcıda pasifleştirme için portföy seçimi (X-17 §(5)). */
  portfoy?: { doktorSayisi: number; saticilar: { id: string; name: string }[] };
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
        defaultValue={state.degerler?.status ?? defaults?.status ?? "AKTIF"}
        options={[
          { value: "AKTIF", label: "Aktif" },
          { value: "PASIF", label: "Pasif" },
        ]}
      />

      {portfoy && (
        <fieldset className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <legend className="px-1 text-sm font-medium text-amber-800">
            Pasifleştirirsen {portfoy.doktorSayisi} doktorun portföyü
          </legend>
          <p className="text-xs text-amber-800">
            Satıcıyı pasifleştirirken zorunludur. Doktorlar yeniden aktifleştirmede geri dönmez.
          </p>
          <SelectField
            label="Doktorlar"
            name="portfoy"
            defaultValue={state.degerler?.portfoy ?? ""}
            options={[
              { value: "", label: "— Seçiniz —" },
              { value: "SAHIPSIZ", label: "Sahipsiz bırak" },
              ...portfoy.saticilar.map((s) => ({ value: s.id, label: `${s.name} satıcısına devret` })),
            ]}
          />
          <Field label="Portföy gerekçesi" name="portfoyGerekce" defaultValue={state.degerler?.portfoyGerekce} />
        </fieldset>
      )}

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
