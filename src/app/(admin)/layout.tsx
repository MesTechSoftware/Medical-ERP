import AppShell, { type NavItem } from "@/components/AppShell";
import { requireAdmin } from "@/lib/session";

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/products", label: "Ürünler" },
  { href: "/stock", label: "Stok" },
  { href: "/sellers", label: "Satıcılar" },
  { href: "/orders", label: "Siparişler" },
  { href: "/shipping", label: "Kargo" },
  { href: "/payments", label: "Ödemeler" },
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
