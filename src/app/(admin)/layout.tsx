import AppShell, { type NavItem } from "@/components/AppShell";
import { requireStaff } from "@/lib/session";
import {
  LayoutDashboard,
  Globe,
  Layers,
  Users,
  ClipboardList,
  Truck,
  CreditCard,
  ShieldCheck,
  Stethoscope,
  BarChart3,
  Download,
  ClipboardCheck,
} from "lucide-react";

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Ürünler", icon: Globe },
  { href: "/stock", label: "Stok", icon: Layers },
  { href: "/users", label: "Kullanıcılar", icon: Users },
  { href: "/doctors", label: "Doktorlar", icon: Stethoscope },
  { href: "/orders", label: "Siparişler", icon: ClipboardList },
  { href: "/shipping", label: "Kargo", icon: Truck },
  { href: "/approvals", label: "Onay Bekleyenler", icon: ClipboardCheck },
  { href: "/collections", label: "Tahsilatlar", icon: CreditCard },
  { href: "/reports", label: "Raporlar", icon: BarChart3 },
  { href: "/audit-logs", label: "Audit Log", icon: ShieldCheck },
  { href: "/exports", label: "Dışa Aktarım", icon: Download },
];

// D-2 17.10 eki: OPERASYON raporları ve denetim kaydını görmez; dışa aktarım yalnız YONETICI (D-5 §(4)).
// Onay kararı yalnız YONETICI'nindir (A-8); OPERASYON bekleyen siparişi Kargo ekranında görür.
// Menü yalnız görünümdür; yetki sayfanın kendi `requireAdmin()`'indedir.
const YALNIZ_YONETICI = new Set(["/reports", "/audit-logs", "/exports", "/approvals"]);

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireStaff();
  const yonetici = session.user.role === "YONETICI";
  return (
    <AppShell
      navItems={yonetici ? navItems : navItems.filter((n) => !YALNIZ_YONETICI.has(n.href))}
      userName={session.user.name ?? (yonetici ? "Yönetici" : "Operasyon")}
      roleLabel={yonetici ? "Yönetici" : "Operasyon"}
    >
      {children}
    </AppShell>
  );
}
