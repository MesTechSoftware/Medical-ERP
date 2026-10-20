"use client";

import { useActionState } from "react";
import { Field, FormError, SubmitButton } from "@/components/form";
import { parolaDegistirAction, type ParolaDegistirState } from "@/lib/auth-actions";

export default function ParolaForm({ asgari }: { asgari: number }) {
  const [state, formAction] = useActionState<ParolaDegistirState, FormData>(parolaDegistirAction, {});
  return (
    <form action={formAction} className="space-y-4">
      <Field label="Mevcut (geçici) parola" name="mevcut" type="password" required />
      <Field label="Yeni parola" name="yeni" type="password" required />
      <Field label="Yeni parola (tekrar)" name="tekrar" type="password" required />
      <p className="text-xs text-slate-500">En az {asgari} karakter. Yaygın parolalar kabul edilmez.</p>
      <FormError message={state.error} />
      <SubmitButton>Parolayı Değiştir</SubmitButton>
    </form>
  );
}
