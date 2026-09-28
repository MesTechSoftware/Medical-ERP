import type { Role } from "@/generated/prisma/enums";

/**
 * Rol → giriş sonrası ana sayfa. TEK KAYNAK.
 *
 * Tüm guard'lar ve kök yönlendirme buradan okur (BRK-10).
 *
 * `DEALER` enum'da `CM`'e kadar durur (GÇ-7) ama bayi paneli C5'te söküldü ve
 * bayi sisteme giriş yapmaz (D-2 §(6), X-8) — ana sayfası yoktur.
 */
export const ROLE_HOME: Record<Role, string> = {
  ADMIN: "/dashboard",
  SELLER: "/my-orders",
  DEALER: "/login",
};

export function homeFor(role: Role): string {
  return ROLE_HOME[role] ?? "/login";
}
