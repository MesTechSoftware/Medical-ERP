"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { cancelCongress, deleteCongress } from "./actions";

/** Kongre başlığı yanındaki Düzenle / İptal Et / Sil kontrolleri. */
export default function CongressControls({ id }: { id: string }) {
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  function run(fn: () => Promise<{ error?: string }>, confirmText: string) {
    if (!window.confirm(confirmText)) return;
    setError(undefined);
    start(async () => {
      const res = await fn();
      if (res.error) setError(res.error);
    });
  }

  return (
    <div className="flex items-center gap-3" data-congress-controls={id}>
      <Link
        href={`/congresses/${id}/edit`}
        className="text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        Düzenle
      </Link>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          run(
            () => cancelCongress(id),
            "Kongre iptal edilecek (kayıtlar korunur). Onaylıyor musunuz?"
          )
        }
        className="text-sm font-medium text-amber-700 hover:text-amber-900 disabled:opacity-50"
      >
        İptal Et
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          run(
            () => deleteCongress(id),
            "Kongre kalıcı olarak silinecek. Onaylıyor musunuz?"
          )
        }
        className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
      >
        Sil
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
