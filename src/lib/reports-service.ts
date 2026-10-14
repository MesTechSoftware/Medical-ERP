import Decimal from "decimal.js";
import { prisma } from "@/lib/db";
import { hesaplaSatirTutarlari, type SatirGirdisi } from "@/lib/satir-tutarlari";
import { sayilanBelgeler } from "@/lib/sayilan-belgeler";

/**
 * Raporlar (FR-62, FR-63). Tahsilat oranı C4'te söküldü — kalıcı (X-1 §(1)).
 *
 * Ciro daima MATRAHTIR (KDV hariç) ve SEVK EDİLEN maldan doğar (A-3, Ü-3 §(5)):
 * sevkiyat satırı × sipariş satırının donmuş fiyatı, `hesaplaSatirTutarlari()` ile.
 * Tahsilat daima BRÜTTÜR (Ü-3 §(4)); veritabanında `SUM()` ile alınır.
 * Sevk satırları yalnız sayılan belgeler filtresiyle okunur (A-5, X-1 §(5)); dönem
 * parametresi 1B madde 3'tedir (X-1). `CM` → 1B madde 7 arası sevkiyat satırını
 * yazan akış yoktur; ciro boş görünür (FAZ1 R-11).
 */

const SEVK_SATIRI = {
  quantity: true,
  orderItem: { select: { listPrice: true, unitPrice: true, vatRate: true, isFree: true } },
} as const;

type SevkSatiri = {
  quantity: number;
  orderItem: { listPrice: Decimal.Value; unitPrice: Decimal.Value; vatRate: Decimal.Value; isFree: boolean };
};

function girdi(s: SevkSatiri): SatirGirdisi {
  return {
    birimFiyat: s.orderItem.unitPrice,
    listeFiyat: s.orderItem.listPrice,
    kdvOrani: s.orderItem.vatRate,
    miktar: s.quantity,
    bedelsiz: s.orderItem.isFree,
  };
}

export type SellerReport = {
  sellerId: string;
  name: string;
  ciro: Decimal;
  tahsilat: Decimal;
  ortalamaIskonto: Decimal | null; // %
  doktorSayisi: number;
};

export async function getSellerReports(): Promise<SellerReport[]> {
  const sellers = await prisma.user.findMany({
    where: { role: "SATICI" },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return Promise.all(
    sellers.map(async (s) => {
      const [sevk, collected, doktorSayisi] = await Promise.all([
        prisma.shipmentItem.findMany({
          where: { AND: [sayilanBelgeler.sevkSatiri, { shipment: { order: { sellerId: s.id } } }] },
          select: SEVK_SATIRI,
        }),
        // Tahsilat siparişe eşlenmez (X-6); satıcıya doktorun sorumlusu
        // üzerinden sayılır. Dönem ve devir kuralı 1B'de (X-1 §(2), X-13).
        prisma.doctorPayment.aggregate({
          where: { status: "AKTIF", doctor: { ownerSellerId: s.id } },
          _sum: { amount: true },
        }),
        prisma.doctor.count({ where: { ownerSellerId: s.id } }),
      ]);
      const { toplam } = hesaplaSatirTutarlari(sevk.map(girdi));
      return {
        sellerId: s.id,
        name: s.name,
        ciro: toplam.matrah,
        tahsilat: new Decimal(collected._sum.amount ?? 0),
        ortalamaIskonto: toplam.iskontoOran,
        doktorSayisi,
      };
    })
  );
}

/** Doktor ciro sıralaması (FR-63). Gecikmiş borç tutarı C3'te söküldü (X-6 §(7)). */
export type DoctorReport = {
  doctorId: string;
  fullName: string;
  sellerName: string | null;
  ciro: Decimal;
};

export async function getDoctorReports(limit = 50): Promise<DoctorReport[]> {
  const [doctors, sevk] = await Promise.all([
    prisma.doctor.findMany({
      select: { id: true, fullName: true, ownerSeller: { select: { name: true } } },
    }),
    prisma.shipmentItem.findMany({
      where: sayilanBelgeler.sevkSatiri,
      select: { ...SEVK_SATIRI, shipment: { select: { order: { select: { doctorId: true } } } } },
    }),
  ]);

  const doktorSatirlari = new Map<string, SevkSatiri[]>();
  for (const s of sevk) {
    const id = s.shipment.order.doctorId;
    doktorSatirlari.set(id, [...(doktorSatirlari.get(id) ?? []), s]);
  }

  const rows = doctors.map((d) => {
    const satirlar = doktorSatirlari.get(d.id) ?? [];
    return {
      doctorId: d.id,
      fullName: d.fullName,
      sellerName: d.ownerSeller?.name ?? null,
      ciro: hesaplaSatirTutarlari(satirlar.map(girdi)).toplam.matrah,
    };
  });

  rows.sort((a, b) => b.ciro.comparedTo(a.ciro));
  return rows.slice(0, limit);
}

/** Toplam ciro — matrah, sevk edilen mal (A-3, Ü-3 C sınıfı). */
export async function getCiroTotal(): Promise<Decimal> {
  const sevk = await prisma.shipmentItem.findMany({ where: sayilanBelgeler.sevkSatiri, select: SEVK_SATIRI });
  return hesaplaSatirTutarlari(sevk.map(girdi)).toplam.matrah;
}
