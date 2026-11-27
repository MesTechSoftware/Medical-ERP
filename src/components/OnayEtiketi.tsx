import Link from "next/link";
import { StatusChip } from "@/components/ui";

/**
 * Belgenin onay durumu etiketi (A-8): onay bekliyor ya da reddedildi; geçen belgede gösterilmez.
 * `href` verilirse (yalnız onay ekranına yetkili rol) rozet o adrese bağlanır; görünüm aynı kalır.
 */
export function OnayEtiketi({ durum, href }: { durum: "BEKLIYOR" | "RED" | undefined; href?: string }) {
  if (!durum) return null;
  const chip =
    durum === "BEKLIYOR" ? <StatusChip ton="uyari">Onay bekliyor</StatusChip> : <StatusChip ton="hata">Onay reddedildi</StatusChip>;
  return href ? (
    <Link href={href} className="inline-flex" data-onay-baglantisi>
      {chip}
    </Link>
  ) : (
    chip
  );
}
