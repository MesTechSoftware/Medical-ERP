import { redirect } from "next/navigation";
import { PAROLA_DEGISTIR, getSession } from "@/lib/session";
import { homeFor } from "@/lib/roles";

export default async function Home() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.mustChangePassword) redirect(PAROLA_DEGISTIR);
  // ADMIN → /dashboard, SELLER → /my-orders (BRK-10). Bayi giriş yapmaz (X-8).
  redirect(homeFor(session.user.role));
}
