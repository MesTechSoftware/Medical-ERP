"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Detay panelinin kabuğu (KARARLAR X-18 §(9)): sunucu paneli açık çizer, JS'siz de görünür ve Kapat
 * bağlantısı çalışır. JS yüklenince yerel `<dialog>` modal olur: odak panelde kalır, arka plan
 * erişilemez, Esc ve arka plana tıklama listeye döner. Kapanınca odak, açan satırın Detay
 * bağlantısına geri gelir. Geniş ekranda sağdan, telefonda tam ekran.
 */
export function YanPanel({
  kapatAdresi,
  baslikId,
  kayitId,
  children,
}: {
  kapatAdresi: string;
  baslikId: string;
  kayitId: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  useEffect(() => {
    const panel = ref.current;
    if (!panel) return;
    if (!panel.matches(":modal")) {
      panel.close();
      panel.showModal();
    }
    const vazgec = (e: Event) => {
      e.preventDefault();
      router.replace(kapatAdresi, { scroll: false });
    };
    panel.addEventListener("cancel", vazgec);
    return () => {
      panel.removeEventListener("cancel", vazgec);
      // Panel kalkınca odak açan satıra döner (liste aynı sayfada kalır).
      requestAnimationFrame(() => document.querySelector<HTMLElement>(`a[data-kayit="${CSS.escape(kayitId)}"]`)?.focus());
    };
  }, [kapatAdresi, kayitId, router]);

  return (
    <dialog
      ref={ref}
      open
      aria-labelledby={baslikId}
      onClick={(e) => {
        // Yalnız arka plana (panelin dışına) tıklama; içerik paneli tamamen doldurur.
        if (e.target === e.currentTarget) router.replace(kapatAdresi, { scroll: false });
      }}
      className="fixed inset-y-0 right-0 left-auto z-50 m-0 h-dvh max-h-none w-full max-w-none border-l border-slate-200 bg-white p-0 shadow-xl backdrop:bg-slate-900/40 md:w-[32rem]"
    >
      {children}
    </dialog>
  );
}
