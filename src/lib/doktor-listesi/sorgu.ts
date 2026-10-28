import type Decimal from "decimal.js";
import type { Doctor, Prisma } from "@/generated/prisma/client";
import type { LedgerDirection, LedgerEntryType, OrderStage, OrderStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { EKSIK_FATURA_BILGISI } from "@/lib/cari";
import { hesaplaDoktorRisk, hesaplaDoktorRiskleri, vadesiGecmisUyarisi, type DoktorRisk } from "@/lib/doctor-cari";
import { SAHIPSIZ_DOKTOR } from "@/lib/sahiplik";
import { sayilanBelgeler } from "@/lib/sayilan-belgeler";
import { SIPARIS_SATIRI, siparisToplami } from "@/lib/siparis";
import type { Bildirim } from "@/lib/sonuc";
import { geceYarisi, simdi, takvimGunu, yerelGunAraligi } from "@/lib/zaman";
import { SAHIPSIZ, type DoktorSuzgeci } from "@/lib/doktor-listesi/suzgec";

/**
 * Cari listesinin okumaları (spec Ü-18 §4.2). "Son sipariş" sayılan sipariştir (A-5-7); eksik fatura
 * `EKSIK_FATURA_BILGISI`'dir (A-13-3); risk toplu ve tekli aynı yoldur (A-12-5).
 */

const siparis = sayilanBelgeler.siparis;

/** Son sipariş koşulu; gün sınırları İstanbul günüdür (E-1). */
function sonSiparisKosulu(s: DoktorSuzgeci, an: Date): Prisma.DoctorWhereInput | null {
  if (s.sessiz === "hic") return { orders: { none: siparis } };
  if (s.sessiz !== null) {
    const { yil, ay, gun } = takvimGunu(an);
    // Bugün dahil son N gün: N−1 gün önceki gece yarısından bu yana sayılan sipariş yok.
    const alt = geceYarisi(yil, ay, gun - (parseInt(s.sessiz, 10) - 1));
    return { orders: { none: { ...siparis, orderDate: { gte: alt } } } };
  }
  if (s.sonBas === null && s.sonBit === null) return null;
  const bas = s.sonBas === null ? undefined : yerelGunAraligi(s.sonBas)?.baslangic;
  const bitSonu = s.sonBit === null ? undefined : yerelGunAraligi(s.sonBit)?.bitis;
  // Son siparişi aralıkta: aralıkta en az bir sipariş var ve bitişten sonra yok.
  return {
    AND: [
      { orders: { some: { ...siparis, orderDate: { gte: bas, lt: bitSonu } } } },
      bitSonu ? { orders: { none: { ...siparis, orderDate: { gte: bitSonu } } } } : {},
    ],
  };
}

export function doktorWhere(s: DoktorSuzgeci, an: Date = simdi()): Prisma.DoctorWhereInput {
  const kosullar: Prisma.DoctorWhereInput[] = [];
  if (s.sinif) kosullar.push({ accountClass: s.sinif });
  if (s.bolge) kosullar.push({ region: s.bolge });
  if (s.satici) kosullar.push(s.satici === SAHIPSIZ ? SAHIPSIZ_DOKTOR : { ownerSellerId: s.satici });
  if (s.durum) kosullar.push({ status: s.durum });
  if (s.fatura) kosullar.push(EKSIK_FATURA_BILGISI);
  const son = sonSiparisKosulu(s, an);
  if (son) kosullar.push(son);
  return { AND: kosullar };
}

const LISTE_EKI = {
  ownerSeller: { select: { id: true, name: true } },
  _count: { select: { orders: true } },
} as const satisfies Prisma.DoctorInclude;

export type DoktorSatiri = Prisma.DoctorGetPayload<{ include: typeof LISTE_EKI }> & {
  sonSiparis: Date | null;
  risk: DoktorRisk;
  eksikFatura: boolean;
};

export async function doktorListesi(
  s: DoktorSuzgeci,
  sayfa: { skip: number; take: number },
  an: Date = simdi()
): Promise<{ satirlar: DoktorSatiri[]; toplam: number }> {
  const where = doktorWhere(s, an);
  const [doktorlar, toplam] = await Promise.all([
    prisma.doctor.findMany({ where, orderBy: { fullName: "asc" }, skip: sayfa.skip, take: sayfa.take, include: LISTE_EKI }),
    prisma.doctor.count({ where }),
  ]);
  const idler = doktorlar.map((d) => d.id);
  const [sonlar, riskler, eksikler] = await Promise.all([
    prisma.order.groupBy({ by: ["doctorId"], where: { ...siparis, doctorId: { in: idler } }, _max: { orderDate: true } }),
    hesaplaDoktorRiskleri(idler),
    prisma.doctor.findMany({ where: { AND: [{ id: { in: idler } }, EKSIK_FATURA_BILGISI] }, select: { id: true } }),
  ]);
  const son = new Map(sonlar.map((o) => [o.doctorId, o._max.orderDate]));
  const eksik = new Set(eksikler.map((d) => d.id));
  return {
    satirlar: doktorlar.map((d) => ({
      ...d,
      sonSiparis: son.get(d.id) ?? null,
      risk: riskler.get(d.id)!,
      eksikFatura: eksik.has(d.id),
    })),
    toplam,
  };
}

/** Üst kartlar: süzgeçten bağımsız, bütün cariler. */
export async function doktorKpileri(): Promise<{ toplam: number; aktif: number; sahipsiz: number; eksikFatura: number }> {
  const [toplam, aktif, sahipsiz, eksikFatura] = await Promise.all([
    prisma.doctor.count(),
    prisma.doctor.count({ where: { status: "AKTIF" } }),
    prisma.doctor.count({ where: SAHIPSIZ_DOKTOR }),
    prisma.doctor.count({ where: EKSIK_FATURA_BILGISI }),
  ]);
  return { toplam, aktif, sahipsiz, eksikFatura };
}

export async function doktorSuzgecSecenekleri(): Promise<{ bolgeler: string[]; saticilar: { id: string; name: string }[] }> {
  const [bolgeler, saticilar] = await Promise.all([
    prisma.doctor.findMany({ where: { region: { not: null } }, distinct: ["region"], select: { region: true } }),
    prisma.user.findMany({ where: { role: "SATICI", isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return {
    bolgeler: bolgeler
      .map((b) => b.region!)
      .filter((b) => b.trim() !== "")
      .sort((a, b) => a.localeCompare(b, "tr")),
    saticilar,
  };
}

export type DoktorPaneliVerisi = {
  doktor: Doctor & { ownerSeller: { name: string } | null };
  eksikFatura: boolean;
  risk: DoktorRisk;
  vadeUyarisi: Bildirim | null;
  siparisler: { id: string; documentNo: string; orderDate: Date; stage: OrderStage; status: OrderStatus; toplam: Decimal }[];
  hareketler: {
    id: string;
    createdAt: Date;
    type: LedgerEntryType;
    direction: LedgerDirection;
    amount: Prisma.Decimal;
    documentNo: string;
  }[];
  devirler: { id: string; changedAt: Date; from: string | null; to: string | null }[];
};

/** Yan panelin verisi (spec §3.6); kayıt yoksa `null`. Siparişler detay sayfası gibi bütün siparişlerdir. */
export async function doktorPaneli(id: string): Promise<DoktorPaneliVerisi | null> {
  const doktor = await prisma.doctor.findUnique({ where: { id }, include: { ownerSeller: { select: { name: true } } } });
  if (!doktor) return null;
  const [eksik, risk, vadeUyarisi, siparisler, hareketler, devirler] = await Promise.all([
    prisma.doctor.count({ where: { AND: [{ id }, EKSIK_FATURA_BILGISI] } }),
    hesaplaDoktorRisk(id),
    vadesiGecmisUyarisi(id),
    prisma.order.findMany({
      where: { doctorId: id },
      orderBy: { orderDate: "desc" },
      take: 5,
      select: { id: true, documentNo: true, orderDate: true, stage: true, status: true, items: { select: SIPARIS_SATIRI } },
    }),
    prisma.ledgerEntry.findMany({
      where: { doctorId: id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, createdAt: true, type: true, direction: true, amount: true, documentNo: true },
    }),
    prisma.doctorAssignment.findMany({
      where: { doctorId: id },
      orderBy: { changedAt: "desc" },
      take: 3,
      select: { id: true, changedAt: true, fromSeller: { select: { name: true } }, toSeller: { select: { name: true } } },
    }),
  ]);
  return {
    doktor,
    eksikFatura: eksik > 0,
    risk,
    vadeUyarisi,
    siparisler: siparisler.map(({ items, ...o }) => ({ ...o, toplam: siparisToplami(items).toplam })),
    hareketler,
    devirler: devirler.map((d) => ({ id: d.id, changedAt: d.changedAt, from: d.fromSeller?.name ?? null, to: d.toSeller?.name ?? null })),
  };
}
