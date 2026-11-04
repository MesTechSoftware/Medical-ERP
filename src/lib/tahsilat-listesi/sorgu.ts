import Decimal from "decimal.js";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { hesaplaDoktorBakiye, type DoktorBakiye } from "@/lib/doctor-cari";
import { metinVaryantlari } from "@/lib/liste/metin";
import { gunleriAraliga } from "@/lib/siparis-listesi/sorgu";
import { BOS_SUZGEC, TIPLER, type TahsilatSuzgeci, type TahsilatTipi } from "@/lib/tahsilat-listesi/suzgec";

/**
 * Tahsilat ekranının sorguları (spec Ü-26 §4). Liste, toplam satırı ve KPI kartları tek koşuldan
 * (`tahsilatKosulu`) sayar: kart = açtığı süzgecin toplamı (A-11-2). Toplamlar veritabanında `SUM` ile
 * alınır (X-5); tutarlar *KDV dahil*.
 */
export function tahsilatKosulu(s: TahsilatSuzgeci): Prisma.DoctorPaymentWhereInput {
  const ve: Prisma.DoctorPaymentWhereInput[] = [];
  if (s.durum === "aktif") ve.push({ status: "AKTIF" });
  if (s.durum === "IPTAL") ve.push({ status: "IPTAL" });
  if (s.baslangic || s.bitis) {
    const a = gunleriAraliga(s);
    ve.push({ paidAt: { gte: a.baslangic, lt: a.bitis } });
  }
  if (s.tip) ve.push({ paymentMethod: { type: s.tip } });
  if (s.q) {
    // Türkçe I/ı varyantları (`metinVaryantlari`): veritabanı yereli ı'yı katlamaz.
    ve.push({
      OR: metinVaryantlari(s.q).flatMap((v) => {
        const icerir = { contains: v, mode: "insensitive" as const };
        return [{ documentNo: icerir }, { referenceNo: icerir }, { doctor: { fullName: icerir } }];
      }),
    });
  }
  return ve.length === 0 ? {} : { AND: ve };
}

export type TahsilatSatiri = {
  id: string;
  documentNo: string;
  paidAt: Date;
  doktorId: string;
  doktor: string;
  yontem: string;
  tip: TahsilatTipi;
  referenceNo: string | null;
  amount: Decimal;
  commissionAmount: Decimal;
  kaydeden: string | null;
  status: "AKTIF" | "IPTAL";
};

const SATIR = {
  id: true,
  documentNo: true,
  paidAt: true,
  doctorId: true,
  referenceNo: true,
  amount: true,
  commissionAmount: true,
  commissionRate: true,
  recordedBy: true,
  status: true,
  note: true,
  createdAt: true,
  cancelledAt: true,
  cancelledBy: true,
  cancelReason: true,
  doctor: { select: { fullName: true } },
  paymentMethod: { select: { name: true, type: true } },
} as const satisfies Prisma.DoctorPaymentSelect;

type Ham = Prisma.DoctorPaymentGetPayload<{ select: typeof SATIR }>;

async function adlar(kimlikler: (string | null)[]): Promise<Map<string, string>> {
  const idler = [...new Set(kimlikler.filter((k): k is string => k !== null))];
  if (idler.length === 0) return new Map();
  const kullanicilar = await prisma.user.findMany({ where: { id: { in: idler } }, select: { id: true, name: true } });
  return new Map(kullanicilar.map((u) => [u.id, u.name]));
}

function satir(p: Ham, ad: Map<string, string>): TahsilatSatiri {
  return {
    id: p.id,
    documentNo: p.documentNo,
    paidAt: p.paidAt,
    doktorId: p.doctorId,
    doktor: p.doctor.fullName,
    yontem: p.paymentMethod.name,
    tip: p.paymentMethod.type,
    referenceNo: p.referenceNo,
    amount: p.amount,
    commissionAmount: p.commissionAmount,
    kaydeden: ad.get(p.recordedBy) ?? null,
    status: p.status,
  };
}

export type Ozet = { tutar: Decimal; adet: number };

async function ozet(where: Prisma.DoctorPaymentWhereInput): Promise<Ozet> {
  const a = await prisma.doctorPayment.aggregate({ where, _sum: { amount: true }, _count: true });
  return { tutar: a._sum.amount ?? new Decimal(0), adet: a._count };
}

/** Liste: satırlar, satır sayısı ve (yalnız aktif süzgeçte) süzgecin bütün sayfalarının toplamı. */
export async function tahsilatListesi(
  s: TahsilatSuzgeci,
  sayfa: { skip: number; take: number }
): Promise<{ satirlar: TahsilatSatiri[]; toplam: number; ozet: Ozet | null }> {
  const where = tahsilatKosulu(s);
  const [hamlar, toplam, o] = await Promise.all([
    prisma.doctorPayment.findMany({ where, orderBy: [{ paidAt: "desc" }, { id: "desc" }], skip: sayfa.skip, take: sayfa.take, select: SATIR }),
    prisma.doctorPayment.count({ where }),
    s.durum === "aktif" ? ozet(where) : null,
  ]);
  const ad = await adlar(hamlar.map((p) => p.recordedBy));
  return { satirlar: hamlar.map((p) => satir(p, ad)), toplam, ozet: o };
}

export type TahsilatKpileri = Record<"toplam" | TahsilatTipi, Ozet>;

/** KPI kartları (spec §3.2): aralıktaki aktif tahsilatlar, toplam ve tip başına; her biri kartın açtığı süzgecin koşulundan. */
export async function tahsilatKpileri(a: { baslangic: string | null; bitis: string | null }): Promise<TahsilatKpileri> {
  const kosul = (tip: TahsilatTipi | null) => tahsilatKosulu({ ...BOS_SUZGEC, baslangic: a.baslangic, bitis: a.bitis, tip });
  const [toplam, NAKIT, BANKA, POS] = await Promise.all([ozet(kosul(null)), ...TIPLER.map((t) => ozet(kosul(t)))]);
  return { toplam, NAKIT, BANKA, POS };
}

export type TahsilatPaneli = TahsilatSatiri & {
  commissionRate: Decimal;
  note: string | null;
  createdAt: Date;
  bakiye: DoktorBakiye;
  iptal: { eden: string | null; zaman: Date; gerekce: string | null } | null;
};

export async function tahsilatPaneli(id: string): Promise<TahsilatPaneli | null> {
  const p = await prisma.doctorPayment.findUnique({ where: { id }, select: SATIR });
  if (!p) return null;
  const [ad, bakiye] = await Promise.all([adlar([p.recordedBy, p.cancelledBy]), hesaplaDoktorBakiye(p.doctorId)]);
  return {
    ...satir(p, ad),
    commissionRate: p.commissionRate,
    note: p.note,
    createdAt: p.createdAt,
    bakiye,
    iptal:
      p.status === "IPTAL" && p.cancelledAt
        ? { eden: p.cancelledBy ? (ad.get(p.cancelledBy) ?? null) : null, zaman: p.cancelledAt, gerekce: p.cancelReason }
        : null,
  };
}
