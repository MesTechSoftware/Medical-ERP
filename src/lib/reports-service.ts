import Decimal from "decimal.js";
import { Prisma } from "@/generated/prisma/client";
import type { Role } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { hesaplaSatirTutarlari, type SatirGirdisi } from "@/lib/satir-tutarlari";
import { sayilanBelgeler } from "@/lib/sayilan-belgeler";

/**
 * Raporlar (FR-62, FR-63). Tahsilat oranı C4'te söküldü — kalıcı (X-1 §(1)).
 *
 * Ciro daima MATRAHTIR (KDV hariç) ve SEVK EDİLEN maldan doğar (A-3, Ü-3 §(5)):
 * sevkiyat satırı × sipariş satırının donmuş fiyatı, `hesaplaSatirTutarlari()` ile.
 * Tahsilat daima BRÜTTÜR (Ü-3 §(4)); veritabanında `SUM()` ile alınır.
 * Sevk satırları yalnız sayılan belgeler filtresiyle okunur (A-5, X-1 §(5)).
 * Dönem zorunlu, yarı açık aralıktır (X-1 §(2)/(3)); ekseni belge tarihidir (§(4)):
 * ciro → sevkiyat anı, tahsilat → tahsilat anı.
 */

export type Donem = { baslangic: Date; bitis: Date };

const SEVK_SATIRI = {
  quantity: true,
  commissionRate: true,
  orderItem: { select: { listPrice: true, unitPrice: true, vatRate: true, isFree: true } },
} as const;

type SevkSatiri = {
  quantity: number;
  commissionRate: Decimal.Value | null;
  orderItem: { listPrice: Decimal.Value; unitPrice: Decimal.Value; vatRate: Decimal.Value; isFree: boolean };
};

function girdi(s: SevkSatiri): SatirGirdisi {
  return {
    birimFiyat: s.orderItem.unitPrice,
    listeFiyat: s.orderItem.listPrice,
    kdvOrani: s.orderItem.vatRate,
    miktar: s.quantity,
    bedelsiz: s.orderItem.isFree,
    primOrani: s.commissionRate,
  };
}

/** Dönemdeki sayılan sevk satırları — ciro ve hakedişin tek okuma yolu. */
function donemSevkSatiri(donem: Donem): Prisma.ShipmentItemWhereInput {
  return { AND: [sayilanBelgeler.sevkSatiri, { shipment: { shippedAt: { gte: donem.baslangic, lt: donem.bitis } } }] };
}

export type SellerReport = {
  sellerId: string;
  name: string;
  ciro: Decimal; // matrah
  hakedis: Decimal; // matrah × donmuş oran (X-14 §(4))
  tahsilat: Decimal; // brüt
  ortalamaIskonto: Decimal | null; // %
  doktorSayisi: number;
};

/**
 * Satıcı raporu (X-1, D-2 §(4)) — servis katmanının ilk test edilen fonksiyonu (X-1 §(9)).
 * Yetki SORGUDADIR (X-1 §(8)): `SATICI` yalnız kendi satırını alır, `OPERASYON` prim
 * raporunu alamaz, `YONETICI` bütün satıcıları alır.
 */
