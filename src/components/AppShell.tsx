import { MarkaLogosu } from "@/components/MarkaLogosu";
import { VARSAYILAN_MARKA, marka } from "@/lib/marka";
import SidebarLink from "@/components/SidebarLink";
import LogoutButton from "@/components/LogoutButton";
import MobilNavSeridi from "@/components/MobilNavSeridi";
import { type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon; /** Menü rozeti; 0 ya da yoksa çizilmez. */ sayi?: number };

export type NavGrubu = { baslik: string; ogeler: readonly NavItem[] };

export default function AppShell({
  navItems,
  navGruplari,
  userName,
  roleLabel,
  children,
}: {
  navItems: NavItem[];
  /** Verilirse masaüstü kenar menü başlıklı gruplar çizer; mobil şerit `navItems`'tan düz kalır. */
  navGruplari?: readonly NavGrubu[];
  userName: string;
  roleLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh w-full">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        {/* px-7 + gap-2: işaret ve metin, alttaki nav ikon/etiket sütunlarına hizalanır */}
        <div className="flex h-[61px] shrink-0 items-center gap-2 border-b border-slate-200 px-7">
          <MarkaLogosu tur="isaret" sinif="h-12 w-auto" kutu="size-10 text-lg" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold leading-tight tracking-tight text-slate-900">
              {marka()}
            </div>
            {marka() !== VARSAYILAN_MARKA && (
              <div className="truncate text-[11px] leading-tight text-slate-500">
                Medikal Satış Operasyon
              </div>
            )}
          </div>
        </div>
        <nav aria-label="Ana menü" className="flex flex-1 flex-col gap-1 px-4 py-4">
          {(navGruplari ?? [{ baslik: "", ogeler: navItems }]).map((g) => (
            <div key={g.baslik} role={g.baslik ? "group" : undefined} aria-label={g.baslik || undefined} className="flex flex-col gap-1">
              {g.baslik && <p className="mt-3 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400 first:mt-0">{g.baslik}</p>}
              {g.ogeler.map((item) => (
                <SidebarLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={<item.icon size={20} strokeWidth={1.75} className="shrink-0" />}
                  sayi={item.sayi}
                />
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-slate-200 bg-white">
          {/* Telefonda iki satır: üstte işaret + kullanıcı, altta tam genişlik nav şeridi.
              Dokunmatikte py-2: 44 px'lik Çıkış ile satır yine 61 px, yan menünün logo bloğuyla hizalı. */}
          <div className="kenar-x flex items-center gap-3 py-3 dokunmatik:py-2">
            <MarkaLogosu tur="isaret" sinif="h-8 w-auto md:hidden" kutu="size-8 text-base md:hidden" />
            <div className="ml-auto flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-medium text-slate-900">
                  {userName}
                </div>
                <div className="text-xs text-slate-500">{roleLabel}</div>
              </div>
              <LogoutButton />
            </div>
          </div>
          <MobilNavSeridi>
            {navItems.map((item) => (
              <SidebarLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={<item.icon size={20} strokeWidth={1.75} className="shrink-0" />}
                sayi={item.sayi}
              />
            ))}
          </MobilNavSeridi>
        </header>
        {/* İçerik (iskelet ya da gelen sayfa) eklenince 180 ms opaklıkla gelir; ölçekleme yok. */}
        <main className="kenar-x kenar-alt flex-1 pt-(--kenar) *:animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
