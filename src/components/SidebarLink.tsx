"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SidebarLink({
  href,
  label,
  icon,
  sayi,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  sayi?: number;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        "flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition dokunmatik:min-h-11 " +
        (active
          ? "bg-slate-900 text-white"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900")
      }
    >
      <span className={"flex shrink-0 " + (active ? "text-brand" : "")}>
        {icon}
      </span>
      {label}
      {sayi ? (
        <span data-menu-sayi className="ml-auto rounded-full bg-critical-bg px-2 text-xs font-semibold tabular-nums text-critical">
          {sayi}
        </span>
      ) : null}
    </Link>
  );
}
