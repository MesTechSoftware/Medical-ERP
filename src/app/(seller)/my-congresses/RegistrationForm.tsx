"use client";

import { useActionState } from "react";
import { SelectField, SubmitButton, FormError } from "@/components/form";
import { requestRegistration, type RegistrationState } from "./actions";

export default function RegistrationForm({
  doctors,
  packages,
}: {
  doctors: { id: string; label: string }[];
  packages: { id: string; label: string }[];
}) {
  const [state, formAction] = useActionState<RegistrationState, FormData>(
    requestRegistration,
    {}
  );

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <SelectField
        label="Doktor"
        name="doctorId"
        required
        options={[
          { value: "", label: "Seçiniz..." },
          ...doctors.map((d) => ({ value: d.id, label: d.label })),
        ]}
      />
      <SelectField
        label="Kongre Paketi"
        name="packageId"
        required
        options={[
          { value: "", label: "Seçiniz..." },
          ...packages.map((p) => ({ value: p.id, label: p.label })),
        ]}
      />
      <div className="sm:col-span-2">
        <p className="mb-2 text-xs text-slate-500">
          Talep oluşturulduğunda doktorun bakiyesi <strong>rezerve edilir</strong>{" "}
          ve admin onayına düşer. Bakiye yetersizse kayıt yapılamaz.
        </p>
        {state.ok && (
          <p className="mb-2 text-sm font-medium text-green-700">{state.ok}</p>
        )}
        <FormError message={state.error} />
        <SubmitButton>Kayıt Talebi Oluştur</SubmitButton>
      </div>
    </form>
  );
}
