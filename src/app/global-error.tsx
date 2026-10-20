"use client";

import "./globals.css";
import HataEkrani from "@/components/HataEkrani";

/**
 * Kök layout'un kendisi hata verdiğinde devreye girer ve onun yerine geçer (X-3 §(1)).
 * Kendi `<html>`/`<body>`'si vardır; oturum, yetki ya da veri okuması yapılamaz.
 */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  return (
    <html lang="tr">
      <body className="bg-slate-50">
        <title>Hata · Anka West</title>
        <HataEkrani referans={error.digest} />
      </body>
    </html>
  );
}
