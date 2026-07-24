"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[error boundary]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">
          Bir şeyler ters gitti
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          İşlem tamamlanamadı. Tekrar deneyebilir veya sayfayı yenileyebilirsiniz.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-xs text-slate-400">
            Hata kodu: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Tekrar dene
        </button>
      </div>
    </div>
  );
}
