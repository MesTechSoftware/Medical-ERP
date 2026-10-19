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

/** `lastSeenAt` her istekte değil, kayıt bundan eskiyse yazılır (FAZ1 §D.4 madde 1). */
export const SON_GORULME_ESIGI_MS = 5 * 60_000;

export type OturumKullanicisi = { id: string; name: string; email: string; role: Role };

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

/** Yeni oturum açar; çereze yazılacak ham token'ı döner. */
export async function oturumOlustur(userId: string, now = new Date()): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await prisma.session.create({
    data: { userId, tokenHash: tokenHash(token), createdAt: now, lastSeenAt: now },
  });
  return token;
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
  const oturum = await prisma.session.findUnique({
    where: { tokenHash: tokenHash(token) },
    select: {
      id: true,
      createdAt: true,
      lastSeenAt: true,
      revokedAt: true,
      user: { select: { id: true, name: true, email: true, role: true, isActive: true } },
    },
  });
  if (!oturum || oturum.revokedAt || !oturum.user.isActive) return null;
  if (suresiDolduMu(oturum, now, ayar)) return null;

  if (now.getTime() - oturum.lastSeenAt.getTime() >= SON_GORULME_ESIGI_MS) {
    await prisma.session.update({ where: { id: oturum.id }, data: { lastSeenAt: now } });
  }

  const { id, name, email, role } = oturum.user;
  return { id, name, email, role };
}

/** Çıkış: yalnız bu token'ın oturumunu iptal eder. */
export async function oturumIptal(token: string, now = new Date()): Promise<void> {
  await prisma.session.updateMany({
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