export async function getSellerReports(
  kullanici: { id: string; role: Role },
  donem: Donem
): Promise<SellerReport[]> {
  if (kullanici.role === "OPERASYON") throw new Error("Prim raporu OPERASYON'a kapalıdır (X-1 §(8)).");
  const kapsam = kullanici.role === "SATICI" ? { id: kullanici.id } : {};

  const sellers = await prisma.user.findMany({
    where: { role: "SATICI", ...kapsam },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  const idler = sellers.map((s) => s.id);

  const [sevk, tahsilatlar, doktorlar] = await Promise.all([
    // Ciro ve hakediş siparişin satıcısına yazılır; devir taşımaz (X-13 §(4)).
    prisma.shipmentItem.findMany({
      where: { AND: [donemSevkSatiri(donem), { shipment: { order: { sellerId: { in: idler } } } }] },
      select: { ...SEVK_SATIRI, shipment: { select: { order: { select: { sellerId: true } } } } },
    }),
    donemTahsilatlari(donem, idler),
    prisma.doctor.groupBy({ by: ["ownerSellerId"], where: { ownerSellerId: { in: idler } }, _count: true }),
  ]);

  const saticiSatirlari = new Map<string, SevkSatiri[]>();
  for (const s of sevk) {
    const id = s.shipment.order.sellerId!;
    saticiSatirlari.set(id, [...(saticiSatirlari.get(id) ?? []), s]);
  }

  return sellers.map((s) => {
    const { toplam } = hesaplaSatirTutarlari((saticiSatirlari.get(s.id) ?? []).map(girdi));
    return {
      sellerId: s.id,
      name: s.name,
      ciro: toplam.matrah,
      hakedis: toplam.hakedis,
      tahsilat: new Decimal(tahsilatlar.get(s.id) ?? 0),
      ortalamaIskonto: toplam.iskontoOran,
      doktorSayisi: doktorlar.find((d) => d.ownerSellerId === s.id)?._count ?? 0,
    };
  });
}

/**
 * Dönem tahsilatı, satıcı başına (X-1 17.10 eki). Tahsilat siparişe eşlenmez (X-6);
 * **tahsilat anında doktorun sahibi** olan satıcıya sayılır. Sahip iz kaydından okunur
 * (X-17 §(3)): tahsilattan önceki son iz satırının yeni sahibi; tahsilattan önce iz yoksa
 * ilk iz satırının eski sahibi; doktorun hiç izi yoksa bugünkü sahibi. Sahipsiz doktorun
 * ve `BAYI`'nin tahsilatı kimseye sayılmaz. Toplam veritabanında alınır (X-5 §(4)).
 */
async function donemTahsilatlari(donem: Donem, saticiIdleri: string[]): Promise<Map<string, Decimal.Value>> {
  if (saticiIdleri.length === 0) return new Map();
  const satirlar = await prisma.$queryRaw<{ saticiId: string; toplam: Decimal.Value }[]>`
    SELECT t.sahip AS "saticiId", SUM(t.amount) AS toplam
    FROM (
      SELECT p.amount,
        CASE
          WHEN EXISTS (SELECT 1 FROM "DoctorAssignment" a WHERE a."doctorId" = p."doctorId" AND a."changedAt" <= p."paidAt")
            THEN (SELECT a."toSellerId" FROM "DoctorAssignment" a
                  WHERE a."doctorId" = p."doctorId" AND a."changedAt" <= p."paidAt"
                  ORDER BY a."changedAt" DESC, a."id" DESC LIMIT 1)
          WHEN EXISTS (SELECT 1 FROM "DoctorAssignment" a WHERE a."doctorId" = p."doctorId")
            THEN (SELECT a."fromSellerId" FROM "DoctorAssignment" a
                  WHERE a."doctorId" = p."doctorId"
                  ORDER BY a."changedAt" ASC, a."id" ASC LIMIT 1)
          ELSE d."ownerSellerId"
        END AS sahip
      FROM "DoctorPayment" p
      JOIN "Doctor" d ON d."id" = p."doctorId"
      WHERE p."status" = 'AKTIF' AND p."paidAt" >= ${donem.baslangic} AND p."paidAt" < ${donem.bitis}
    ) t
    WHERE t.sahip IN (${Prisma.join(saticiIdleri)})
    GROUP BY t.sahip`;
  return new Map(satirlar.map((r) => [r.saticiId, r.toplam]));
}

/** Dönemin doktor ciro sıralaması (FR-63). Gecikmiş borç tutarı C3'te söküldü (X-6 §(7)). */
export type DoctorReport = {
  doctorId: string;
  fullName: string;
  sellerName: string | null;
  ciro: Decimal;
};

export async function getDoctorReports(donem: Donem, limit = 50): Promise<DoctorReport[]> {
  const [doctors, sevk] = await Promise.all([
    prisma.doctor.findMany({
      select: { id: true, fullName: true, ownerSeller: { select: { name: true } } },
    }),
    prisma.shipmentItem.findMany({
      where: donemSevkSatiri(donem),
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

/** Dönem cirosu — matrah, sevk edilen mal (A-3, Ü-3 C sınıfı); dönem zorunlu (X-1 §(3)). */
export async function getCiroTotal(donem: Donem): Promise<Decimal> {
  const sevk = await prisma.shipmentItem.findMany({ where: donemSevkSatiri(donem), select: SEVK_SATIRI });
  return hesaplaSatirTutarlari(sevk.map(girdi)).toplam.matrah;
}
