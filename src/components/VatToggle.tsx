"use client";

import { useRouter } from "next/navigation";
import { VAT_MODE_COOKIE, type VatMode } from "@/lib/vat-mode";

function persist(mode: VatMode) {
  document.cookie = `${VAT_MODE_COOKIE}=${mode}; path=/; max-age=31536000; SameSite=Lax`;
}

/**
 * FR-64: KDV Dahil / KDV Hariç görünüm anahtarı.
 *
 * Tercihi çereze yazar ve sayfayı yeniler; sunucu bileşeni çerezi okuyup
 * doğru ciro alanını gösterir. Sabit `VAT_MODE_COOKIE` "use client" İÇERMEYEN
 * `vat-mode.ts`'ten gelir (Faz B'deki client-import tuzağına düşmemek için).
 */
export default function VatToggle({ current }: { current: VatMode }) {
  const router = useRouter();

  function set(mode: VatMode) {
    persist(mode);
    router.refresh();
  }

  return (
    <div
      className="inline-flex overflow-hidden rounded-lg border border-slate-300"
      role="group"
      aria-label="KDV görünümü"
    >
      {(["NET", "GROSS"] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => set(m)}
          aria-pressed={current === m}
          className={
            "px-3 py-1 text-xs font-medium " +
            (current === m
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-600 hover:bg-slate-50")
          }
        >
          {m === "NET" ? "KDV Hariç" : "KDV Dahil"}
        </button>
      ))}
    </div>
  );
}
