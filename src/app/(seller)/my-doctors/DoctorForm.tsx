"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, SubmitButton } from "@/components/form";
import { SonucGosterimi, type SonucDurumu } from "@/components/Sonuc";
import type { IslemSonucu } from "@/lib/sonuc";
import { buton } from "@/components/stil";

type Action = (prev: SonucDurumu, formData: FormData) => Promise<IslemSonucu>;

const ALANLAR = ["fullName", "clinic", "region", "phone"] as const;

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
  const [state, formAction] = useActionState<SonucDurumu, FormData>(action, null);

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Ad Soyad"
          name="fullName"
          required
          defaultValue={defaults?.fullName}
          sonuc={state}
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
          sonuc={state}
        />
        <Field label="Bölge" name="region" required defaultValue={defaults?.region} sonuc={state} />
        <Field label="Şehir" name="city" defaultValue={defaults?.city} />
        <Field
          label="Telefon"
          name="phone"
          required
          placeholder="0532 123 45 67"
          defaultValue={defaults?.phone}
          sonuc={state}
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

      <SonucGosterimi sonuc={state} alanlar={ALANLAR} />

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <SubmitButton>{submitLabel}</SubmitButton>
        <Link
          href="/my-doctors"
          className={buton("metin")}
        >
          İptal
        </Link>
      </div>
    </form>
  );
}
