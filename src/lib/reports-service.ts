import Decimal from "decimal.js";
import { Prisma } from "@/generated/prisma/client";
import type { Role } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { hesaplaSatirTutarlari, type SatirGirdisi } from "@/lib/satir-tutarlari";
import { sayilanBelgeler } from "@/lib/sayilan-belgeler";
import type { Ay, Kova } from "@/lib/donem";
import { kovalaraBol } from "@/lib/kpi/seri";

/**
 * Raporlar (FR-62, FR-63). Tahsilat oranı C4'te söküldü — kalıcı (X-1 §(1)).
 *
 * Ciro daima MATRAHTIR (KDV hariç) ve SEVK EDİLEN maldan doğar (A-3, Ü-3 §(5)):
 * sevkiyat satırı × sipariş satırının donmuş fiyatı, `hesaplaSatirTutarlari()` ile.
 * Tahsilat daima BRÜTTÜR (Ü-3 §(4)); veritabanında `SUM()` ile alınır.
 * Sevk satırları yalnız sayılan belgeler filtresiyle okunur (A-5, X-1 §(5)).
 * Dönem zorunlu, yarı açık aralıktır (X-1 §(2)/(3)); ekseni belge tarihidir (§(4)):
 * ciro → sevkiyat anı, tahsilat → tahsilat anı.
 *
 * İade (A-1 eki 20.10.2026) ciro ve hakedişi **iade tarihinde** düşürür: iade satırı aynı
 * hesapla, iade anında donmuş prim oranıyla eksiye yazılır. Geçmiş dönemin sonucu değişmez
 * (X-1 §(6)). Ortalama iskonto yalnız sevk satırlarından türer.
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

/** Dönemdeki sayılan iade satırları — ekseni iade belgesinin tarihidir (X-1 §(4)/(6)). */
function donemIadeSatiri(donem: Donem): Prisma.ReturnNoteItemWhereInput {
  return { AND: [sayilanBelgeler.iadeSatiri, { returnNote: { createdAt: { gte: donem.baslangic, lt: donem.bitis } } }] };
}

/** Sevk eksi iade: iade satırı ters satırdır (matrah ve hakediş düşer, iskontoya girmez). */
function net(sevk: SevkSatiri[], iade: SevkSatiri[]) {
  return hesaplaSatirTutarlari([...sevk.map(girdi), ...iade.map((s) => ({ ...girdi(s), ters: true }))]).toplam;
}

