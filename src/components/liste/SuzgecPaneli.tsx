"use client";

/**
 * Filtrele açılır paneli: içindeki form gönderilince kapanır. İstemci gezinmesinde (`next/form`) sayfa
 * yeniden kurulmaz; süzgeç değişmeden Uygula'ya basılırsa panel açık kalırdı.
 */
export function SuzgecPaneli(ozellikler: Omit<React.ComponentProps<"details">, "onSubmit">) {
  return <details {...ozellikler} onSubmit={(e) => (e.currentTarget.open = false)} />;
}
