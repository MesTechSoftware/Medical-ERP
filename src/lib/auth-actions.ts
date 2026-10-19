"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
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
  const ok = !!user && user.isActive && (await bcrypt.compare(password, user.passwordHash));
  if (!user || !ok) {
    const post = recordFailure(email);
    logAttempt(user?.id ?? null, "hatali_kimlik");
    await createAuditLog({
      action: AUDIT_ACTIONS.AUTH_LOGIN_FAILURE,
      entityType: "Auth",
      entityId: email,
    });
    return post.locked
      ? { error: lockedMessage(post.retryAfterMinutes) }
      : { error: "E-posta veya şifre hatalı." };
  }

  reset(email);
  logAttempt(user.id, "basarili");
  await startSession(user.id);
  await createAuditLog({
    actorId: user.id,
    action: AUDIT_ACTIONS.AUTH_LOGIN_SUCCESS,
    entityType: "Auth",
    entityId: user.id,
  });
  redirect("/");
}

export async function logoutAction() {
  const session = await getSession();
  if (session) {
    await createAuditLog({
      actorId: session.user.id,
      action: AUDIT_ACTIONS.AUTH_LOGOUT,
      entityType: "Auth",
      entityId: session.user.id,
    });
  }
  await endSession();
  redirect("/login");
}
