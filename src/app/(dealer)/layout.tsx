import AppShell, { type NavItem } from "@/components/AppShell";
import { requireDealerAccount } from "@/lib/dealer-session";
import {
  LayoutDashboard,
  Truck,
  CreditCard,
  Tag,
  PlusCircle,
} from "lucide-react";

const navItems: NavItem[] = [
  { href: "/bayi", label: "Panel", icon: LayoutDashboard },
  { href: "/bayi/talep", label: "Sevkiyat Talebi", icon: PlusCircle },
  { href: "/bayi/sevkiyatlar", label: "Sevkiyatlar", icon: Truck },
  { href: "/bayi/odemeler", label: "Ödemeler", icon: CreditCard },
  { href: "/bayi/fiyatlar", label: "Fiyat Listem", icon: Tag },
];

export default async function DealerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { dealer } = await requireDealerAccount();
  return (
    <AppShell navItems={navItems} userName={dealer.title} roleLabel="Bayi">
      {children}
    </AppShell>
  );
}
