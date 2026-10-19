import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { homeFor } from "@/lib/roles";

export default async function Home() {
  const session = await getSession();
  if (!session) redirect("/login");
  // ADMIN → /dashboard, SELLER → /my-orders (BRK-10). Bayi giriş yapmaz (X-8).
  redirect(homeFor(session.user.role));
}
