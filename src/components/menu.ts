import {
  LayoutDashboard,
  Package,
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
  Tags,
  Upload,
} from "lucide-react";
import type { NavItem } from "@/components/AppShell";
import type { Role } from "@/generated/prisma/enums";

/** Yönetici kabuğunun menüsü. Kabuk ve dashboard'daki sayfa özetleri aynı listeyi okur. */
export const ANA_MENU: readonly NavItem[] = [
  { href: "/dashboard", label: "Genel Bakış", icon: LayoutDashboard },
  { href: "/products", label: "Ürünler", icon: Package },
  { href: "/stock", label: "Stok", icon: Layers },
  { href: "/price-lists", label: "Fiyat Listeleri", icon: Tags },
  { href: "/users", label: "Kullanıcılar", icon: Users },
  { href: "/doctors", label: "Doktorlar", icon: Stethoscope },
  { href: "/orders", label: "Siparişler", icon: ClipboardList },
  { href: "/shipping", label: "Kargo", icon: Truck },
  { href: "/approvals", label: "Onay Bekleyenler", icon: ClipboardCheck },
  { href: "/collections", label: "Tahsilatlar", icon: CreditCard },
  { href: "/reports", label: "Raporlar", icon: BarChart3 },
  { href: "/audit-logs", label: "Denetim Kaydı", icon: ShieldCheck },
  { href: "/exports", label: "Dışa Aktarım", icon: Download },
  { href: "/imports", label: "İçe Aktarım", icon: Upload },
];

// D-2 17.10 eki: OPERASYON raporları ve denetim kaydını görmez; dışa aktarım yalnız YONETICI (D-5 §(4)).
// Onay kararı yalnız YONETICI'nindir (A-8); OPERASYON bekleyen siparişi Kargo ekranında görür.
// Menü yalnız görünümdür; yetki sayfanın kendi `requireAdmin()`'indedir.
export const YALNIZ_YONETICI: ReadonlySet<string> = new Set([
  "/reports",
  "/audit-logs",
  "/exports",
  "/approvals",
  "/price-lists",
  "/imports",
]);

/** Dashboard'daki sayfa özetlerinin sırası: önce iş akışı, sonra tanımlar ve yönetim. Menüdeki her sayfa (dashboard hariç) bir kez. */
export const OZET_SIRASI = [
  "/orders",
  "/shipping",
  "/approvals",
  "/stock",
  "/products",
  "/doctors",
  "/collections",
  "/price-lists",
  "/users",
  "/reports",
  "/audit-logs",
  "/imports",
  "/exports",
] as const;

export type OzetSayfasi = (typeof OZET_SIRASI)[number];

/** Rolün göreceği özetler, sırasıyla. Yalnız yöneticinin sayfaları OPERASYON'a hiç gelmez (okunmaz). */
export function gorunurOzetler(rol: Role): OzetSayfasi[] {
  return OZET_SIRASI.filter((s) => rol === "YONETICI" || !YALNIZ_YONETICI.has(s));
}
