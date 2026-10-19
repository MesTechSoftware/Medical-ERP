/**
 * Login brute-force koruması — BELLEK İÇİ sayaç (ADR-004, KARARLAR X-9).
 *
 * Politika: art arda `policy.auth.girisDenemeSiniri` başarısız denemeden sonra
 * e-posta `policy.auth.girisKilitDakika` süresince kilitlenir. Anahtar ve eşikler
 * eski `LoginAttempt` koduyla aynıdır; tablo C7b'de bırakıldı (CM'de şemadan çıkar).
 *
 * Kabul edilen sınırlar (X-9 §(3)): süreç yeniden başlarsa sayaç sıfırlanır;
 * mekanizma TEK SÜREÇ varsayar. Birden fazla süreç çalışacağı gün bu dosya
 * geçersizleşir — önce KARARLAR açılır (ADR-004 "Geçerlilik sınırı").
 *
 * Enforcement tek noktada: `loginAction` (src/lib/auth-actions.ts). Uygulamada
 * route handler yoktur (ADR-003); kimlik doğrulamaya başka giriş yolu yoktur.
 */
import { policy } from "@/lib/policy";

const DAKIKA_MS = 60_000;

type Kayit = {
  hatalar: number;
  sonHataMs: number;
  kilitBitisMs: number | null;
};

/** Sayaç deposu. Saf fonksiyonlar dışarıdan verilen depoyla çalışır (test için). */
export type SayacDeposu = Map<string, Kayit>;

export type LockStatus = { locked: boolean; retryAfterMinutes: number };

export type SayacAyari = { esik: number; kilitMs: number };

const UNLOCKED: LockStatus = { locked: false, retryAfterMinutes: 0 };

function anahtar(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Kaydın ömrü dolmuş mu? Kilitliyse kilit bitince; kilitsizse son hatadan bir
 * kilit süresi sonra (deneme penceresi). Ömrü dolan kayıt silinir — bellek
 * sınırsız büyümez, zamanlayıcı gerekmez (ADR-004 madde 4).
 */
function dolmus(k: Kayit, nowMs: number, ayar: SayacAyari): boolean {
  return k.kilitBitisMs !== null
    ? k.kilitBitisMs <= nowMs
    : k.sonHataMs + ayar.kilitMs <= nowMs;
}

function durum(k: Kayit | undefined, nowMs: number): LockStatus {
  if (!k || k.kilitBitisMs === null) return UNLOCKED;
  const kalanMs = k.kilitBitisMs - nowMs;
  if (kalanMs <= 0) return UNLOCKED;
  return { locked: true, retryAfterMinutes: Math.ceil(kalanMs / DAKIKA_MS) };
}

/** Ömrü dolmuş bütün kayıtları siler (okuma anında temizlik). */
export function temizle(depo: SayacDeposu, now: Date, ayar: SayacAyari): void {
  const nowMs = now.getTime();
  for (const [k, kayit] of depo) {
    if (dolmus(kayit, nowMs, ayar)) depo.delete(k);
  }
}

export function kilitDurumu(
  depo: SayacDeposu,
  email: string,
  now: Date,
  ayar: SayacAyari
): LockStatus {
  temizle(depo, now, ayar);
  return durum(depo.get(anahtar(email)), now.getTime());
}

export function hataKaydet(
  depo: SayacDeposu,
  email: string,
  now: Date,
  ayar: SayacAyari
): LockStatus {
  temizle(depo, now, ayar);
  const nowMs = now.getTime();
  const k = anahtar(email);
  const hatalar = (depo.get(k)?.hatalar ?? 0) + 1;
  const kayit: Kayit = {
    hatalar,
    sonHataMs: nowMs,
    kilitBitisMs: hatalar >= ayar.esik ? nowMs + ayar.kilitMs : null,
  };
  depo.set(k, kayit);
  return durum(kayit, nowMs);
}

export function sifirla(depo: SayacDeposu, email: string): void {
  depo.delete(anahtar(email));
}

// --- Süreç içi tek örnek ------------------------------------------------------
// Dev modunda hot-reload modülü yeniden yükler; sayaç bölünmesin diye global
// singleton (db.ts'teki Prisma deseni). Başka hiçbir kod depoya dokunmaz.
const globalForSayac = globalThis as unknown as { girisSayaci?: SayacDeposu };
const depo: SayacDeposu = (globalForSayac.girisSayaci ??= new Map());

function ayar(): SayacAyari {
  return {
    esik: policy.auth.girisDenemeSiniri,
    kilitMs: policy.auth.girisKilitDakika * DAKIKA_MS,
  };
}

/** E-posta şu an kilitli mi? */
export function checkLock(email: string): LockStatus {
  return kilitDurumu(depo, email, new Date(), ayar());
}

/** Başarısız denemeyi kaydeder; eşiğe ulaşılırsa kilitler. Güncel durumu döner. */
export function recordFailure(email: string): LockStatus {
  return hataKaydet(depo, email, new Date(), ayar());
}

/** Başarılı girişte sayacı temizler. */
export function reset(email: string): void {
  sifirla(depo, email);
}

// --- Deneme logu (E-2 §(8)) ---------------------------------------------------

export type GirisSonucu = "basarili" | "hatali_kimlik" | "kilitli";

/**
 * Container log'una yazılacak tek satır: zaman, kullanıcı KİMLİĞİ, sonuç.
 * E-posta ve parola yazılmaz (X-3). Hesap bulunamadıysa kimlik `null`.
 */
export function girisLogSatiri(
  now: Date,
  kullaniciId: string | null,
  sonuc: GirisSonucu
): string {
  return JSON.stringify({
    olay: "giris_denemesi",
    zaman: now.toISOString(),
    kullaniciId,
    sonuc,
  });
}

export function logAttempt(kullaniciId: string | null, sonuc: GirisSonucu): void {
  console.info(girisLogSatiri(new Date(), kullaniciId, sonuc));
}
