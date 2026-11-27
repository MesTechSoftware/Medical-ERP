import { BOS_SUZGEC, onayAdresi } from "@/lib/onay-listesi/suzgec";

/**
 * Kargo bekleyenlerdeki onay rozetinin `YONETICI` için hedefi (A-8-14, KARARLAR §5.23 S1): tek kararsız blok →
 * bloğun paneli; birden çok → sipariş belge numarasıyla aranmış bekleyen sekmesi; son blok `RED` →
 * Reddedilenler sekmesi. Onayı olmayan sipariş için `null`.
 */
export function onayBaglantisi(r: { documentNo: string; onay: "BEKLIYOR" | "RED" | undefined; acikBloklar: readonly string[] }): string | null {
  if (r.onay === "RED") return onayAdresi({ ...BOS_SUZGEC, durum: "RED", q: r.documentNo });
  if (r.onay === "BEKLIYOR") {
    if (r.acikBloklar.length === 1) return onayAdresi(BOS_SUZGEC, { detay: r.acikBloklar[0] });
    return onayAdresi({ ...BOS_SUZGEC, q: r.documentNo });
  }
  return null;
}
