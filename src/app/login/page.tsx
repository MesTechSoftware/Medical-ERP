"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState } from "react";
import { SonucGosterimi, type SonucDurumu } from "@/components/Sonuc";
import { loginAction } from "@/lib/auth-actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<SonucDurumu, FormData>(loginAction, null);

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <Image
            src="/logo.png"
            // Küçük statik PNG; optimizasyon sunucusundan geçmez (CI'da /_next/image asılı kalıp sayfanın load olayını tutuyordu).
            unoptimized
            alt="Anka West"
            width={421}
            height={399}
            priority
            className="mx-auto mb-5 h-auto w-36"
          />
          <h1 className="text-lg font-semibold text-slate-900">Anka West</h1>
          <p className="mt-1 text-sm text-slate-500">
            Medikal Satış Operasyon Sistemi
          </p>
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
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
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
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          <SonucGosterimi sonuc={state} />

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
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
