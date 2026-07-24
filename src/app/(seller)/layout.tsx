import AppShell, { type NavItem } from "@/components/AppShell";
import { requireSeller } from "@/lib/session";
import {
  CalendarDays,
  Percent,
  ShoppingBag,
  Stethoscope,
  UserCircle,
} from "lucide-react";

const navItems: NavItem[] = [
  { href: "/my-orders", label: "Siparişlerim", icon: ShoppingBag },
  { href: "/my-doctors", label: "Doktorlarım", icon: Stethoscope },
  { href: "/my-commissions", label: "Primlerim", icon: Percent },
  { href: "/my-congresses", label: "Kongreler", icon: CalendarDays },
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
