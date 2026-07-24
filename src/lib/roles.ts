import type { Role } from "@/generated/prisma/enums";

/**
 * Rol → giriş sonrası ana sayfa. TEK KAYNAK.
 *
 * Önceden yönlendirme ikiliydi (`ADMIN ? /dashboard : /my-orders`); üçüncü rol
 * (DEALER) eklenince bir satıcı yanlışlıkla bayi paneline veya tam tersi
 * düşebilirdi. Tüm guard'lar ve kök yönlendirme buradan okur (BRK-10).
 */
export const ROLE_HOME: Record<Role, string> = {
  ADMIN: "/dashboard",
  SELLER: "/my-orders",
  DEALER: "/bayi",
};

export function homeFor(role: Role): string {
  return ROLE_HOME[role] ?? "/login";
}
