"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { parolaDogru, parolaHashle, parolaHatasi } from "@/lib/parola";
import { checkLock, logAttempt, recordFailure, reset } from "@/lib/rate-limit";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";
import { endSession, getSession, startSession } from "@/lib/session";
import { engel, sonucOlustur, type IslemSonucu } from "@/lib/sonuc";

const kilitli = (dakika: number) => engel("GIRIS_KILITLI", { dakika });

/**
 * Giriş (E-2, ADR-003). Deneme sınırı bu tek noktadadır (X-9, ADR-004): uygulamada
 * route handler yoktur, kimlik doğrulamaya başka giriş yolu kalmadı.
 */
export async function loginAction(
  _prev: unknown,
  formData: FormData
): Promise<IslemSonucu> {
  const email = ((formData.get("email") as string) ?? "").trim().toLowerCase();
  const password = (formData.get("password") as string) ?? "";
  if (!email || !password) return engel("GIRIS_HATALI");

  // Zaten kilitliyse denemeyi hiç başlatma.
  const pre = checkLock(email);
  if (pre.locked) {
    logAttempt(null, "kilitli");
    return kilitli(pre.retryAfterMinutes);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const ok = !!user && user.isActive && (await parolaDogru(password, user.passwordHash));
  if (!user || !ok) {
    const post = recordFailure(email);
    logAttempt(user?.id ?? null, "hatali_kimlik");
    await createAuditLog(
      { action: AUDIT_ACTIONS.AUTH_LOGIN_FAILURE, entityType: "Auth", entityId: email },
      prisma
    );
    return post.locked ? kilitli(post.retryAfterMinutes) : engel("GIRIS_HATALI");
  }

  reset(email);
  logAttempt(user.id, "basarili");
  await startSession(user.id, (tx) =>
    createAuditLog(
      { actorId: user.id, action: AUDIT_ACTIONS.AUTH_LOGIN_SUCCESS, entityType: "Auth", entityId: user.id },
      tx
    )
  );
  redirect("/");
}

export async function logoutAction() {
  const session = await getSession();
  await endSession(async (tx) => {
    if (!session) return;
    await createAuditLog(
      { actorId: session.user.id, action: AUDIT_ACTIONS.AUTH_LOGOUT, entityType: "Auth", entityId: session.user.id },
      tx
    );
  });
  redirect("/login");
}

/**
 * Geçici parolanın değiştirilmesi (E-2 §(2)/(3), E-2-7). Yalnız `mustChangePassword` taşıyan
 * kullanıcı içindir; profil/tercih ekranı kapsam dışıdır (E-2 kapsam dışı listesi).
 */
export async function parolaDegistirAction(
  _prev: unknown,
  formData: FormData
): Promise<IslemSonucu> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.user.mustChangePassword) redirect("/");

  const mevcut = (formData.get("mevcut") as string) ?? "";
  const yeni = (formData.get("yeni") as string) ?? "";
  const tekrar = (formData.get("tekrar") as string) ?? "";

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  if (!(await parolaDogru(mevcut, user.passwordHash))) return engel("PAROLA_MEVCUT_HATALI", {}, "mevcut");
  const hata = parolaHatasi(yeni, "yeni");
  if (hata) return sonucOlustur([hata]);
  if (yeni !== tekrar) return engel("PAROLA_TEKRAR_UYUSMUYOR", {}, "tekrar");
  if (yeni === mevcut) return engel("PAROLA_DEGISMEDI", {}, "yeni");

  const passwordHash = await parolaHashle(yeni);
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: user.id }, data: { passwordHash, mustChangePassword: false } });
    await createAuditLog(
      { actorId: user.id, action: AUDIT_ACTIONS.PASSWORD_CHANGE, entityType: "User", entityId: user.id },
      tx
    );
  });
  redirect("/");
}
