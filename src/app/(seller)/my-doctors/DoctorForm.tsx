"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, SubmitButton, FormError } from "@/components/form";
import type { DoctorFormState } from "./actions";

type Action = (
  prev: DoctorFormState,
  formData: FormData
) => Promise<DoctorFormState>;

export default function DoctorForm({
  action,
  defaults,
  submitLabel,
}: {
  action: Action;
  defaults?: {
    fullName?: string;
    title?: string;
    specialty?: string;
    clinic?: string;
    region?: string;
    city?: string;
    phone?: string;
    email?: string;
  };
  submitLabel: string;
}) {
  const [state, formAction] = useActionState<DoctorFormState, FormData>(
    action,
    {}
  );

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Ad Soyad"
          name="fullName"
          required
          defaultValue={defaults?.fullName}
        />
        <Field label="Unvan" name="title" defaultValue={defaults?.title} />
        <Field
          label="Branş"
          name="specialty"
          defaultValue={defaults?.specialty}
        />
        <Field
          label="Klinik / Kurum"
          name="clinic"
          required
          defaultValue={defaults?.clinic}
        />
        <Field label="Bölge" name="region" required defaultValue={defaults?.region} />
        <Field label="Şehir" name="city" defaultValue={defaults?.city} />
        <Field
          label="Telefon"
          name="phone"
          required
          placeholder="0532 123 45 67"
          defaultValue={defaults?.phone}
        />
        <Field
          label="E-posta"
          name="email"
          type="email"
          defaultValue={defaults?.email}
        />
      </div>

      <p className="text-xs text-slate-500">
        Telefon numarası sistemde benzersizdir; aynı numarayla ikinci bir doktor
        kaydı açılamaz.
      </p>

      <FormError message={state.error} />

      <div className="flex items-center gap-3 pt-2">
        <SubmitButton>{submitLabel}</SubmitButton>
        <Link
          href="/my-doctors"
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          İptal
        </Link>
      </div>
    </form>
  );
}
