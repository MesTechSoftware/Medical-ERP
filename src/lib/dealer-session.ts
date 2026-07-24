import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireDealer } from "@/lib/session";

/**
 * Giriş yapan DEALER kullanıcısının bağlı olduğu Dealer kaydını döndürür.
 *
 * 🔴 Bayi paneli scope'unun TEK KAYNAĞI: tüm bayi sayfaları ve action'ları
 * dealerId'yi buradan alır, ASLA istemciden gelen bir id'ye güvenmez.
 * Böylece bir bayi başka bir bayinin verisine erişemez (FR-46a).
 */
export async function requireDealerAccount() {
  const session = await requireDealer();
  const dealer = await prisma.dealer.findUnique({
    where: { userId: session.user.id },
  });
  // Login hesabı var ama Dealer bağlantısı yoksa (tutarsız veri): erişim yok.
  // requireDealer zaten pasif kullanıcıyı /login'e atar; burada ek güvence.
  if (!dealer || dealer.status !== "ACTIVE") {
    redirect("/login"); // `never` döner → altındaki dealer non-null daralır
  }
  return { session, dealer };
}
