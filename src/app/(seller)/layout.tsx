import AppShell, { type NavItem } from "@/components/AppShell";
import { requireSeller } from "@/lib/session";
import {
  BarChart3,
  ShoppingBag,
  Stethoscope,
  UserCircle,
} from "lucide-react";

const navItems: NavItem[] = [
  { href: "/my-orders", label: "Siparişlerim", icon: ShoppingBag },
  { href: "/my-doctors", label: "Doktorlarım", icon: Stethoscope },
  { href: "/my-report", label: "Raporum", icon: BarChart3 },
  { href: "/account", label: "Hesabım", icon: UserCircle },
];

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSeller();
  return (
    <AppShell
      navItems={navItems}
      userName={session.user.name ?? "Satıcı"}
      roleLabel="Satıcı"
    >
      {children}
    </AppShell>
  );
}
