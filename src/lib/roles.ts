import type { Role } from "@/generated/prisma/enums";

/**
 * Rol → giriş sonrası ana sayfa. TEK KAYNAK.
 *
 * Tüm guard'lar ve kök yönlendirme buradan okur (BRK-10).
 *
 * `OPERASYON`'un ana sayfası Dashboard'dur (D-2 17.10 eki).
 */
export const ROLE_HOME: Record<Role, string> = {
  YONETICI: "/dashboard",
  SATICI: "/my-orders",
  OPERASYON: "/dashboard",
};

export function homeFor(role: Role): string {
  return ROLE_HOME[role] ?? "/login";
}
