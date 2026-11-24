import type { Metadata } from "next";
import { connection } from "next/server";

import { MarkaLogosu } from "@/components/MarkaLogosu";
import { marka } from "@/lib/marka";
import LoginFormu from "./LoginFormu";

export const metadata: Metadata = { title: "Giriş" };

/** Marka istek anında okunur (E-2): sayfa derlemede donmaz; form istemci bileşenidir, marka prop olarak girer. */
export default async function LoginPage() {
  await connection();
  return (
    <LoginFormu
      marka={marka()}
      logo={<MarkaLogosu tur="tam" sinif="h-auto w-36" kutu="size-16 text-3xl" />}
    />
  );
}
