"use client";

import { useState } from "react";
import { Ikon } from "@/components/Ikon";
import { buton } from "@/components/stil";

/**
 * Tek tıkla panoya kopyalar (A-13). Pano yalnız güvenli bağlamda (HTTPS/localhost) vardır;
 * yoksa düğme yine görünür, kopyalama sessizce düşer.
 */
export default function KopyalaDugmesi({ deger, etiket, yazi = "Kopyala" }: { deger: string; etiket: string; yazi?: string }) {
  const [kopyalandi, setKopyalandi] = useState(false);
  return (
    <button
      type="button"
      className={buton("metin")}
      aria-label={`${etiket} kopyala`}
      onClick={() => {
        void navigator.clipboard?.writeText(deger).then(() => {
          setKopyalandi(true);
          setTimeout(() => setKopyalandi(false), 1500);
        });
      }}
    >
      <Ikon ad="kopyala" />
      {kopyalandi ? "Kopyalandı" : yazi}
    </button>
  );
}
