import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { homeFor } from "@/lib/roles";

export default async function Home() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  // ADMIN → /dashboard, SELLER → /my-orders (BRK-10). Bayi giriş yapmaz (X-8).
  redirect(homeFor(session.user.role));
}
