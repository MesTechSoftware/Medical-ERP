import Image from "next/image";

import { logoYolu, marka } from "@/lib/marka";

/**
 * Marka görseli (E-2): `APP_LOGO` / `APP_LOGO_MARK` verilmişse o görsel, yoksa markanın baş harfinden
 * nötr bir işaret. Dekoratiftir (marka adı yanında metin olarak yazılır). Sunucu bileşenidir:
 * ortam değişkeni istek anında okunur.
 */
export function MarkaLogosu({ tur, sinif, kutu }: { tur: "tam" | "isaret"; sinif: string; kutu: string }) {
  const yol = logoYolu(tur);
  if (yol) {
    return (
      <Image
        src={yol}
        // Küçük statik görsel; optimizasyon sunucusundan geçmez (CI'da /_next/image asılı kalıp sayfanın load olayını tutuyordu).
        unoptimized
        alt=""
        width={tur === "tam" ? 421 : 278}
        height={tur === "tam" ? 399 : 480}
        priority
        className={sinif}
      />
    );
  }
  const bas = [...marka()][0]?.toLocaleUpperCase("tr") ?? "M";
  return (
    <span aria-hidden className={`inline-flex items-center justify-center rounded-lg bg-slate-800 font-semibold text-white ${kutu}`}>
      {bas}
    </span>
  );
}
