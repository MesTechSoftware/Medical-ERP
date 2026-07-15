import SidebarLink from "@/components/SidebarLink";
import LogoutButton from "@/components/LogoutButton";

export type NavItem = { href: string; label: string };

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
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6 md:flex">
        <div className="mb-8 px-2">
          <div className="text-sm font-semibold leading-tight text-slate-900">
            Medikal Satış
          </div>
          <div className="text-xs text-slate-500">Operasyon Sistemi</div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <SidebarLink key={item.href} href={item.href} label={item.label} />
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          {/* Mobil nav */}
          <nav className="flex gap-1 overflow-x-auto md:hidden">
            {navItems.map((item) => (
              <SidebarLink key={item.href} href={item.href} label={item.label} />
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
