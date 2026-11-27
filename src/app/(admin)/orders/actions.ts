"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/session";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";
import { OrderStatus } from "@/generated/prisma/enums";
import { stokHareketiYaz, stokKilitle } from "@/lib/stok";
import { IsHatasi } from "@/lib/hata";
import { iadeYaz } from "@/lib/iade";
import { kalaniKapat } from "@/lib/kalan-kapat";
import { siparisAc, siparisFiyatiOnizle, siparisSatirlariniOku, type FiyatOnizlemeSonucu } from "@/lib/siparis-giris";
import { siparisiHazirla, teslimEdildiIsaretle } from "@/lib/siparis-durum";
import { riskBilgileri } from "@/lib/doctor-cari";
import { bilgiyleAdres } from "@/lib/bilgi-seridi";
import { hataKapsulu } from "@/lib/hata-kapsulu";
import { donusAdresi } from "@/lib/donus-adresi";
import { topluSecimCoz, TOPLU_SINIR } from "@/lib/kargo-listesi/suzgec";
import type { TopluSonucSatiri } from "@/components/Sonuc";
import { basarili, engel, sonucOlustur, type Bildirim, type IslemSonucu } from "@/lib/sonuc";

function revalidateOrders() {
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  revalidatePath("/shipping");
}

// Durum geçişi koşullu yazılır; arada durum değiştiyse (başka kullanıcı ilerletti) işlem
// sessizce geçmez, `SIPARIS_DURUMU_UYGUN_DEGIL` döner (X-4 §(7)).

/** BEKLIYOR -> HAZIRLANIYOR */
export async function prepareOrder(id: string, donus?: string | null): Promise<IslemSonucu> {
  const session = await requireStaff();
  const gecti = await prisma.$transaction((tx) => siparisiHazirla(tx, { siparisId: id, yapanId: session.user.id }));
  if (!gecti) return engel("SIPARIS_DURUMU_UYGUN_DEGIL");
  revalidateOrders();
  redirect(donusAdresi(donus, id));
}

export type TopluHazirlaSonucu = IslemSonucu & { satirlar: TopluSonucSatiri[] };

/**
 * Seçilen BEKLIYOR siparişleri toplu Hazırlığa Alır (A-3-10, S8): en çok `TOPLU_SINIR`; her sipariş ayrı
 * transaction, biri uygun değilse (teklif, durumu değişmiş) yalnız o satır HATA olur.
 */
export async function topluHazirla(_prev: TopluHazirlaSonucu | null, formData: FormData): Promise<TopluHazirlaSonucu> {
  const session = await requireStaff();
  const secim = topluSecimCoz(formData);
  if ("hata" in secim) {
    const s = secim.hata === "SECIM_YOK" ? engel("TOPLU_SECIM_YOK") : engel("TOPLU_SINIR_ASILDI", { sinir: TOPLU_SINIR });
    return { ...s, satirlar: [] };
  }
  const siparisler = await prisma.order.findMany({
    where: { id: { in: secim.secimler.map((s) => s.siparisId) } },
    select: { id: true, documentNo: true, doctor: { select: { fullName: true } } },
  });
  const satirlar: TopluSonucSatiri[] = [];
  for (const { siparisId } of secim.secimler) {
    const o = siparisler.find((x) => x.id === siparisId);
    let gecti = false;
    let teknik: string | null = null;
    if (o) {
      const r = await hataKapsulu(() => prisma.$transaction((tx) => siparisiHazirla(tx, { siparisId, yapanId: session.user.id })), {
        yol: "/orders",
        kullaniciId: session.user.id,
      });
      if (r.tamam) gecti = r.deger;
      else teknik = r.referans;
    }
    const uygunDegil = engel("SIPARIS_DURUMU_UYGUN_DEGIL");
    satirlar.push({
      siparisId,
      belge: o?.documentNo ?? null,
      cari: o?.doctor.fullName ?? null,
      durum: teknik ? "TEKNIK" : gecti ? "SEVK_EDILDI" : "HATA",
      sevkiyat: null,
      referans: teknik,
      tamamlandi: gecti,
      sonucDurumu: gecti || teknik ? null : uygunDegil.durum,
      bildirimler: gecti || teknik ? [] : uygunDegil.bildirimler,
    });
  }
  revalidateOrders();
  return { ...basarili(), satirlar };
}

