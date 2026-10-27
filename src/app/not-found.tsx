import Link from "next/link";
import { buton } from "@/components/stil";
import { Ikon } from "@/components/Ikon";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-3xl font-semibold text-slate-900">404</p>
        <h1 className="mt-1 text-lg font-semibold text-slate-900">
          Sayfa bulunamadı
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Aradığınız kayıt silinmiş veya adres hatalı olabilir.
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
