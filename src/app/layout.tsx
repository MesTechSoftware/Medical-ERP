import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { connection } from "next/server";
import "./globals.css";
import { marka } from "@/lib/marka";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Marka ortamdan istek anında okunur (E-2): `connection()` ön üretimi durdurur, marka derlemede donmaz.
 * Sayfa başlıkları "Siparişler · {marka}" biçimindedir; sayfa başlık vermezse yalnız marka.
 */
export async function generateMetadata(): Promise<Metadata> {
  await connection();
  const ad = marka();
  return {
    title: { template: `%s · ${ad}`, default: ad },
    description: "Merkezi stok, sipariş, kargo ve cari hesap yönetimi",
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Çentikli ekranlarda içerik kenara uzanır; güvenli alan boşluğu `kenar-x` / `kenar-alt` ile (ADR-009).
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      data-density="compact"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
