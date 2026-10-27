import { createHash, randomBytes } from "node:crypto";

import type { Prisma } from "@/generated/prisma/client";
import type { Role } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { policy } from "@/lib/policy";

/**
 * Oturum çekirdeği — E-2 §(4), `docs/adr/ADR-003` (yol b: opak token, `next-auth` yok).
 *
 * - Token 256-bit rastgeledir; DB'de yalnız SHA-256 hash'i durur.
 * - Doğrulama bir lookup'tır: rol ve aktiflik her istekte kullanıcı satırından okunur.
 * - Oturum satırı silinmez, `revokedAt` yazılır (C-3 `DELETE` yasağı).
 * - Oturum tablosuna yalnız bu dosya yazar (E-2-3, `tek-cagri.test.ts`).
 *
 * Çerez katmanı `session.ts`'tedir; bu dosya `next/headers`'a dokunmaz (entegrasyon testi için).
 */

const SAAT_MS = 3_600_000;

/** Oturum çerezinin adı (çerez `session.ts`'te yazılır, hata logu da okur). */
export const OTURUM_CEREZI = "oturum";

/** `lastSeenAt` her istekte değil, kayıt bundan eskiyse yazılır (FAZ1 §D.4 madde 1). */
export const SON_GORULME_ESIGI_MS = 5 * 60_000;

export type OturumKullanicisi = {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** E-2 §(2)/(3): geçici parolalı kullanıcı önce parolasını değiştirir (E-2-7). */
  mustChangePassword: boolean;
};

export type SureAyari = { hareketsizlikMs: number; mutlakMs: number };

export function sureAyari(): SureAyari {
  return {
    hareketsizlikMs: policy.auth.oturumHareketsizlikSaat * SAAT_MS,
    mutlakMs: policy.auth.oturumMutlakSaat * SAAT_MS,
  };
}

export function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Süre kuralı (E-2-2): hareketsizlik son görülmeden sayılır ve kayar; mutlak süre
 * açılıştan sayılır ve kaymaz.
 */
export function suresiDolduMu(
  oturum: { createdAt: Date; lastSeenAt: Date },
  now: Date,
  ayar: SureAyari
): boolean {
  const t = now.getTime();
  return t - oturum.lastSeenAt.getTime() >= ayar.hareketsizlikMs || t - oturum.createdAt.getTime() >= ayar.mutlakMs;
}

type Db = Prisma.TransactionClient | typeof prisma;

/** Yeni oturum açar; çereze yazılacak ham token'ı döner. */
export async function oturumOlustur(userId: string, now = new Date(), db: Db = prisma): Promise<string> {
  return (await oturumAc(userId, now, db)).token;
}

/** `oturumOlustur` ile aynı; oturum satırının numarasını da döner (giriş denetim kaydı, X-18 §(3)). */
export async function oturumAc(userId: string, now: Date, db: Db): Promise<{ token: string; oturumId: string }> {
  const token = randomBytes(32).toString("base64url");
  const oturum = await db.session.create({
    data: { userId, tokenHash: tokenHash(token), createdAt: now, lastSeenAt: now },
    select: { id: true },
  });
  return { token, oturumId: oturum.id };
}

/**
 * Token'ı doğrular. Geçerliyse kullanıcının o anki rolünü ve bilgisini döner; oturum yoksa,
 * iptal edilmişse, süresi dolmuşsa ya da kullanıcı pasifse `null`.
 */
export async function oturumDogrula(
  token: string,
  now = new Date(),
  ayar = sureAyari()
): Promise<OturumKullanicisi | null> {
  return (await gecerliOturum(token, now, ayar))?.kullanici ?? null;
}

/** `oturumDogrula` ile aynı kural; oturum satırının numarasını da döner (denetim kaydı, X-18 §(3)). */
export async function gecerliOturum(
  token: string,
  now = new Date(),
  ayar = sureAyari()
): Promise<{ oturumId: string; kullanici: OturumKullanicisi } | null> {
  const oturum = await prisma.session.findUnique({
    where: { tokenHash: tokenHash(token) },
    select: {
      id: true,
      createdAt: true,
      lastSeenAt: true,
      revokedAt: true,
      user: {
        select: { id: true, name: true, email: true, role: true, isActive: true, mustChangePassword: true },
      },
    },
  });
  if (!oturum || oturum.revokedAt || !oturum.user.isActive) return null;
  if (suresiDolduMu(oturum, now, ayar)) return null;

  if (now.getTime() - oturum.lastSeenAt.getTime() >= SON_GORULME_ESIGI_MS) {
    await prisma.session.update({ where: { id: oturum.id }, data: { lastSeenAt: now } });
  }

  const { id, name, email, role, mustChangePassword } = oturum.user;
  return { oturumId: oturum.id, kullanici: { id, name, email, role, mustChangePassword } };
}

/** Çıkış: yalnız bu token'ın oturumunu iptal eder. */
export async function oturumIptal(token: string, now = new Date(), db: Db = prisma): Promise<void> {
  await db.session.updateMany({
    where: { tokenHash: tokenHash(token), revokedAt: null },
    data: { revokedAt: now },
  });
}

/**
 * Kullanıcının açık oturumlarının hepsini iptal eder (E-2 §(6)). Pasifleştirmeyle aynı
 * transaction'da çağrılır.
 */
export async function kullaniciOturumlariniSonlandir(
  tx: Prisma.TransactionClient,
  userId: string,
  now = new Date()
): Promise<number> {
  const { count } = await tx.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: now },
  });
  return count;
}

/**
 * Token'ın kullanıcı kimliği — yalnız teknik hata logu için (X-3 §(6)). Okumadır: süre,
 * iptal ve aktiflik kontrolü yapmaz, `lastSeenAt` yazmaz.
 */
export async function oturumKullaniciId(token: string): Promise<string | null> {
  const oturum = await prisma.session.findUnique({
    where: { tokenHash: tokenHash(token) },
    select: { userId: true },
  });
  return oturum?.userId ?? null;
}