/** KARGOLANDI -> TESLIM_EDILDI */
export async function markDelivered(id: string, donus?: string | null): Promise<IslemSonucu> {
  const session = await requireStaff();
  const gecti = await prisma.$transaction((tx) => teslimEdildiIsaretle(tx, { siparisId: id, yapanId: session.user.id }));
  if (!gecti) return engel("SIPARIS_DURUMU_UYGUN_DEGIL");
  revalidateOrders();
  redirect(donusAdresi(donus, id));
}

/**
 * Siparişi iptal eder. Sevk edilmiş sipariş bu yoldan iptal edilemez — o iade sürecidir (K-1, A-1).
 * Stok sevkiyatta düşer (A-3); sevk edilmemiş siparişin stok hareketi yoktur. Eski akışta sipariş
 * anında yazılmış çıkış varsa (1B-7 öncesi kayıtlar) iade girişiyle geri alınır.
 */
export async function cancelOrder(id: string): Promise<IslemSonucu> {
  const session = await requireStaff();

  const order = await prisma.order.findUnique({
    where: { id },
    select: { id: true, status: true, items: { select: { productId: true } } },
  });
  if (!order) redirect("/orders");

  const iptalEdildi = await prisma.$transaction(async (tx) => {
    // Sevkiyatın kilitlediği ürün satırları kilitlenir (ADR-008 sırası): eşzamanlı sevkiyat varsa
    // iptal onun commit'ini bekler ve koşullu yazım sevkiyatı görür.
    await stokKilitle(tx, order.items.map((i) => i.productId));
    const res = await tx.order.updateMany({
      where: { id, status: { in: ["BEKLIYOR", "HAZIRLANIYOR"] }, shipments: { none: {} } },
      data: { status: OrderStatus.IPTAL },
    });
    if (res.count === 0) return false;
    const eskiCikislar = await tx.stockMovement.findMany({
      where: { orderId: id, type: "CIKIS" },
      select: { productId: true, locationId: true, quantity: true },
    });
    if (eskiCikislar.length > 0) {
      await stokHareketiYaz(
        tx,
        eskiCikislar.map((h) => ({ ...h, type: "GIRIS" as const, note: "Sipariş iptali - stok iadesi", orderId: id, createdById: session.user.id }))
      );
    }
    await createAuditLog(
      {
        actorId: session.user.id,
        action: AUDIT_ACTIONS.ORDER_CANCEL,
        entityType: "Order",
        entityId: id,
        before: { status: order.status },
        after: { status: "IPTAL" },
      },
      tx
    );
    return true;
  });
  if (!iptalEdildi) return engel("SIPARIS_IPTAL_EDILEMEZ");

  revalidateOrders();
  revalidatePath("/products");
  revalidatePath("/stock");
  redirect(`/orders/${id}`);
}

/**
 * Kalanı kapat (A-3 eki): en az bir sevkiyatı olan `HAZIRLANIYOR` siparişin sevk edilmeyecek kalanını
 * gerekçeyle kapatır; sipariş `KARGOLANDI` olur. `YONETICI` ve `OPERASYON` yapar; onay bloğu açmaz.
 * Başarıda sayfada kalınır.
 */
export async function closeRemainder(orderId: string, _prev: unknown, formData: FormData): Promise<IslemSonucu> {
  const session = await requireStaff();
  try {
    await prisma.$transaction((tx) =>
      kalaniKapat(tx, {
        siparisId: orderId,
        gerekce: String(formData.get("closeReason") ?? ""),
        not: String(formData.get("closeNote") ?? ""),
        yapanId: session.user.id,
      })
    );
  } catch (e) {
    if (e instanceof IsHatasi) return e.sonuc;
    throw e;
  }
  revalidateOrders();
  revalidatePath(`/orders/${orderId}`);
  return basarili();
}

