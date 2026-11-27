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

/** Menü grubu: masaüstü kenar menüde başlıklı bölüm (Ü-42 M6). */
export type MenuGrubu = { baslik: string; ogeler: readonly NavItem[] };

/** Yönetici kabuğunun menü grupları. Sıra: günlük iş akışı, tanımlar, yönetim. */
export const MENU_GRUPLARI: readonly MenuGrubu[] = [
  {
    baslik: "Operasyon",
    ogeler: [
      { href: "/dashboard", label: "Genel Bakış", icon: LayoutDashboard },
      { href: "/orders", label: "Siparişler", icon: ClipboardList },
      { href: "/shipping", label: "Kargo", icon: Truck },
      { href: "/approvals", label: "Onay Bekleyenler", icon: ClipboardCheck },
      { href: "/collections", label: "Tahsilatlar", icon: CreditCard },
    ],
  },
  {
    baslik: "Katalog & Cari",
    ogeler: [
      { href: "/doctors", label: "Doktorlar", icon: Stethoscope },
      { href: "/products", label: "Ürünler", icon: Package },
      { href: "/stock", label: "Stok", icon: Layers },
      { href: "/price-lists", label: "Fiyat Listeleri", icon: Tags },
    ],
  },
  {
    baslik: "Yönetim & Rapor",
    ogeler: [
      { href: "/reports", label: "Raporlar", icon: BarChart3 },
      { href: "/users", label: "Kullanıcılar", icon: Users },
      { href: "/exports", label: "Dışa Aktarım", icon: Download },
      { href: "/imports", label: "İçe Aktarım", icon: Upload },
      { href: "/audit-logs", label: "Denetim Kaydı", icon: ShieldCheck },
    ],
  },
];

/** Grupların düz birleşimi (türetilir). Kabuğun mobil şeridi, `SayfaSeridi` ve dashboard özetleri bunu okur. */
export const ANA_MENU: readonly NavItem[] = MENU_GRUPLARI.flatMap((g) => g.ogeler);

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

/** Rolün göreceği gruplar: `YALNIZ_YONETICI` grup içinde uygulanır, boşalan grup çizilmez. */
export function gorunurGruplar(rol: Role, sayilar: Readonly<Record<string, number>> = {}): MenuGrubu[] {
  return MENU_GRUPLARI.map((g) => ({
    baslik: g.baslik,
    ogeler: g.ogeler
      .filter((n) => rol === "YONETICI" || !YALNIZ_YONETICI.has(n.href))
      .map((n) => (n.href in sayilar ? { ...n, sayi: sayilar[n.href] } : n)),
  })).filter((g) => g.ogeler.length > 0);
}

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
