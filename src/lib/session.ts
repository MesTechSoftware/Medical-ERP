import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { homeFor } from "@/lib/roles";
import {
  oturumDogrula,
  oturumIptal,
  oturumOlustur,
  sureAyari,
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

const CEREZ = "oturum";

export type Session = { user: OturumKullanicisi };

const loadSession = cache(async (): Promise<Session | null> => {
  const token = (await cookies()).get(CEREZ)?.value;
  if (!token) return null;
  const user = await oturumDogrula(token);
  return user ? { user } : null;
});

/** Oturum varsa döner, yoksa `null`. Yönlendirmez. */
export async function getSession(): Promise<Session | null> {
  return loadSession();
}

/**
 * Oturum açar ve çerezi yazar. Yalnız server action'dan çağrılır (render'da çerez yazılamaz).
 * Çerez bayrakları FAZ1 §D.4 madde 7: `Secure` canlıda TLS'e bağlıdır (G-3).
 */
export async function startSession(userId: string): Promise<void> {
  const token = await oturumOlustur(userId);
  (await cookies()).set(CEREZ, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // Mutlak süre kaymaz; çerez de onunla biter. Asıl kontrol DB'dedir.
    maxAge: Math.floor(sureAyari().mutlakMs / 1000),
  });
}

/** Çıkış: bu oturumu iptal eder ve çerezi siler. */
export async function endSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(CEREZ)?.value;
  if (token) await oturumIptal(token);
  jar.delete(CEREZ);
}

/** Oturum yoksa veya kullanıcı artık geçerli değilse /login'e yönlendirir. */
export async function requireSession(): Promise<Session> {
  const session = await loadSession();
  if (!session) redirect("/login");
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
