"use client";

import { useActionState } from "react";
import { Field, SubmitButton } from "@/components/form";
import { SonucGosterimi, type SonucDurumu } from "@/components/Sonuc";
import { parolaDegistirAction } from "@/lib/auth-actions";

const ALANLAR = ["mevcut", "yeni", "tekrar"] as const;

export default function ParolaForm({ asgari }: { asgari: number }) {
  const [state, formAction] = useActionState<SonucDurumu, FormData>(parolaDegistirAction, null);
  return (
    <form action={formAction} className="space-y-4">
      <Field label="Mevcut (geçici) parola" name="mevcut" type="password" required sonuc={state} />
      <Field label="Yeni parola" name="yeni" type="password" required sonuc={state} />
      <Field label="Yeni parola (tekrar)" name="tekrar" type="password" required sonuc={state} />
      <p className="text-xs text-slate-500">En az {asgari} karakter. Yaygın parolalar kabul edilmez.</p>
      <SonucGosterimi sonuc={state} alanlar={ALANLAR} />
      <SubmitButton ikon="parola">Parolayı Değiştir</SubmitButton>
    </form>
  );
}
