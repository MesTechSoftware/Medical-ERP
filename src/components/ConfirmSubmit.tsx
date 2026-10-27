"use client";

import { Ikon, type IkonAdi } from "@/components/Ikon";
import { buton } from "@/components/stil";

/** Onay soran submit butonu. Bir <form action={boundServerAction}> içinde kullanılır. */
export default function ConfirmSubmit({
  children,
  ikon,
  confirmText,
  className,
}: {
  children: React.ReactNode;
  ikon: IkonAdi;
  confirmText: string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
      className={className ?? buton("metin-olumsuz")}
    >
      <Ikon ad={ikon} />
      {children}
    </button>
  );
}
