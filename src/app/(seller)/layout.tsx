import AppShell, { type NavItem } from "@/components/AppShell";
import { requireSeller } from "@/lib/session";

const navItems: NavItem[] = [
  { href: "/my-orders", label: "Siparişlerim" },
  { href: "/account", label: "Hesabım" },
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
