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
import { siparisAc, siparisFiyatiOnizle, siparisSatirlariniOku, type FiyatOnizlemeSonucu } from "@/lib/siparis-giris";
import { siparisiHazirla, teslimEdildiIsaretle } from "@/lib/siparis-durum";
import { basarili, engel, type IslemSonucu } from "@/lib/sonuc";

function revalidateOrders() {
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  revalidatePath("/shipping");
}

// Durum geçişi koşullu yazılır; arada durum değiştiyse (başka kullanıcı ilerletti) işlem
// sessizce geçmez, `SIPARIS_DURUMU_UYGUN_DEGIL` döner (X-4 §(7)).

/** BEKLIYOR -> HAZIRLANIYOR */
export async function prepareOrder(id: string): Promise<IslemSonucu> {
  const session = await requireStaff();
  const gecti = await prisma.$transaction((tx) => siparisiHazirla(tx, { siparisId: id, yapanId: session.user.id }));
  if (!gecti) return engel("SIPARIS_DURUMU_UYGUN_DEGIL");
  revalidateOrders();
  redirect(`/orders/${id}`);
}

/** KARGOLANDI -> TESLIM_EDILDI */
export async function markDelivered(id: string): Promise<IslemSonucu> {
  const session = await requireStaff();
  const gecti = await prisma.$transaction((tx) => teslimEdildiIsaretle(tx, { siparisId: id, yapanId: session.user.id }));
  if (!gecti) return engel("SIPARIS_DURUMU_UYGUN_DEGIL");
  revalidateOrders();
  redirect(`/orders/${id}`);
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

export async function createStaffOrder(_prev: unknown, formData: FormData): Promise<IslemSonucu> {
  const session = await requireStaff();
  const doctorId = String(formData.get("doctorId") ?? "").trim();
  if (!doctorId) return engel("ALAN_ZORUNLU", {}, "doctorId");
  const okunan = siparisSatirlariniOku(formData.get("items") as string | null);
  if ("hata" in okunan) return okunan.hata;
  let id: string;
  try {
    ({ id } = await prisma.$transaction((tx) =>
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
  redirect(`/orders/${id}`);
}
