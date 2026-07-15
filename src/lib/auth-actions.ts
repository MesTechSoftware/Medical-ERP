"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "E-posta veya şifre hatalı." };
    }
    // signIn başarılı olduğunda NEXT_REDIRECT fırlatır; onu yeniden fırlat.
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
