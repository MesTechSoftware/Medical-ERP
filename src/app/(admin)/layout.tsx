import AppShell from "@/components/AppShell";
import { ANA_MENU, YALNIZ_YONETICI } from "@/components/menu";
import { requireStaff } from "@/lib/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireStaff();
  const yonetici = session.user.role === "YONETICI";
  return (
    <AppShell
      navItems={yonetici ? [...ANA_MENU] : ANA_MENU.filter((n) => !YALNIZ_YONETICI.has(n.href))}
      userName={session.user.name ?? (yonetici ? "Yönetici" : "Operasyon")}
      roleLabel={yonetici ? "Yönetici" : "Operasyon"}
    >
      {children}
    </AppShell>
  );
}
