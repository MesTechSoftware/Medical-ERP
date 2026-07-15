"use client";

/** Onay soran submit butonu. Bir <form action={boundServerAction}> içinde kullanılır. */
export default function ConfirmSubmit({
  children,
  confirmText,
  className,
}: {
  children: React.ReactNode;
  confirmText: string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
      className={
        className ??
        "text-sm font-medium text-red-600 transition hover:text-red-800"
      }
    >
      {children}
    </button>
  );
}
