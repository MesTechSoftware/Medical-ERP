import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { homeFor } from "@/lib/roles";

export default async function Home() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  // Üç yollu: ADMIN → /dashboard, SELLER → /my-orders, DEALER → /bayi (BRK-10).
  redirect(homeFor(session.user.role));
}
