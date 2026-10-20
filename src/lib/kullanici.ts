import { Prisma } from "@/generated/prisma/client";
import type { Role } from "@/generated/prisma/enums";
import type { KuralKodu } from "@/lib/sonuc";

/**
 * Hesap yaşam döngüsünün sert kısıtları — E-2 §(7), KABUL E-2-9.
 *
 * - Kullanıcı kendi hesabını pasifleştiremez.
 * - Son aktif `YONETICI` pasifleştirilemez.
 *
 * Eşzamanlılık: iki yönetici aynı anda birbirini pasifleştirirse ikisi de "başka aktif yönetici
 * var" görür (write skew). Satır kilidi yeni bir kilit kaynağı olurdu (ADR-008 "Geçerlilik
 * sınırı"); onun yerine `YONETICI` pasifleştiren transaction `SERIALIZABLE` koşar — PostgreSQL
 * ikinciyi serileştirme hatasıyla geri alır. Yeniden deneme yoktur (ADR-008 §(5)); kullanıcıya
 * "tekrar deneyin" denir.
 */

export type HesapKurali = Extract<KuralKodu, "KENDINI_PASIFLESTIREMEZ" | "SON_YONETICI">;

/** `YONETICI` pasifleştiren transaction'ın seçenekleri. */
export function pasiflestirmeTxSecenekleri(hedefRol: Role): { isolationLevel?: Prisma.TransactionIsolationLevel } {
  return hedefRol === "YONETICI" ? { isolationLevel: Prisma.TransactionIsolationLevel.Serializable } : {};
}

/** Pasifleştirme transaction'ının içinde, yazmadan önce çağrılır. Engel yoksa `null`. */
export async function pasiflestirmeEngeli(
  tx: Prisma.TransactionClient,
  hedef: { id: string; role: Role },
  yapanId: string
): Promise<HesapKurali | null> {
  if (hedef.id === yapanId) return "KENDINI_PASIFLESTIREMEZ";
  if (hedef.role !== "YONETICI") return null;
  const digerAktifYonetici = await tx.user.count({
    where: { role: "YONETICI", isActive: true, id: { not: hedef.id } },
  });
  return digerAktifYonetici === 0 ? "SON_YONETICI" : null;
}

/**
 * Serileştirme çakışması mı? Prisma bunu P2034 olarak sarar; `@prisma/adapter-pg` ise çakışma
 * commit ya da yazım anında çıktığında `DriverAdapterError` (`cause.kind =
 * "TransactionWriteConflict"`) olarak sarmadan fırlatır. İkisi de aynı olaydır.
 */
export function eszamanlilikHatasi(e: unknown): boolean {
  if (e instanceof Prisma.PrismaClientKnownRequestError) return e.code === "P2034";
  const kind = (e as { cause?: { kind?: unknown } } | null)?.cause?.kind;
  return e instanceof Error && e.name === "DriverAdapterError" && kind === "TransactionWriteConflict";
}