const IADE_KALEMI = "iade_";

/**
 * Mal iadesi (A-1): sevk edilmiş kalemlerden iade miktarı + zorunlu sebep. Belge, depoya stok
 * girişi ve cari alacak `iadeYaz()`'da aynı transaction'da doğar. `YONETICI` ve `OPERASYON`
 * girer (A-1 eki 20.10.2026). Başarıda sayfada kalınır; iade listesi yenilenir.
 */
export async function createReturn(orderId: string, _prev: unknown, formData: FormData): Promise<IslemSonucu> {
  const session = await requireStaff();

  const kalemler = [...formData.keys()]
    .filter((k) => k.startsWith(IADE_KALEMI))
    .map((k) => {
      const v = String(formData.get(k) ?? "").trim() || "0";
      // Tam sayı değilse NaN kalır ve servis reddeder; kesilip sessizce yuvarlanmaz.
      return { siparisKalemiId: k.slice(IADE_KALEMI.length), miktar: /^\d+$/.test(v) ? parseInt(v, 10) : NaN };
    });

  try {
    const iade = await prisma.$transaction(async (tx) => {
      const r = await iadeYaz(tx, {
        siparisId: orderId,
        kalemler,
        sebep: String(formData.get("reason") ?? ""),
        yapanId: session.user.id,
      });
      await createAuditLog(
        {
          actorId: session.user.id,
          action: AUDIT_ACTIONS.RETURN_CREATE,
          entityType: "Order",
          entityId: orderId,
          after: { iade: r.documentNo, kalemler },
        },
        tx
      );
      return r;
    });
    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/stock");
    revalidatePath("/doctors");
    revalidatePath("/reports");
    return basarili({ documentNo: iade.documentNo });
  } catch (e) {
    if (e instanceof IsHatasi) return e.sonuc;
    throw e;
  }
}

/**
 * Personel sipariş girişi (D-2 §(1), X-8 §(4)): `YONETICI` ve `OPERASYON`, her aktif cariye. Kurallar
 * satıcı ekranıyla aynı yoldan (`siparisAc`); satıcı sipariş anındaki sahiptir, bayide yoktur.
 * Yönetici girerse bedelsiz onayı aynı işlemde verilir (A-8-5).
 */
/** Formda cari ve miktara göre liste fiyatı önizlemesi (A-10-2). */
export async function fiyatOnizle(doctorId: string, productId: string, quantity: number): Promise<FiyatOnizlemeSonucu> {
  await requireStaff();
  return { ...basarili(), listeFiyat: await siparisFiyatiOnizle(doctorId, productId, quantity) };
}

/** Formda cari seçilince limit ve vade bilgisi (A-12-8); yalnız bilgi, işlemi engellemez. */
export async function cariRiskiOnizle(doctorId: string): Promise<IslemSonucu> {
  await requireStaff();
  return sonucOlustur(await riskBilgileri(doctorId));
}

export async function createStaffOrder(_prev: unknown, formData: FormData): Promise<IslemSonucu> {
  const session = await requireStaff();
  const doctorId = String(formData.get("doctorId") ?? "").trim();
  if (!doctorId) return engel("ALAN_ZORUNLU", {}, "doctorId");
  const okunan = siparisSatirlariniOku(formData.get("items") as string | null);
  if ("hata" in okunan) return okunan.hata;
  let id: string;
  let bildirimler: Bildirim[];
  try {
    ({ id, bildirimler } = await prisma.$transaction((tx) =>
      siparisAc(tx, {
        doktorId: doctorId,
        satirlar: okunan.satirlar,
        gerekce: String(formData.get("gerekce") ?? "").trim() || null,
        yapan: { id: session.user.id, rol: session.user.role },
      })
    ));
  } catch (e) {
    if (e instanceof IsHatasi) return e.sonuc;
    throw e;
  }
  revalidateOrders();
  redirect(bilgiyleAdres(`/orders/${id}`, bildirimler));
}
