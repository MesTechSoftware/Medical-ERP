"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, SelectField, SubmitButton, FormError } from "@/components/form";
import type { UserFormState } from "./actions";

type Action = (
  prev: UserFormState,
  formData: FormData
) => Promise<UserFormState>;

export default function UserForm({
  action,
  defaults,
  submitLabel,
  isEdit,
  rolEtiketi,
  asgariParola,
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
  /** Düzenlemede rol yalnız gösterilir; açılıştan sonra değişmez (E-2 20.10 eki). */
  rolEtiketi?: string;
  asgariParola: number;
  /** Doktoru olan aktif satıcıda pasifleştirme için portföy seçimi (X-17 §(5)). */
  portfoy?: { doktorSayisi: number; saticilar: { id: string; name: string }[] };
}) {
  // Her yanıt formu yeniden kurar (`key`): React action sonrası formu sıfırlar, `<select>`
  // eski varsayılana (AKTIF) döner. Yeni form `state.degerler` ile açılır (X-17 §(5)).
  const [state, formAction] = useActionState<UserFormState & { n?: number }, FormData>(
    async (prev, formData) => ({ ...(await action(prev, formData)), n: (prev.n ?? 0) + 1 }),
    {}
  );

  return (
    <form key={state.n ?? 0} action={formAction} className="max-w-lg space-y-4">
      <Field label="Ad Soyad" name="name" required defaultValue={defaults?.name} />
      <Field
        label="E-posta"
        name="email"
        type="email"
        required
        defaultValue={defaults?.email}
      />
      <Field label="Telefon" name="phone" defaultValue={defaults?.phone} />
      {isEdit ? (
        <p className="text-sm text-slate-600">
          Rol: <span className="font-medium text-slate-900">{rolEtiketi}</span>
        </p>
      ) : (
        <SelectField
          label="Rol"
          name="role"
          defaultValue={state.degerler?.role ?? "SATICI"}
          options={[
            { value: "SATICI", label: "Satıcı" },
            { value: "OPERASYON", label: "Operasyon" },
            { value: "YONETICI", label: "Yönetici" },
          ]}
        />
      )}
      <Field
        label={isEdit ? "Geçici Parola Ata (boş bırakılırsa değişmez)" : "Geçici Parola"}
        name="password"
        type="password"
        required={!isEdit}
      />
      <p className="-mt-2 text-xs text-slate-500">
        En az {asgariParola} karakter. Kullanıcı ilk girişte kendi parolasını belirler
        {isEdit ? "; açık oturumları kapanır" : ""}.
      </p>
      {isEdit && (
        <SelectField
          label="Durum"
          name="status"
          defaultValue={state.degerler?.status ?? defaults?.status ?? "AKTIF"}
          options={[
            { value: "AKTIF", label: "Aktif" },
            { value: "PASIF", label: "Pasif" },
          ]}
        />
      )}
      <Field
        label={isEdit ? "Gerekçe (pasifleştirme ve parola atamada zorunlu)" : "Gerekçe"}
        name="gerekce"
        required={!isEdit}
        defaultValue={state.degerler?.gerekce}
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
          href="/users"
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          İptal
        </Link>
      </div>
    </form>
  );
}
