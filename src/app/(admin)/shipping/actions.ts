"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/session";
import { kismiSonrasiAdres, topluSecimCoz, TOPLU_SINIR } from "@/lib/kargo-listesi/suzgec";
import { siparisiSevkEt, topluKargo, type TopluSatirSonucu } from "@/lib/sevk-et";
import type { TopluSonucSatiri } from "@/components/Sonuc";
import { engel, onayaGonderildi, topluUstSonuc, type IslemSonucu } from "@/lib/sonuc";
import { prisma } from "@/lib/db";
import { aktifFirmaMi } from "@/lib/sevkiyat";

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
  // Liste süzgeci ve sayfası korunur; sipariş hâlâ kargo bekliyorsa panel güncel kalanla açık kalır.
  redirect(kismiSonrasiAdres(String(formData.get("donus") ?? ""), orderId, sonuc.tamamlandi));
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
    bildirimler: s.durum === "HATA" ? s.sonuc.bildirimler : s.durum === "ONAYA_GONDERILDI" ? s.bildirimler : [],
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
  // Firma bir kez denetlenir: bilinmeyen ya da pasif firma işlemin tamamını durdurur (sipariş başına hata üretmez).
  if (carrierId !== null && !(await aktifFirmaMi(prisma, carrierId))) {
    return { ...engel("KARGO_FIRMASI_GECERSIZ", {}, "carrierId"), satirlar: [] };
  }
  const sonuclar = await topluKargo(secim.secimler, carrierId, { id: session.user.id, rol: session.user.role });
  yenile();
  revalidatePath("/approvals");
  return { ...topluUstSonuc(sonuclar.map((r) => r.sonuc.durum === "SEVK_EDILDI")), satirlar: sonuclar.map(satir) };
}
