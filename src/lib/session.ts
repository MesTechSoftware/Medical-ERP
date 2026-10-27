import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { homeFor } from "@/lib/roles";
import {
  gecerliOturum,
  oturumAc,
  oturumIptal,
  sureAyari,
  OTURUM_CEREZI,
  type OturumKullanicisi,
} from "@/lib/oturum";

/**
 * Oturum çerezi ve rota korumaları (E-2 §(4), `docs/adr/ADR-003`).
 *
 * Çerez opaktır: yalnız token taşır; rol, kimlik ve imza yoktur. Doğrulama `oturum.ts`'teki
 * lookup'tır — rol ve aktiflik her istekte veritabanından okunur, pasifleştirme ve rol
 * değişikliği bir sonraki istekte geçerlidir.
 *
 * `cache()` ile istek başına tekilleştirilir: aynı render'da layout + sayfa + action'lar
 * defalarca çağırsa da tek sorgu atılır.
 */

const CEREZ = OTURUM_CEREZI;

/** `oturumId`: oturum satırının numarası — denetim kaydı bağlamı (KARARLAR X-18 §(3)). */
export type Session = { user: OturumKullanicisi; oturumId: string };

const loadSession = cache(async (): Promise<Session | null> => {
  const token = (await cookies()).get(CEREZ)?.value;
  if (!token) return null;
  const gecerli = await gecerliOturum(token);
  return gecerli ? { user: gecerli.kullanici, oturumId: gecerli.oturumId } : null;
});

/** Oturum varsa döner, yoksa `null`. Yönlendirmez. */
export async function getSession(): Promise<Session | null> {
  return loadSession();
}

/** Oturum yazımıyla aynı transaction'da koşan adım — denetim kaydı (X-3 §(4)). */
type EkAdim = (tx: Prisma.TransactionClient) => Promise<void>;
/** Giriş adımı açılan oturumun numarasını alır: giriş kaydı kendi oturumunu taşır (X-18 §(3)). */
type GirisAdimi = (tx: Prisma.TransactionClient, oturumId: string) => Promise<void>;

/**
 * Oturum açar ve çerezi yazar. Yalnız server action'dan çağrılır (render'da çerez yazılamaz).
 * Çerez, oturum ve `ek` adımı commit olduktan sonra yazılır.
 * Çerez bayrakları FAZ1 §D.4 madde 7: `Secure` canlıda TLS'e bağlıdır (G-3).
 */
export async function startSession(userId: string, ek: GirisAdimi): Promise<void> {
  const token = await prisma.$transaction(async (tx) => {
    const { token: t, oturumId } = await oturumAc(userId, new Date(), tx);
    await ek(tx, oturumId);
    return t;
  });
  (await cookies()).set(CEREZ, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // Mutlak süre kaymaz; çerez de onunla biter. Asıl kontrol DB'dedir.
    maxAge: Math.floor(sureAyari().mutlakMs / 1000),
  });
}

/** Çıkış: bu oturumu iptal eder (`ek` ile aynı transaction'da) ve çerezi siler. */
export async function endSession(ek: EkAdim): Promise<void> {
  const jar = await cookies();
  const token = jar.get(CEREZ)?.value;
  await prisma.$transaction(async (tx) => {
    if (token) await oturumIptal(token, new Date(), tx);
    await ek(tx);
  });
  jar.delete(CEREZ);
}

/** Geçici parolalı kullanıcının gideceği tek sayfa (E-2-7). */
export const PAROLA_DEGISTIR = "/parola-degistir";

/**
 * Oturum yoksa veya kullanıcı artık geçerli değilse /login'e yönlendirir. Geçici parolalı
 * kullanıcıyı parola değiştirme sayfasına gönderir — bütün guard'lar buradan geçtiği için
 * korumalı sayfalar ve server action'lar birlikte kapanır (E-2-7).
 */
export async function requireSession(): Promise<Session> {
  const session = await loadSession();
  if (!session) redirect("/login");
  if (session.user.mustChangePassword) redirect(PAROLA_DEGISTIR);
  return session;
}

/** YONETICI değilse KENDİ ana sayfasına yönlendirir (rolüne göre). */
export async function requireAdmin() {
  const session = await requireSession();
  if (session.user.role !== "YONETICI") redirect(homeFor(session.user.role));
  return session;
}

/**
 * Yönetim rota grubu: YONETICI ve OPERASYON (D-2 §(1)). Yalnız YONETICI'nin işleri —
 * ürün tanımı, kullanıcı yönetimi, devir, vade, raporlar, denetim kaydı — ayrıca
 * `requireAdmin()` çağırır (D-2 17.10 eki).
 */
export async function requireStaff() {
  const session = await requireSession();
  const { role } = session.user;
  if (role !== "YONETICI" && role !== "OPERASYON") redirect(homeFor(role));
  return session;
}

/** SATICI değilse kendi ana sayfasına yönlendirir. */
export async function requireSeller() {
  const session = await requireSession();
  if (session.user.role !== "SATICI") redirect(homeFor(session.user.role));
  return session;
}
