import AppShell from "@/components/AppShell";
import { gorunurGruplar } from "@/components/menu";
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
  const gruplar = gorunurGruplar(session.user.role, { "/approvals": onaySayisi });
  return (
    <AppShell
      navItems={gruplar.flatMap((g) => g.ogeler)}
      navGruplari={gruplar}
      userName={session.user.name ?? (yonetici ? "Yönetici" : "Operasyon")}
      roleLabel={yonetici ? "Yönetici" : "Operasyon"}
    >
      {children}
    </AppShell>
  );
}
