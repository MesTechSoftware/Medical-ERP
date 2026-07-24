/**
 * Login brute-force koruması (kalıcı, veritabanı tabanlı).
 *
 * Politika: art arda `MAX_FAILURES` başarısız denemeden sonra e-posta
 * `LOCK_MS` süresince kilitlenir.
 *
 * Önceden bellek içi bir Map'ti: sunucu restart'ında sıfırlanıyor ve birden
 * fazla instance çalıştığında paylaşılmıyordu — yani kilit pratikte atlatılabilirdi.
 * Artık `LoginAttempt` tablosunda tutulur (Redis'e gerek yok).
 *
 * Enforcement tek noktada: Credentials `authorize` (src/lib/auth.ts). Böylece
 * hem login formu hem de ham `/api/auth/callback/credentials` POST'u korunur.
 * `loginAction` yalnızca kullanıcıya uygun mesajı göstermek için okur.
 */
import { prisma } from "@/lib/db";

const MAX_FAILURES = 5;
const LOCK_MS = 10 * 60 * 1000; // 10 dakika

function key(email: string): string {
  return email.trim().toLowerCase();
}

export type LockStatus = { locked: boolean; retryAfterMinutes: number };

const UNLOCKED: LockStatus = { locked: false, retryAfterMinutes: 0 };

function lockStatus(lockedUntil: Date | null): LockStatus {
  if (!lockedUntil) return UNLOCKED;
  const remainingMs = lockedUntil.getTime() - Date.now();
  if (remainingMs <= 0) return UNLOCKED;
  return { locked: true, retryAfterMinutes: Math.ceil(remainingMs / 60_000) };
}

/** E-posta şu an kilitli mi? */
export async function checkLock(email: string): Promise<LockStatus> {
  const entry = await prisma.loginAttempt.findUnique({
    where: { key: key(email) },
  });
  return lockStatus(entry?.lockedUntil ?? null);
}

/** Başarısız denemeyi kaydeder; eşiğe ulaşılırsa kilitler. Güncel durumu döner. */
export async function recordFailure(email: string): Promise<LockStatus> {
  const k = key(email);
  const existing = await prisma.loginAttempt.findUnique({ where: { key: k } });

  // Süresi dolmuş bir kilitten sonra sayaç sıfırdan başlar.
  const expired =
    existing?.lockedUntil != null && existing.lockedUntil.getTime() <= Date.now();
  const failures = (expired ? 0 : (existing?.failures ?? 0)) + 1;
  const lockedUntil =
    failures >= MAX_FAILURES ? new Date(Date.now() + LOCK_MS) : null;

  const saved = await prisma.loginAttempt.upsert({
    where: { key: k },
    create: { key: k, failures, lockedUntil },
    update: { failures, lockedUntil },
  });

  return lockStatus(saved.lockedUntil);
}

/** Başarılı girişte sayacı temizler. */
export async function reset(email: string): Promise<void> {
  await prisma.loginAttempt.deleteMany({ where: { key: key(email) } });
}
