"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Field, SelectField, TextArea, SubmitButton, FormError } from "@/components/form";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import {
  approveRegistration,
  cancelRegistration,
  createCongress,
  createPackage,
  deletePackage,
  updatePackage,
  type CongressState,
} from "./actions";

type CongressAction = (
  prev: CongressState,
  formData: FormData
) => Promise<CongressState>;

/** Create ve edit'te ortak kullanılan kongre formu. */
export function CongressForm({
  action,
  defaults,
  submitLabel,
  cancelHref,
}: {
  action: CongressAction;
  defaults?: {
    name?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    quota?: number;
    description?: string;
  };
  submitLabel: string;
  cancelHref?: string;
}) {
  const [state, formAction] = useActionState<CongressState, FormData>(action, {});
  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <Field label="Kongre Adı" name="name" required defaultValue={defaults?.name} />
      <Field label="Lokasyon" name="location" defaultValue={defaults?.location} />
      <Field
        label="Başlangıç"
        name="startDate"
        type="date"
        required
        defaultValue={defaults?.startDate}
      />
      <Field
        label="Bitiş"
        name="endDate"
        type="date"
        required
        defaultValue={defaults?.endDate}
      />
      <Field
        label="Kontenjan (boş = sınırsız)"
        name="quota"
        type="number"
        min="0"
        defaultValue={defaults?.quota}
      />
      <div className="sm:col-span-2">
        <TextArea label="Açıklama" name="description" defaultValue={defaults?.description} />
      </div>
      <div className="sm:col-span-2 flex items-center gap-3">
        {state.ok && <p className="text-sm text-green-700">{state.ok}</p>}
        <FormError message={state.error} />
        <SubmitButton>{submitLabel}</SubmitButton>
        {cancelHref && (
          <Link
            href={cancelHref}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            İptal
          </Link>
        )}
      </div>
    </form>
  );
}

export function NewCongressForm() {
  return <CongressForm action={createCongress} submitLabel="Kongre Oluştur" />;
}

/** Paket satırı: görüntüle / satır içi düzenle / sil. */
export function PackageRow({
  pkg,
  approvedCount,
  formatValue,
}: {
  pkg: { id: string; name: string; valueTL: number; quota: number | null };
  approvedCount: number;
  formatValue: string;
}) {
  const [editing, setEditing] = useState(false);
  const [updateState, updateAction] = useActionState<CongressState, FormData>(
    updatePackage,
    {}
  );
  const [deleteState, deleteAction] = useActionState<CongressState, FormData>(
    deletePackage,
    {}
  );

  if (editing) {
    return (
      <tr className="border-b border-slate-100 last:border-0 bg-slate-50/60">
        <td colSpan={4} className="px-2 py-2">
          <form action={updateAction} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="packageId" value={pkg.id} />
            <Field label="Ad" name="name" required defaultValue={pkg.name} />
            <Field
              label="Değer (₺)"
              name="value"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={pkg.valueTL}
            />
            <Field
              label="Kontenjan"
              name="quota"
              type="number"
              min="0"
              defaultValue={pkg.quota ?? undefined}
            />
            <SubmitButton>Kaydet</SubmitButton>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Vazgeç
            </button>
            <FormError message={updateState.error} />
          </form>
          <p className="mt-1 text-xs text-slate-500">
            Değer değişikliği geçmiş kayıtları etkilemez (rezerve tutar
            snapshot olarak saklanır).
          </p>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="px-2 py-1 text-slate-900">{pkg.name}</td>
      <td className="px-2 py-1 text-right tabular-nums">{formatValue}</td>
      <td className="px-2 py-1 text-right tabular-nums text-slate-500">
        {approvedCount}
        {pkg.quota !== null ? ` / ${pkg.quota}` : " / ∞"}
      </td>
      <td className="px-2 py-1 text-right">
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Düzenle
          </button>
          <form action={deleteAction} data-delete-package={pkg.id}>
            <input type="hidden" name="packageId" value={pkg.id} />
            <ConfirmSubmit confirmText="Bu paket silinsin mi?">Sil</ConfirmSubmit>
          </form>
        </div>
        {deleteState.error && (
          <p className="mt-1 text-xs text-red-600">{deleteState.error}</p>
        )}
      </td>
    </tr>
  );
}

export function NewPackageForm({
  congresses,
}: {
  congresses: { id: string; name: string }[];
}) {
  const [state, formAction] = useActionState<CongressState, FormData>(
    createPackage,
    {}
  );
  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <SelectField
        label="Kongre"
        name="congressId"
        required
        options={[
          { value: "", label: "Seçiniz..." },
          ...congresses.map((c) => ({ value: c.id, label: c.name })),
        ]}
      />
      <Field label="Paket Adı" name="name" required />
      <Field label="Değer (₺)" name="value" type="number" step="0.01" min="0" required />
      <Field label="Kontenjan (boş = sınırsız)" name="quota" type="number" min="0" />
      <div className="sm:col-span-2">
        {state.ok && <p className="mb-2 text-sm text-green-700">{state.ok}</p>}
        <FormError message={state.error} />
        <SubmitButton>Paket Ekle</SubmitButton>
      </div>
    </form>
  );
}

export function RegistrationActions({
  registrationId,
  status,
}: {
  registrationId: string;
  status: string;
}) {
  const [approveState, approveAction] = useActionState<CongressState, FormData>(
    approveRegistration,
    {}
  );
  const [cancelState, cancelAction] = useActionState<CongressState, FormData>(
    cancelRegistration,
    {}
  );

  const done = status === "IPTAL" || status === "REDDEDILDI";
  if (done) return <span className="text-xs text-slate-400">—</span>;

  return (
    <div className="flex items-center justify-end gap-3">
      {status === "TALEP" && (
        <form action={approveAction} data-approve={registrationId}>
          <input type="hidden" name="registrationId" value={registrationId} />
          <button
            type="submit"
            className="text-sm font-medium text-green-700 hover:text-green-900"
          >
            Onayla
          </button>
          <FormError message={approveState.error} />
        </form>
      )}
      <form action={cancelAction} data-cancel={registrationId}>
        <input type="hidden" name="registrationId" value={registrationId} />
        <input type="hidden" name="reason" value="Admin iptali" />
        <button
          type="submit"
          className="text-sm font-medium text-red-600 hover:text-red-800"
        >
          {status === "TALEP" ? "Reddet" : "İptal Et"}
        </button>
        <FormError message={cancelState.error} />
      </form>
    </div>
  );
}
