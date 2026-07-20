import AppShell, { type NavItem } from "@/components/AppShell";
import { requireAdmin } from "@/lib/session";
import {
  LayoutDashboard,
  Globe,
  Layers,
  Users,
  ClipboardList,
  Truck,
  CreditCard,
  ShieldCheck,
} from "lucide-react";

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Ürünler", icon: Globe },
  { href: "/stock", label: "Stok", icon: Layers },
  { href: "/sellers", label: "Satıcılar", icon: Users },
  { href: "/orders", label: "Siparişler", icon: ClipboardList },
  { href: "/shipping", label: "Kargo", icon: Truck },
  { href: "/payments", label: "Ödemeler", icon: CreditCard },
  { href: "/audit-logs", label: "Audit Log", icon: ShieldCheck },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();
  return (
    <AppShell
      navItems={navItems}
      userName={session.user.name ?? "Yönetici"}
      roleLabel="Yönetici"
    >
      {children}
    </AppShell>
  );
}
