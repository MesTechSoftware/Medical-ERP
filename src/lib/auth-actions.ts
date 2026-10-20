"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { parolaDogru, parolaHashle, parolaHatasi } from "@/lib/parola";
import { checkLock, logAttempt, recordFailure, reset } from "@/lib/rate-limit";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";
import { endSession, getSession, startSession } from "@/lib/session";

export type LoginState = { error?: string };

function lockedMessage(minutes: number): string {
  return `Çok fazla başarısız deneme. Lütfen ${minutes} dakika sonra tekrar deneyin.`;
}

/**
 * Giriş (E-2, ADR-003). Deneme sınırı bu tek noktadadır (X-9, ADR-004): uygulamada
 * route handler yoktur, kimlik doğrulamaya başka giriş yolu kalmadı.
 */
export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = ((formData.get("email") as string) ?? "").trim().toLowerCase();
  const password = (formData.get("password") as string) ?? "";
  if (!email || !password) return { error: "E-posta veya şifre hatalı." };

  // Zaten kilitliyse denemeyi hiç başlatma.
  const pre = checkLock(email);
  if (pre.locked) {
    logAttempt(null, "kilitli");
    return { error: lockedMessage(pre.retryAfterMinutes) };
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
    return post.locked
      ? { error: lockedMessage(post.retryAfterMinutes) }
      : { error: "E-posta veya şifre hatalı." };
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

export type ParolaDegistirState = { error?: string };

/**
 * Geçici parolanın değiştirilmesi (E-2 §(2)/(3), E-2-7). Yalnız `mustChangePassword` taşıyan
 * kullanıcı içindir; profil/tercih ekranı kapsam dışıdır (E-2 kapsam dışı listesi).
 */
export async function parolaDegistirAction(
  _prev: ParolaDegistirState,
  formData: FormData
): Promise<ParolaDegistirState> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.user.mustChangePassword) redirect("/");

  const mevcut = (formData.get("mevcut") as string) ?? "";
  const yeni = (formData.get("yeni") as string) ?? "";
  const tekrar = (formData.get("tekrar") as string) ?? "";

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  if (!(await parolaDogru(mevcut, user.passwordHash))) return { error: "Mevcut parola hatalı." };
  const hata = parolaHatasi(yeni);
  if (hata) return { error: hata };
  if (yeni !== tekrar) return { error: "Yeni parola ile tekrarı aynı değil." };
  if (yeni === mevcut) return { error: "Yeni parola geçici paroladan farklı olmalıdır." };

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
