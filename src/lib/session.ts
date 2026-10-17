import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { homeFor } from "@/lib/roles";

/**
 * Oturum doğrulama.
 *
 * JWT stratejisi kullandığımız için token, giriş anındaki rol/durum
 * SNAPSHOT'ını taşır. Kullanıcı pasifleştirilse veya rolü değişse bile eski
 * token geçerli kalmaya devam ederdi — yani "satıcıyı pasifleştir" işlemi
 * açık oturumu kesmiyordu. Bu yüzden her istekte kullanıcıyı veritabanından
 * doğruluyoruz.
 *
 * `cache()` ile istek başına tekilleştirilir: aynı render'da layout + sayfa +
 * action'lar defalarca çağırsa da tek sorgu atılır.
 */
const loadActiveUser = cache(async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });
});

/** Oturum yoksa veya kullanıcı artık geçerli değilse /login'e yönlendirir. */
export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await loadActiveUser(session.user.id);
  if (!user || !user.isActive) redirect("/login");

  // Token'daki role değil, veritabanındaki güncel role güvenilir.
  session.user.role = user.role;
  session.user.name = user.name;
  session.user.email = user.email;
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
