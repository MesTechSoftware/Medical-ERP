"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/session";
import { topluSecimCoz, TOPLU_SINIR } from "@/lib/kargo-listesi/suzgec";
import { siparisiSevkEt, topluKargo, type TopluSatirSonucu } from "@/lib/sevk-et";
import type { TopluSonucSatiri } from "@/components/Sonuc";
import { bilgiyleAdres } from "@/lib/bilgi-seridi";
import { basarili, engel, onayaGonderildi, type IslemSonucu } from "@/lib/sonuc";
import { prisma } from "@/lib/db";
import { donusAdresi } from "@/lib/donus-adresi";
import { IRSALIYE_SINIRI, sevkiyatTakipDuzelt } from "@/lib/sevkiyat-duzelt";

const KALEM = "miktar_";

function yenile() {
  revalidatePath("/shipping");
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  revalidatePath("/stock");
}

/**
 * HAZIRLANIYOR siparişin sevkiyatı (A-3) — kısmi sevk panelinin kart formu: kalem başına sevk miktarı, kargo
 * bilgisi ve isteğe bağlı müşteri irsaliye numarası (C-1 §(2), salt kayıt). Yazım `siparisiSevkEt`'tedir.
 * Negatif stokta gerekçe diyaloğu döner; yönetici dışındaki rolün gerekçesi siparişi onaya gönderir (A-8).
 * Sipariş hâlâ kargo bekliyorsa panel güncel kalanla açık kalır (spec Ü-24 §3.4).
 */
export async function shipOrder(orderId: string, _prev: unknown, formData: FormData): Promise<IslemSonucu> {
  const session = await requireStaff();

  const metin = (ad: string) => ((formData.get(ad) as string) || "").trim() || null;
  const kalemler = [...formData.keys()]
    .filter((k) => k.startsWith(KALEM))
    .map((k) => {
      const v = String(formData.get(k) ?? "").trim() || "0";
      // Tam sayı değilse NaN kalır ve servis reddeder; kesilip sessizce yuvarlanmaz.
      return { siparisKalemiId: k.slice(KALEM.length), miktar: /^\d+$/.test(v) ? parseInt(v, 10) : NaN };
    });

  const sonuc = await siparisiSevkEt({
    siparisId: orderId,
    kalemler,
    carrierId: metin("carrierId"),
    trackingNumber: metin("trackingNumber"),
    externalDispatchNo: metin("externalDispatchNo"),
    yapan: { id: session.user.id, rol: session.user.role },
    gerekce: metin("gerekce"),
  });

  if (sonuc.durum === "HATA") return sonuc.sonuc;
  if (sonuc.durum === "ONAYA_GONDERILDI") {
    revalidatePath("/shipping");
    revalidatePath("/approvals");
    return onayaGonderildi(sonuc.bildirimler);
  }
  yenile();
  // `sevkiyat` yalnız kimliktir; sayfa DB'den doğrulayıp bağlantıyı sunucuda kurar (KARARLAR §5.23 S3).
  const taban = sonuc.tamamlandi ? "/shipping?" : `/shipping?kismi=${encodeURIComponent(orderId)}&`;
  redirect(bilgiyleAdres(`${taban}sevkiyat=${encodeURIComponent(sonuc.sevkiyatId)}`, sonuc.bildirimler));
}

/** Toplu kargoda bir siparişin sonucu; tip ve metin `TopluKargoSonucListesi`'ndedir (X-4-2). */
export type TopluKargoSatiri = TopluSonucSatiri;
export type TopluKargoSonucu = IslemSonucu & { satirlar: TopluKargoSatiri[] };

function satir(r: TopluSatirSonucu): TopluKargoSatiri {
  const s = r.sonuc;
  return {
    siparisId: r.siparisId,
    belge: r.documentNo,
    cari: r.cari,
    durum: s.durum,
    sevkiyat: s.durum === "SEVK_EDILDI" ? s.documentNo : null,
    referans: s.durum === "TEKNIK" ? s.referans : null,
    tamamlandi: s.durum === "SEVK_EDILDI" && s.tamamlandi,
    sonucDurumu: s.durum === "HATA" ? s.sonuc.durum : null,
    bildirimler: s.durum === "HATA" ? s.sonuc.bildirimler : s.durum === "ONAYA_GONDERILDI" || s.durum === "SEVK_EDILDI" ? s.bildirimler : [],
  };
}

/**
 * Toplu kargo (12-A, A-3-3): seçilen siparişlerin kalanlarının tamamı, ortak firma, satır başına takip ve
 * irsaliye; her sipariş ayrı işlem, sonuç sipariş başına (`satirlar`). Başarılı olanlar tablodan düşer.
 */
export async function topluKargola(_prev: TopluKargoSonucu | null, formData: FormData): Promise<TopluKargoSonucu> {
  const session = await requireStaff();
  const secim = topluSecimCoz(formData);
  if ("hata" in secim) {
    const sonuc = secim.hata === "SECIM_YOK" ? engel("TOPLU_SECIM_YOK") : engel("TOPLU_SINIR_ASILDI", { sinir: TOPLU_SINIR });
    return { ...sonuc, satirlar: [] };
  }
  const carrierId = String(formData.get("carrierId") ?? "").trim() || null;
  const sonuclar = await topluKargo(secim.secimler, carrierId, { id: session.user.id, rol: session.user.role });
  yenile();
  revalidatePath("/approvals");
  return { ...basarili(), satirlar: sonuclar.map(satir) };
}


/**
 * Yazılmış sevkiyatın firma, takip no ve harici irsaliye no'sunu düzeltir (D-3-3). Stok, cari hareket, durum ve
 * gönderi tarihi değişmez; fark yoksa kayıt yazılmaz. Başarıda `donus` (kapalı liste) adresine döner.
 */
export async function updateShipmentTracking(sevkiyatId: string, donus: string | null, _prev: unknown, formData: FormData): Promise<IslemSonucu> {
  const session = await requireStaff();
  const metin = (ad: string) => String(formData.get(ad) ?? "");
  const sonuc = await prisma.$transaction((tx) =>
    sevkiyatTakipDuzelt(tx, {
      sevkiyatId,
      carrierId: metin("carrierId"),
      trackingNumber: metin("trackingNumber"),
      externalDispatchNo: metin("externalDispatchNo"),
      yapanId: session.user.id,
    })
  );
  if (sonuc.durum === "HATA") return engel(sonuc.kod, sonuc.kod === "IRSALIYE_NO_UZUN" ? { sinir: IRSALIYE_SINIRI } : {});
  if (sonuc.durum === "DEGISIKLIK_YOK") return engel("SEVKIYAT_DEGISIKLIK_YOK");
  yenile();
  revalidatePath(`/orders/${sonuc.siparisId}`);
  redirect(donusAdresi(donus, sonuc.siparisId));
}
