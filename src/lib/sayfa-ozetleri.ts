import type Decimal from "decimal.js";
import type { Role } from "@/generated/prisma/enums";
import { EKSIK_FATURA_BILGISI } from "@/lib/cari";
import { prisma } from "@/lib/db";
import type { Aralik } from "@/lib/donem";
import { belgeOnayDurumlari } from "@/lib/onay-blogu";
import { enCokSevkEdilenler, getDoctorReports, getSellerReports } from "@/lib/reports-service";
import { SAHIPSIZ_DOKTOR } from "@/lib/sahiplik";
import { sayilanBelgeler } from "@/lib/sayilan-belgeler";
import { hesaplaStok } from "@/lib/stok";
import { stokDurumu } from "@/lib/stok-durumu";
import { gunAraligi, simdi } from "@/lib/zaman";

/**
 * Dashboard'daki sayfa özetleri: menüdeki her sayfa için birkaç sayı. Her okuma mevcut tek çağrı
 * noktalarından yapılır (stok `hesaplaStok`, sayılan sipariş `sayilanBelgeler`, cari süzgeçleri
 * `SAHIPSIZ_DOKTOR` / `EKSIK_FATURA_BILGISI`, raporlar `reports-service`). Yalnız yöneticinin
 * sayfaları OPERASYON'da hiç okunmaz (`gorunurOzetler`, components/menu.ts). Dashboard prim/hakediş taşımaz (D-2).
 */

export async function siparisOzeti(ay: Aralik) {
  const [bekliyor, hazirlaniyor, buAy] = await Promise.all([
    prisma.order.count({ where: { status: "BEKLIYOR" } }),
    prisma.order.count({ where: { status: "HAZIRLANIYOR" } }),
    prisma.order.count({ where: { AND: [sayilanBelgeler.siparis, { orderDate: { gte: ay.baslangic, lt: ay.bitis } }] } }),
  ]);
  return { bekliyor, hazirlaniyor, buAy };
}

export async function kargoOzeti(ay: Aralik) {
  const hazirlanan = await prisma.order.findMany({ where: { status: "HAZIRLANIYOR" }, select: { id: true } });
  const [onay, yolda, enCok] = await Promise.all([
    belgeOnayDurumlari("SIP", hazirlanan.map((o) => o.id)),
    prisma.order.count({ where: { status: "KARGOLANDI" } }),
    enCokSevkEdilenler(ay, 3),
  ]);
  const onayda = [...onay.values()].filter((d) => d === "BEKLIYOR").length;
  return { kargolanacak: hazirlanan.length, onayda, yolda, enCok };
}

export async function onayOzeti() {
  const [bekleyen, enEski] = await Promise.all([
    prisma.approvalBlock.count({ where: { decision: null } }),
    prisma.approvalBlock.findFirst({ where: { decision: null }, orderBy: { openedAt: "asc" }, select: { openedAt: true } }),
  ]);
  return { bekleyen, enEski: enEski?.openedAt ?? null };
}

/** Stok hareketlerden türer (B-4, ADR-005); seviye `stokDurumu()` (tükendi = hata, kritik = uyarı). */
export async function stokOzeti() {
  const urunler = await prisma.product.findMany({ where: { status: "AKTIF" }, select: { id: true, name: true, code: true } });
  const stoklu = await Promise.all(urunler.map(async (u) => ({ ...u, stok: await hesaplaStok(u.id) })));
  const dikkat = stoklu.filter((u) => stokDurumu(u.stok) !== null).sort((a, b) => a.stok - b.stok);
  return {
    tukendi: dikkat.filter((u) => stokDurumu(u.stok)?.ton === "hata").length,
    kritik: dikkat.filter((u) => stokDurumu(u.stok)?.ton === "uyari").length,
    enDusuk: dikkat.slice(0, 5),
  };
}

export async function urunOzeti() {
  const [aktif, pasif] = await Promise.all([
    prisma.product.count({ where: { status: "AKTIF" } }),
    prisma.product.count({ where: { status: { not: "AKTIF" } } }),
  ]);
  return { aktif, pasif };
}

export async function doktorOzeti() {
  const [aktif, sahipsiz, faturaEksik] = await Promise.all([
    prisma.doctor.count({ where: { status: "AKTIF" } }),
    prisma.doctor.count({ where: SAHIPSIZ_DOKTOR }),
    prisma.doctor.count({ where: EKSIK_FATURA_BILGISI }),
  ]);
  return { aktif, sahipsiz, faturaEksik };
}

export async function tahsilatOzeti(ay: Aralik) {
  const [buAy, son] = await Promise.all([
    prisma.doctorPayment.count({ where: { status: "AKTIF", paidAt: { gte: ay.baslangic, lt: ay.bitis } } }),
    prisma.doctorPayment.findFirst({
      where: { status: "AKTIF" },
      orderBy: { paidAt: "desc" },
      select: { paidAt: true, amount: true, doctor: { select: { fullName: true } } },
    }),
  ]);
  return { buAy, son: son ? { an: son.paidAt, tutar: son.amount, doktor: son.doctor.fullName } : null };
}

export async function fiyatListesiOzeti() {
  const [liste, atanmisCari] = await Promise.all([
    prisma.priceList.count(),
    prisma.doctor.count({ where: { priceListId: { not: null } } }),
  ]);
  return { liste, atanmisCari };
}

export async function kullaniciOzeti() {
  const gruplar = await prisma.user.groupBy({ by: ["role", "isActive"], _count: { _all: true } });
  const say = (kosul: (g: (typeof gruplar)[number]) => boolean) =>
    gruplar.filter(kosul).reduce((t, g) => t + g._count._all, 0);
  return {
    satici: say((g) => g.isActive && g.role === "SATICI"),
    operasyon: say((g) => g.isActive && g.role === "OPERASYON"),
    yonetici: say((g) => g.isActive && g.role === "YONETICI"),
    pasif: say((g) => !g.isActive),
  };
}

/**
 * Raporların özeti — yalnız yönetici. Ciro raporla aynı yoldan (`getSellerReports`,
 * `getDoctorReports`); dashboard hakediş taşımaz (D-2), yalnız ciro döner.
 */
export async function raporOzeti(yonetici: { id: string; role: Role }, ay: Aralik) {
  const [saticilar, doktorlar] = await Promise.all([getSellerReports(yonetici, ay), getDoctorReports(ay, 1)]);
  const lider = saticilar.reduce<(typeof saticilar)[number] | null>((en, s) => (en === null || s.ciro.gt(en.ciro) ? s : en), null);
  const doktor = doktorlar[0];
  return {
    lider: lider && lider.ciro.gt(0) ? { ad: lider.name, ciro: lider.ciro as Decimal } : null,
    doktor: doktor && doktor.ciro.gt(0) ? { ad: doktor.fullName, ciro: doktor.ciro as Decimal } : null,
  };
}

export async function denetimOzeti() {
  const gun = gunAraligi(simdi());
  const [bugun, son] = await Promise.all([
    prisma.auditLog.count({ where: { createdAt: { gte: gun.baslangic, lt: gun.bitis } } }),
    prisma.auditLog.findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true, action: true } }),
  ]);
  return { bugun, son };
}

export async function iceAktarimOzeti(ay: Aralik) {
  const [son, buAy] = await Promise.all([
    prisma.importBatch.findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true, dataType: true, revertedAt: true } }),
    prisma.importBatch.count({ where: { createdAt: { gte: ay.baslangic, lt: ay.bitis } } }),
  ]);
  return { son, buAy };
}