function grupla<T>(satirlar: T[], anahtar: (s: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const s of satirlar) m.set(anahtar(s), [...(m.get(anahtar(s)) ?? []), s]);
  return m;
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

  const [sevk, iade, tahsilatlar, doktorlar] = await Promise.all([
    // Ciro ve hakediş siparişin satıcısına yazılır; devir taşımaz (X-13 §(4)). İade de öyle.
    prisma.shipmentItem.findMany({
      where: { AND: [donemSevkSatiri(donem), { shipment: { order: { sellerId: { in: idler } } } }] },
      select: { ...SEVK_SATIRI, shipment: { select: { order: { select: { sellerId: true } } } } },
    }),
    prisma.returnNoteItem.findMany({
      where: { AND: [donemIadeSatiri(donem), { orderItem: { order: { sellerId: { in: idler } } } }] },
      select: {
        quantity: true,
        commissionRate: true,
        orderItem: { select: { ...SEVK_SATIRI.orderItem.select, order: { select: { sellerId: true } } } },
      },
    }),
    donemTahsilatlari(donem, idler),
    prisma.doctor.groupBy({ by: ["ownerSellerId"], where: { ownerSellerId: { in: idler } }, _count: true }),
  ]);

  const saticiSevk = grupla(sevk, (s) => s.shipment.order.sellerId!);
  const saticiIade = grupla(iade, (s) => s.orderItem.order.sellerId!);

  return sellers.map((s) => {
    const toplam = net(saticiSevk.get(s.id) ?? [], saticiIade.get(s.id) ?? []);
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
  /** Carinin bugünkü sahibi (Raporlar'ın satıcı süzgeci, Ü-27). */
  sellerId: string | null;
  sellerName: string | null;
  ciro: Decimal;
};

/**
 * `kapsam` zorunludur (KPI'larla aynı `KpiKapsami`, X-1 §(8) deseni): satıcı kapsamında ciro yalnız o satıcının
 * siparişlerinin sevk ve iadesidir (hakediş gibi siparişin satıcısına yazılır — X-13) ve cari listesi o satıcının
 * sipariş girdiği carilerle sınırlıdır (devirle portföyden çıkmış cari de, cirosu onundur).
 */
export async function getDoctorReports(donem: Donem, limit: number, kapsam: KpiKapsami): Promise<DoctorReport[]> {
  const satici = kapsam.tur === "satici" ? kapsam.saticiId : null;
  const [doctors, sevk, iade] = await Promise.all([
    prisma.doctor.findMany({
      where: satici ? { orders: { some: { sellerId: satici } } } : {},
      select: { id: true, fullName: true, ownerSellerId: true, ownerSeller: { select: { name: true } } },
    }),
    prisma.shipmentItem.findMany({
      where: { AND: [donemSevkSatiri(donem), ...(satici ? [{ shipment: { order: { sellerId: satici } } }] : [])] },
      select: { ...SEVK_SATIRI, shipment: { select: { order: { select: { doctorId: true } } } } },
    }),
    prisma.returnNoteItem.findMany({
      where: { AND: [donemIadeSatiri(donem), ...(satici ? [{ orderItem: { order: { sellerId: satici } } }] : [])] },
      select: { ...SEVK_SATIRI, returnNote: { select: { doctorId: true } } },
    }),
  ]);

  const doktorSevk = grupla(sevk, (s) => s.shipment.order.doctorId);
  const doktorIade = grupla(iade, (s) => s.returnNote.doctorId);

  const rows = doctors.map((d) => ({
    doctorId: d.id,
    fullName: d.fullName,
    sellerId: d.ownerSellerId,
    sellerName: d.ownerSeller?.name ?? null,
    ciro: net(doktorSevk.get(d.id) ?? [], doktorIade.get(d.id) ?? []).matrah,
  }));

  // Eşit ciroda ada, sonra kimliğe göre: sıra numarası istekten isteğe ve sayfadan sayfaya kaymasın (Ü-27).
  rows.sort((a, b) => b.ciro.comparedTo(a.ciro) || a.fullName.localeCompare(b.fullName, "tr") || a.doctorId.localeCompare(b.doctorId));
  return rows.slice(0, limit);
}

/** Dönem cirosu — matrah, sevk edilen eksi iade edilen mal (A-3, A-1, Ü-3 C sınıfı); dönem zorunlu (X-1 §(3)). */
export async function getCiroTotal(donem: Donem): Promise<Decimal> {
  const [sevk, iade] = await Promise.all([
    prisma.shipmentItem.findMany({ where: donemSevkSatiri(donem), select: SEVK_SATIRI }),
    prisma.returnNoteItem.findMany({ where: donemIadeSatiri(donem), select: SEVK_SATIRI }),
  ]);
  return net(sevk, iade).matrah;
}

// --- KPI (tasarım 2. tur, ADR-010) -----------------------------------------------------------

/** KPI kapsamı — sorgu düzeyinde (X-1 §(8) deseni): şirket geneli ya da satıcının kendi siparişleri. */
export type KpiKapsami = { tur: "sirket" } | { tur: "satici"; saticiId: string };

export type CiroToplami = {
  ciro: Decimal; // matrah, sevk − iade
  hakedis: Decimal; // matrah × donmuş oran
  iade: Decimal; // dönemde iade edilen matrah (pozitif)
};

type ZamanliSatir = SevkSatiri & { an: Date };

const enErken = (tarihler: Date[]) => new Date(Math.min(...tarihler.map((t) => t.getTime())));
const enGec = (tarihler: Date[]) => new Date(Math.max(...tarihler.map((t) => t.getTime())));
const icinde = (an: Date, aralik: Donem) => an >= aralik.baslangic && an < aralik.bitis;

/** Aralığın sayılan sevk ve iade satırları, belge anıyla — ciroyla aynı okuma yolu. */
async function zamanliSatirlar(aralik: Donem, kapsam: KpiKapsami): Promise<{ sevk: ZamanliSatir[]; iade: ZamanliSatir[] }> {
  const saticiSevk: Prisma.ShipmentItemWhereInput[] =
    kapsam.tur === "satici" ? [{ shipment: { order: { sellerId: kapsam.saticiId } } }] : [];
  const saticiIade: Prisma.ReturnNoteItemWhereInput[] =
    kapsam.tur === "satici" ? [{ orderItem: { order: { sellerId: kapsam.saticiId } } }] : [];
  const [sevk, iade] = await Promise.all([
    prisma.shipmentItem.findMany({
      where: { AND: [donemSevkSatiri(aralik), ...saticiSevk] },
      select: { ...SEVK_SATIRI, shipment: { select: { shippedAt: true } } },
    }),
    prisma.returnNoteItem.findMany({
      where: { AND: [donemIadeSatiri(aralik), ...saticiIade] },
      select: { ...SEVK_SATIRI, returnNote: { select: { createdAt: true } } },
    }),
  ]);
  return {
    sevk: sevk.flatMap((s) => (s.shipment.shippedAt ? [{ ...s, an: s.shipment.shippedAt }] : [])),
    iade: iade.map((s) => ({ ...s, an: s.returnNote.createdAt })),
  };
}

function toplamlar(sevk: SevkSatiri[], iade: SevkSatiri[]): CiroToplami {
  const n = net(sevk, iade);
  return { ciro: n.matrah, hakedis: n.hakedis, iade: hesaplaSatirTutarlari(iade.map(girdi)).toplam.matrah };
}

/**
 * KPI ciro özeti: kova (gün, hafta ya da ay) ciro serisi ve seçili dönemle karşılaştırma döneminin
 * toplamları.
 * Satırlar aralıkların birleşiminden BİR KEZ okunur ve bölünür; hesap `getCiroTotal()` ile
 * aynı yoldur (`hesaplaSatirTutarlari()` — ikinci hesap yolu yok, KARARLAR §0.4).
 */
export async function ciroOzeti(
  g: { kovalar: readonly Kova[]; simdi: Donem; onceki: Donem | null },
  kapsam: KpiKapsami
): Promise<{ seri: Decimal[]; simdi: CiroToplami; onceki: CiroToplami | null }> {
  const araliklar = [g.kovalar[0].aralik, g.kovalar[g.kovalar.length - 1].aralik, g.simdi, ...(g.onceki ? [g.onceki] : [])];
  const { sevk, iade } = await zamanliSatirlar(
    { baslangic: enErken(araliklar.map((a) => a.baslangic)), bitis: enGec(araliklar.map((a) => a.bitis)) },
    kapsam
  );
  const sevkKova = kovalaraBol(sevk, g.kovalar, (s) => s.an);
  const iadeKova = kovalaraBol(iade, g.kovalar, (s) => s.an);
  const sec = (aralik: Donem) =>
    toplamlar(
      sevk.filter((s) => icinde(s.an, aralik)),
      iade.filter((s) => icinde(s.an, aralik))
    );
  return {
    seri: g.kovalar.map((_, i) => net(sevkKova[i], iadeKova[i]).matrah),
    simdi: sec(g.simdi),
    onceki: g.onceki ? sec(g.onceki) : null,
  };
}

/** Satıcı başına aylık ciro serisi (rapor tablosunun "Son 6 ay" hücresi) — tek okuma. */
export async function saticiCiroSerileri(aylar: readonly Ay[], saticiIdleri: string[]): Promise<Map<string, Decimal[]>> {
  if (saticiIdleri.length === 0) return new Map();
  const aralik = { baslangic: aylar[0].aralik.baslangic, bitis: aylar[aylar.length - 1].aralik.bitis };
  const [sevk, iade] = await Promise.all([
    prisma.shipmentItem.findMany({
      where: { AND: [donemSevkSatiri(aralik), { shipment: { order: { sellerId: { in: saticiIdleri } } } }] },
      select: { ...SEVK_SATIRI, shipment: { select: { shippedAt: true, order: { select: { sellerId: true } } } } },
    }),
    prisma.returnNoteItem.findMany({
      where: { AND: [donemIadeSatiri(aralik), { orderItem: { order: { sellerId: { in: saticiIdleri } } } }] },
      select: {
        ...SEVK_SATIRI,
        returnNote: { select: { createdAt: true } },
        orderItem: { select: { ...SEVK_SATIRI.orderItem.select, order: { select: { sellerId: true } } } },
      },
    }),
  ]);
  const saticiSevk = grupla(
    sevk.flatMap((s) => (s.shipment.shippedAt ? [{ ...s, an: s.shipment.shippedAt }] : [])),
    (s) => s.shipment.order.sellerId!
  );
  const saticiIade = grupla(
    iade.map((s) => ({ ...s, an: s.returnNote.createdAt })),
    (s) => s.orderItem.order.sellerId!
  );
  return new Map(
    saticiIdleri.map((id) => {
      const sevkKova = kovalaraBol(saticiSevk.get(id) ?? [], aylar, (s) => s.an);
      const iadeKova = kovalaraBol(saticiIade.get(id) ?? [], aylar, (s) => s.an);
      return [id, aylar.map((_, i) => net(sevkKova[i], iadeKova[i]).matrah)];
    })
  );
}

/** Aralık başına tahsilat toplamı (brüt, AKTIF) — tek sorgu, toplam veritabanında (X-5 §(4)). */
export async function tahsilatToplamlari(araliklar: readonly Donem[]): Promise<Decimal[]> {
  if (araliklar.length === 0) return [];
  const sutunlar = araliklar.map(
    (a, i) =>
      Prisma.sql`COALESCE(SUM(CASE WHEN "paidAt" >= ${a.baslangic} AND "paidAt" < ${a.bitis} THEN "amount" END), 0) AS ${Prisma.raw(`"a${i}"`)}`
  );
  const [s] = await prisma.$queryRaw<Record<string, Decimal.Value>[]>`
    SELECT ${Prisma.join(sutunlar)}
    FROM "DoctorPayment"
    WHERE "status" = 'AKTIF'
      AND "paidAt" >= ${enErken(araliklar.map((a) => a.baslangic))}
      AND "paidAt" < ${enGec(araliklar.map((a) => a.bitis))}`;
  return araliklar.map((_, i) => new Decimal(s[`a${i}`]));
}

/**
 * Satıcının dönem tahsilatı ve karşılaştırma dönemininki (Raporum KPI'ı). Atıf `getSellerReports`
 * ile aynı yoldan (`donemTahsilatlari`, X-17 §(3)): tahsilat anında doktorun sahibi olan satıcı.
 */
export async function saticiTahsilatOzeti(
  k: { simdi: Donem; onceki: Donem | null },
  saticiId: string
): Promise<{ simdi: Decimal; onceki: Decimal | null }> {
  const [simdi, onceki] = await Promise.all([
    donemTahsilatlari(k.simdi, [saticiId]),
    k.onceki ? donemTahsilatlari(k.onceki, [saticiId]) : null,
  ]);
  return {
    simdi: new Decimal(simdi.get(saticiId) ?? 0),
    onceki: onceki ? new Decimal(onceki.get(saticiId) ?? 0) : null,
  };
}

/** Aralıkta en çok sevk edilen ürünler (adet; sayılan belgeler). Adet tam sayıdır, para değildir. */
export async function enCokSevkEdilenler(aralik: Donem, adet: number): Promise<{ urunId: string; ad: string; miktar: number }[]> {
  const satirlar = await prisma.shipmentItem.findMany({
    where: donemSevkSatiri(aralik),
    select: { quantity: true, orderItem: { select: { product: { select: { id: true, name: true } } } } },
  });
  const urunler = new Map<string, { urunId: string; ad: string; miktar: number }>();
  for (const s of satirlar) {
    const p = s.orderItem.product;
    const u = urunler.get(p.id) ?? { urunId: p.id, ad: p.name, miktar: 0 };
    u.miktar += s.quantity;
    urunler.set(p.id, u);
  }
  return [...urunler.values()].sort((a, b) => b.miktar - a.miktar || a.ad.localeCompare(b.ad, "tr")).slice(0, adet);
}
