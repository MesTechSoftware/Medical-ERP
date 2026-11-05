import { gorunurOzetler, type OzetSayfasi } from "@/components/menu";
import type { Role } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { VERI_SETLERI } from "@/lib/disa-aktarim";
import type { Aralik } from "@/lib/donem";
import { kpiGetir, type KpiSonucu } from "@/lib/kpi/getir";
import { onayKosulu } from "@/lib/onay-listesi/sorgu";
import { BOS_SUZGEC as BOS_ONAY } from "@/lib/onay-listesi/suzgec";
import { siparisKosulu } from "@/lib/siparis-listesi/sorgu";
import { BOS_SUZGEC as BOS_SIPARIS, TUM_SIPARISLER } from "@/lib/siparis-listesi/suzgec";
import { stokDurumu } from "@/lib/stok-durumu";
import { gunAraligi } from "@/lib/zaman";

/** Şeridin okuma bağlamı: seçili aralık (dönem sayıları), an ve dashboard'un tek stok okuması (düştüyse `null`). */
export type SeritBaglami = { aralik: Aralik; an: Date; stoklar: readonly { stok: number }[] | null };

/**
 * Dashboard'un sayfa şeridi (kullanıcı kararı 27.10.2026: kompakt şerit): menüdeki her sayfa için
 * tek sayı. Anlık sayılar ekranın kendi tanımıyla (bekleyen ve kargolanacak KPI'larla aynı); dönem
 * sayıları (tahsilat, içe aktarım) seçili aralıktan (K-D2); stok `aktifUrunStoklari()` okumasından.
 */
export const SAYFA_SAYILARI: Record<OzetSayfasi, (b: SeritBaglami) => Promise<number>> = {
  // Siparişler ekranının "Bekliyor" sekmesiyle aynı koşul: onaylı siparişler, teklif sayılmaz (A-5).
  "/orders": () => prisma.order.count({ where: siparisKosulu({ ...BOS_SIPARIS, durum: "BEKLIYOR" }, TUM_SIPARISLER) }),
  "/shipping": () => prisma.order.count({ where: { status: "HAZIRLANIYOR" } }),
  // Onay ekranının "Bekleyen" sekmesiyle aynı koşul (`onayKosulu`, A-8-11).
  "/approvals": (b) => prisma.approvalBlock.count({ where: onayKosulu(BOS_ONAY, b.an) }),
  // Stok okuması düştüyse sıfır gösterilmez (X-3): kutu kendi hata alanına düşer.
  "/stock": async (b) => {
    if (b.stoklar === null) throw new Error("Dashboard stok okuması yüklenemedi.");
    return b.stoklar.filter((s) => stokDurumu(s.stok) !== null).length;
  },
  "/products": () => prisma.product.count({ where: { status: "AKTIF" } }),
  "/doctors": () => prisma.doctor.count({ where: { status: "AKTIF" } }),
  "/collections": (b) =>
    prisma.doctorPayment.count({ where: { status: "AKTIF", paidAt: { gte: b.aralik.baslangic, lt: b.aralik.bitis } } }),
  "/price-lists": () => prisma.priceList.count(),
  "/users": () => prisma.user.count({ where: { isActive: true } }),
  "/reports": () => prisma.user.count({ where: { role: "SATICI", isActive: true } }),
  "/audit-logs": (b) => {
    const gun = gunAraligi(b.an);
    return prisma.auditLog.count({ where: { createdAt: { gte: gun.baslangic, lt: gun.bitis } } });
  },
  "/imports": (b) => prisma.importBatch.count({ where: { createdAt: { gte: b.aralik.baslangic, lt: b.aralik.bitis } } }),
  "/exports": async () => VERI_SETLERI.length,
};

export type SeritKutusu = { sayfa: OzetSayfasi; sonuc: KpiSonucu<number> };

/**
 * Rolün göreceği kutular, sırasıyla; her kutu kendi hata alanında (X-3). Yalnız yöneticinin
 * sayfaları OPERASYON'da hiç okunmaz (`gorunurOzetler`).
 */
export async function seritKutulari(
  rol: Role,
  b: SeritBaglami,
  baglam: { yol: string; kullaniciId: string | null }
): Promise<SeritKutusu[]> {
  const sayfalar = gorunurOzetler(rol);
  const sonuclar = await Promise.all(sayfalar.map((s) => kpiGetir(() => SAYFA_SAYILARI[s](b), baglam)));
  return sayfalar.map((sayfa, i) => ({ sayfa, sonuc: sonuclar[i] }));
}
