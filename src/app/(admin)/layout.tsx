import AppShell from "@/components/AppShell";
import { ANA_MENU, YALNIZ_YONETICI } from "@/components/menu";
import { bekleyenOnaySayisi } from "@/lib/onay-listesi/sorgu";
import { requireStaff } from "@/lib/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireStaff();
  const yonetici = session.user.role === "YONETICI";
  // Menü rozeti: hata sayfayı düşürmez (kpiGetir ilkesi); yalnız YONETICI görür.
  const onaySayisi = yonetici ? await bekleyenOnaySayisi().catch(() => 0) : 0;
  const menu = ANA_MENU.map((n) => (n.href === "/approvals" ? { ...n, sayi: onaySayisi } : n));
  return (
    <AppShell
      navItems={yonetici ? menu : menu.filter((n) => !YALNIZ_YONETICI.has(n.href))}
      userName={session.user.name ?? (yonetici ? "Yönetici" : "Operasyon")}
      roleLabel={yonetici ? "Yönetici" : "Operasyon"}
    >
      {children}
    </AppShell>
  );
}
