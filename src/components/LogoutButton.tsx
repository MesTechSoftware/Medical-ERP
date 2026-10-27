"use client";

import { logoutAction } from "@/lib/auth-actions";
import { Ikon } from "@/components/Ikon";

export default function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dokunmatik:min-h-11"
      >
        <Ikon ad="cikis" />
        Çıkış
      </button>
    </form>
  );
}
