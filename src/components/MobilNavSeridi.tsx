"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Telefon nav şeridi (md altında). Aktif sayfa şeridin görünür alanına ortalanır.
 * Yalnız şeridin kendi `scrollLeft`'i ayarlanır — `scrollIntoView` sayfayı da kaydırabilir.
 */
export default function MobilNavSeridi({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const serit = ref.current;
    const aktif = serit?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!serit || !aktif) return;
    const hedef = aktif.offsetLeft - (serit.clientWidth - aktif.offsetWidth) / 2;
    serit.scrollLeft = Math.max(0, Math.min(hedef, serit.scrollWidth - serit.clientWidth));
  }, [pathname]);

  return (
    <nav
      ref={ref}
      aria-label="Ana menü"
      className="nav-seridi kenar-x relative flex gap-1 overflow-x-auto overscroll-x-contain border-t border-slate-100 py-2 md:hidden"
    >
      {children}
    </nav>
  );
}
