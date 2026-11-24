"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Donen } from "@/components/form";
import { Ikon } from "@/components/Ikon";
import { SonucGosterimi, type SonucDurumu } from "@/components/Sonuc";
import { loginAction } from "@/lib/auth-actions";
import { KONTROL_TEK_SATIR, buton } from "@/components/stil";

/** Giriş formu; marka ve logo sunucu sayfasından gelir (E-2: `login/page.tsx`). */
export default function LoginFormu({ marka, logo }: { marka: string; logo: React.ReactNode }) {
  const [state, formAction, pending] = useActionState<SonucDurumu, FormData>(loginAction, null);

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-5 flex justify-center">{logo}</div>
          <h1 className="text-lg font-semibold text-slate-900">{marka}</h1>
          <p className="mt-1 text-sm text-slate-500">Medikal Satış Operasyon Sistemi</p>
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              E-posta
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className={`w-full ${KONTROL_TEK_SATIR}`}
              placeholder="ornek@medikal.local"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Şifre
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className={`w-full ${KONTROL_TEK_SATIR}`}
            />
          </div>

          <SonucGosterimi sonuc={state} />

          <button
            type="submit"
            disabled={pending}
            className={`${buton("birincil")} w-full`}
          >
            {pending ? <Donen /> : <Ikon ad="giris" />}
            {pending ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          <Link href="/privacy" className="hover:text-slate-600">
            Gizlilik Politikası
          </Link>
        </p>
      </div>
    </main>
  );
}
