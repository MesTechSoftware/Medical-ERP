"use server";

import { AuthError } from "next-auth";
import { auth, signIn, signOut } from "@/lib/auth";
import { checkLock } from "@/lib/rate-limit";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";

export type LoginState = { error?: string };

function lockedMessage(minutes: number): string {
  return `Çok fazla başarısız deneme. Lütfen ${minutes} dakika sonra tekrar deneyin.`;
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = (formData.get("email") as string) ?? "";

  // Zaten kilitliyse denemeyi hiç başlatma.
  const pre = checkLock(email);
  if (pre.locked) return { error: lockedMessage(pre.retryAfterMinutes) };

  try {
    await signIn("credentials", {
      email,
      password: formData.get("password"),
      redirectTo: "/",
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      // Sayacı authorize artırdı; burada yalnızca güncel duruma göre mesaj seç.
      const post = checkLock(email);
      return post.locked
        ? { error: lockedMessage(post.retryAfterMinutes) }
        : { error: "E-posta veya şifre hatalı." };
    }
    // signIn başarılı olduğunda NEXT_REDIRECT fırlatır; onu yeniden fırlat.
    throw error;
  }
}

export async function logoutAction() {
  const session = await auth();
  if (session?.user) {
    await createAuditLog({
      actorId: session.user.id,
      action: AUDIT_ACTIONS.AUTH_LOGOUT,
      entityType: "Auth",
      entityId: session.user.id,
    });
  }
  await signOut({ redirectTo: "/login" });
}
