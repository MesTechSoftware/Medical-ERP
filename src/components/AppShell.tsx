import Image from "next/image";
import SidebarLink from "@/components/SidebarLink";
import LogoutButton from "@/components/LogoutButton";
import { type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export default function AppShell({
  navItems,
  userName,
  roleLabel,
  children,
}: {
  navItems: NavItem[];
  userName: string;
  roleLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        {/* px-7 + gap-2: işaret ve metin, alttaki nav ikon/etiket sütunlarına hizalanır */}
        <div className="flex h-[61px] shrink-0 items-center gap-2 border-b border-slate-200 px-7">
          <Image
            src="/logo-mark.png"
            // Küçük statik PNG; optimizasyon sunucusundan geçmez (CI'da /_next/image asılı kalıp sayfanın load olayını tutuyordu).
            unoptimized
            alt=""
            width={278}
            height={480}
            priority
            className="h-12 w-auto"
          />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold leading-tight tracking-tight text-slate-900">
              Anka West
            </div>
            <div className="truncate text-[11px] leading-tight text-slate-500">
              Medikal Satış Operasyon
            </div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-4 py-4">
          {navItems.map((item) => (
            <SidebarLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={<item.icon size={20} strokeWidth={1.75} className="shrink-0" />}
            />
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          {/* Mobil nav */}
          <nav className="flex gap-1 overflow-x-auto md:hidden">
            {navItems.map((item) => (
              <SidebarLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={<item.icon size={20} strokeWidth={1.75} className="shrink-0" />}
              />
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium text-slate-900">
                {userName}
              </div>
              <div className="text-xs text-slate-500">{roleLabel}</div>
            </div>
            <LogoutButton />
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
