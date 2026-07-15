import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/** Oturum yoksa /login'e yönlendirir; varsa session'ı döndürür. */
export async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

/** ADMIN değilse uygun sayfaya yönlendirir. */
export async function requireAdmin() {
  const session = await requireSession();
  if (session.user.role !== "ADMIN") redirect("/my-orders");
  return session;
}

/** SELLER değilse uygun sayfaya yönlendirir. */
export async function requireSeller() {
  const session = await requireSession();
  if (session.user.role !== "SELLER") redirect("/dashboard");
  return session;
}
