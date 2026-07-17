/**
 * Basit, memory tabanlı login brute-force koruması.
 *
 * Politika: art arda `MAX_FAILURES` başarısız denemeden sonra e-posta
 * `LOCK_MS` süresince kilitlenir. Sunucu restart'ında sıfırlanır (harici
 * Redis yok — MVP için bilinçli sınır; bkz. README Known Limitations).
 *
 * Enforcement tek noktada: Credentials `authorize` (src/lib/auth.ts). Böylece
 * hem login formu hem de ham `/api/auth/callback/credentials` POST'u korunur.
 * `loginAction` yalnızca kullanıcıya uygun mesajı göstermek için okur.
 */

const MAX_FAILURES = 5;
const LOCK_MS = 10 * 60 * 1000; // 10 dakika

type Entry = { fails: number; lockedUntil: number };

// Next.js dev modunda modüller hot-reload'da yeniden değerlendirildiğinden
// (bkz. src/lib/db.ts singleton'ı) sayaç Map'i globalThis üzerinde tutulur;
// aksi halde her istekte sıfırlanır ve kilit hiç devreye girmez.
const globalForRateLimit = globalThis as unknown as {
  loginAttempts?: Map<string, Entry>;
};

const attempts = globalForRateLimit.loginAttempts ?? new Map<string, Entry>();

if (process.env.NODE_ENV !== "production") {
  globalForRateLimit.loginAttempts = attempts;
}

function key(email: string): string {
  return email.trim().toLowerCase();
}

export type LockStatus = { locked: boolean; retryAfterMinutes: number };

const UNLOCKED: LockStatus = { locked: false, retryAfterMinutes: 0 };

/** E-posta şu an kilitli mi? Kilit süresi dolmuşsa kaydı temizler. */
export function checkLock(email: string): LockStatus {
  const k = key(email);
  const entry = attempts.get(k);
  if (!entry) return UNLOCKED;

  const now = Date.now();
  if (entry.lockedUntil > now) {
    return {
      locked: true,
      retryAfterMinutes: Math.ceil((entry.lockedUntil - now) / 60_000),
    };
  }

  // Yalnızca SÜRESİ DOLMUŞ bir kilidi temizle. Henüz kilit yokken
  // (lockedUntil === 0) entry'yi silme — yoksa başarısızlık sayacı hiç birikmez.
  if (entry.lockedUntil > 0) {
    attempts.delete(k);
  }
  return UNLOCKED;
}

/** Başarısız denemeyi kaydeder; eşiğe ulaşılırsa kilitler. Güncel durumu döner. */
export function recordFailure(email: string): LockStatus {
  const k = key(email);
  const entry = attempts.get(k) ?? { fails: 0, lockedUntil: 0 };
  entry.fails += 1;
  if (entry.fails >= MAX_FAILURES) {
    entry.lockedUntil = Date.now() + LOCK_MS;
  }
  attempts.set(k, entry);

  return entry.lockedUntil > Date.now()
    ? { locked: true, retryAfterMinutes: Math.ceil(LOCK_MS / 60_000) }
    : UNLOCKED;
}

/** Başarılı girişte sayacı temizler. */
export function reset(email: string): void {
  attempts.delete(key(email));
}
