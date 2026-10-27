"use client";

import Link from "next/link";
import { buton } from "@/components/stil";
import { Ikon } from "@/components/Ikon";

/**
 * Beklenmeyen hatanın TEK ekranı — X-3 §(2). Üç şey gösterir: sabit açıklama, hata referansı,
 * ana sayfaya dönüş. Hata mesajı, stack ve alan adı hiçbir koşulda ekrana yazılmaz; metin
 * hangi kaydın söz konusu olduğunu ima etmez (X-3 §(8)).
 *
 * Referans, Next'in sunucu hatasına verdiği `digest`'tir; `instrumentation.ts` aynı değeri
 * log satırına yazar (X-3 §(3)). Tarayıcıda doğan hatanın sunucu kaydı yoktur, referansı da yoktur.
 */
export default function HataEkrani({ referans }: { referans?: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">İşlem tamamlanamadı</h1>
        <p className="mt-2 text-sm text-slate-600">
          Beklenmeyen bir hata oluştu ve işlem kaydedilmedi. Sorun sürerse destekle iletişime
          geçerken aşağıdaki referansı verin.
        </p>
        <p className="mt-3 text-sm text-slate-700">
          Hata referansı:{" "}
          <span data-testid="hata-referansi" className="font-mono">
            {referans ?? "—"}
          </span>
        </p>
        <Link
          href="/"
          className={`mt-4 ${buton("birincil")}`}
        >
          <Ikon ad="anaSayfa" />
          Ana sayfaya dön
        </Link>
      </div>
    </div>
  );
}
