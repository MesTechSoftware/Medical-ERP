import type { Role } from "@/generated/prisma/enums";

/**
 * Rol → giriş sonrası ana sayfa. TEK KAYNAK.
 *
 * Tüm guard'lar ve kök yönlendirme buradan okur (BRK-10).
 *
 * `OPERASYON` 1A'da şemada vardır, davranışı yoktur (GÇ-7): ekran matrisi 1B madde 3'te
 * doğar. O güne kadar giriş yapamaz (`auth.ts`) ve ana sayfası yoktur.
 */
export const ROLE_HOME: Record<Role, string> = {
  YONETICI: "/dashboard",
  SATICI: "/my-orders",
  OPERASYON: "/login",
};

export function homeFor(role: Role): string {
  return ROLE_HOME[role] ?? "/login";
}
