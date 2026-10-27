"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Tazeleme aralığı (K-D3). */
const ARALIK_MS = 60_000;

/**
 * Dashboard'u sekme görünürken dakikada bir sunucudan yeniden çizer (`router.refresh()`; K-D3).
 * Sekme gizlenince durur, görünür olunca yeniden başlar. WebSocket yok; ekrana bir şey çizmez.
 */
export function AkisYenileyici() {
  const router = useRouter();
  useEffect(() => {
    let zamanlayici: ReturnType<typeof setInterval> | undefined;
    const ayarla = () => {
      clearInterval(zamanlayici);
      zamanlayici = document.visibilityState === "visible" ? setInterval(() => router.refresh(), ARALIK_MS) : undefined;
    };
    ayarla();
    document.addEventListener("visibilitychange", ayarla);
    return () => {
      clearInterval(zamanlayici);
      document.removeEventListener("visibilitychange", ayarla);
    };
  }, [router]);
  return null;
}
