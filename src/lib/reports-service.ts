import Decimal from "decimal.js";
import { Prisma } from "@/generated/prisma/client";
import type { Role } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { hesaplaSatirTutarlari, type SatirGirdisi } from "@/lib/satir-tutarlari";
import { sayilanBelgeler } from "@/lib/sayilan-belgeler";
import type { Ay, Kova } from "@/lib/donem";
import { kovalaraBol } from "@/lib/kpi/seri";
import { teknikHataYaz } from "@/lib/hata-kapsulu";
import { siparisToplami } from "@/lib/siparis";

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
  for (const s of satirlar) {
    const k = anahtar(s);
    const grup = m.get(k);
    if (grup) grup.push(s);
    else m.set(k, [s]);
  }
  return m;
}

// --- Ciro okuması -----------------------------------------------------------------------------

/** KPI ve rapor kapsamı — sorgu düzeyinde (X-1 §(8) deseni): şirket geneli ya da satıcının kendi siparişleri. */
export type KpiKapsami = { tur: "sirket" } | { tur: "satici"; saticiId: string };

/** Sayılan sevk ya da iade satırı: belge anı, carisi ve siparişin satıcısı (ciro ve hakediş ona yazılır — X-13). */
export type CiroSatiri = SevkSatiri & { an: Date; doktorId: string; saticiId: string | null };

/**
 * Bir aralığın sayılan sevk ve iade satırları — ciro, hakediş, iskonto ve serilerin tek okuması. Rapor ekranı
 * aynı satırları birden çok hesaba verir (KPI özeti, satıcı raporu, satıcı serisi, doktor sıralaması): satırlar
 * bu hesapların aralıklarını kapsayan tek aralıktan bir kez okunur, her hesap kendi aralığını süzer. Hesap tek
 * yoldur (`hesaplaSatirTutarlari`, KARARLAR §0.4); okuma yalnız tekrarlanmaz.
 */
export type CiroOkumasi = { aralik: Donem; kapsam: KpiKapsami; sevk: CiroSatiri[]; iade: CiroSatiri[] };

/** Hesaplara verilen okuma; söz (Promise) de olabilir — hesabın kendi sorguları okumayla aynı turda başlar. */
export type PaylasilanOkuma = CiroOkumasi | Promise<CiroOkumasi>;

/** Aralıkların hepsini kapsayan en küçük yarı açık aralık. */
export function kapsayanAralik(araliklar: readonly Donem[]): Donem {
  return { baslangic: enErken(araliklar.map((a) => a.baslangic)), bitis: enGec(araliklar.map((a) => a.bitis)) };
}

export async function ciroOku(aralik: Donem, kapsam: KpiKapsami): Promise<CiroOkumasi> {
  const satici = kapsam.tur === "satici" ? kapsam.saticiId : null;
  const [sevk, iade] = await Promise.all([
    prisma.shipmentItem.findMany({
      where: { AND: [donemSevkSatiri(aralik), ...(satici ? [{ shipment: { order: { sellerId: satici } } }] : [])] },
      select: { ...SEVK_SATIRI, shipment: { select: { shippedAt: true, order: { select: { doctorId: true, sellerId: true } } } } },
    }),
    prisma.returnNoteItem.findMany({
      where: { AND: [donemIadeSatiri(aralik), ...(satici ? [{ orderItem: { order: { sellerId: satici } } }] : [])] },
      select: {
        quantity: true,
        commissionRate: true,
        returnNote: { select: { createdAt: true, doctorId: true } },
        orderItem: { select: { ...SEVK_SATIRI.orderItem.select, order: { select: { sellerId: true } } } },
      },
    }),
  ]);
  return {
    aralik,
    kapsam,
    sevk: sevk.flatMap((s) =>
      s.shipment.shippedAt
        ? [{ quantity: s.quantity, commissionRate: s.commissionRate, orderItem: s.orderItem, an: s.shipment.shippedAt, doktorId: s.shipment.order.doctorId, saticiId: s.shipment.order.sellerId }]
        : []
    ),
    iade: iade.map((s) => ({
      quantity: s.quantity,
      commissionRate: s.commissionRate,
      orderItem: s.orderItem,
      an: s.returnNote.createdAt,
      doktorId: s.returnNote.doctorId,
      saticiId: s.orderItem.order.sellerId,
    })),
  };
}

/**
 * Hesabın okuması: verilen okuma aralığı kapsıyorsa ve kapsamı yetiyorsa o, yoksa yeni okuma. Şirket okuması her
 * kapsama yeter (satıcı süzgeci hesapta uygulanır); satıcı okuması yalnız aynı satıcıya.
 */
async function okumaFor(aralik: Donem, kapsam: KpiKapsami, verilen: PaylasilanOkuma | undefined): Promise<CiroOkumasi> {
  if (!verilen) return ciroOku(aralik, kapsam);
  // Paylaşılan okuma düşerse hesap kendi okumasını dener: bir okumanın hatası ekrandaki bütün hesapları birlikte
  // düşürmesin (kart düzeyinde hata alanı, X-3). Kendi okuması da düşerse hata olduğu gibi fırlar.
  const okuma = await Promise.resolve(verilen).catch((hata) => {
    teknikHataYaz(hata, { yol: "ciroOku", kullaniciId: null });
    return null;
  });
  if (okuma === null) return ciroOku(aralik, kapsam);
  const kapsar = okuma.aralik.baslangic <= aralik.baslangic && okuma.aralik.bitis >= aralik.bitis;
  const yeter = okuma.kapsam.tur === "sirket" || (kapsam.tur === "satici" && kapsam.saticiId === okuma.kapsam.saticiId);
  if (!kapsar || !yeter) throw new Error("Ciro okuması hesabın aralığını ya da kapsamını karşılamıyor.");
  return okuma;
}

/** Okumanın aralıktaki (ve kapsamdaki) satırları. */
function aralikta(o: CiroOkumasi, aralik: Donem, kapsam: KpiKapsami = o.kapsam): { sevk: CiroSatiri[]; iade: CiroSatiri[] } {
  const uygun = (r: CiroSatiri) => icinde(r.an, aralik) && (kapsam.tur === "sirket" || r.saticiId === kapsam.saticiId);
  return { sevk: o.sevk.filter(uygun), iade: o.iade.filter(uygun) };
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
  donem: Donem,
  okuma?: PaylasilanOkuma
): Promise<SellerReport[]> {
  if (kullanici.role === "OPERASYON") throw new Error("Prim raporu OPERASYON'a kapalıdır (X-1 §(8)).");
  const satici = kullanici.role === "SATICI";
  const kapsam: KpiKapsami = satici ? { tur: "satici", saticiId: kullanici.id } : { tur: "sirket" };

  const sellers = await prisma.user.findMany({
    where: { role: "SATICI", ...(satici ? { id: kullanici.id } : {}) },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  const idler = sellers.map((s) => s.id);

  const [o, tahsilatlar, doktorlar] = await Promise.all([
    // Ciro ve hakediş siparişin satıcısına yazılır; devir taşımaz (X-13 §(4)). İade de öyle.
    okumaFor(donem, kapsam, okuma),
    donemTahsilatlari(donem, idler),
    prisma.doctor.groupBy({ by: ["ownerSellerId"], where: { ownerSellerId: { in: idler } }, _count: true }),
  ]);
  const { sevk, iade } = aralikta(o, donem, kapsam);
  const saticiSevk = grupla(sevk, (s) => s.saticiId ?? "");
  const saticiIade = grupla(iade, (s) => s.saticiId ?? "");

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
 * FR-61: satıcının bütün siparişlerinde ortalama iskonto (tutar ağırlıklı) — tek hesap `siparisToplami`. Siparişler
 * sayılan siparişlerdir (`sayilanBelgeler.siparis`: teklif ve iptal hariç — A-5, X-6 §(9)).
 *
 * İskonto `Σ liste×adet` ile `Σ birim×adet`'ten türer; satır başına yuvarlama girmez. Bu yüzden kalemler aynı
 * fiyat çiftinde gruplanıp adetleri veritabanında toplanır (X-5 §(4)) ve gruplar aynı fonksiyona verilir:
 * bütün geçmiş belleğe okunmaz, sonuç kalem kalem hesapla aynıdır.
 */
export async function saticiOrtalamaIskontosu(saticiId: string): Promise<Decimal | null> {
  const gruplar = await prisma.orderItem.groupBy({
    by: ["listPrice", "unitPrice", "vatRate", "isFree"],
    where: { order: { ...sayilanBelgeler.siparis, sellerId: saticiId } },
    _sum: { quantity: true },
  });
  return siparisToplami(gruplar.map((g) => ({ ...g, quantity: g._sum.quantity ?? 0 })).filter((g) => g.quantity > 0)).iskontoOran;
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
 * Dönemde cirosu sıfırdan farklı carilerin raporu, sıralı (doktor sıralaması — X-1-2). Yalnız bu cariler okunur.
 * `kapsam` zorunludur (KPI'larla aynı `KpiKapsami`, X-1 §(8) deseni): satıcı kapsamında ciro yalnız o satıcının
 * siparişlerinin sevk ve iadesidir (hakediş gibi siparişin satıcısına yazılır — X-13); devirle portföyden çıkmış
 * cari de listededir, cirosu onundur.
 */
export async function ciroluDoktorRaporlari(donem: Donem, kapsam: KpiKapsami, okuma?: PaylasilanOkuma): Promise<DoctorReport[]> {
  const cirolar = await doktorCirolari(donem, kapsam, okuma);
  const idler = [...cirolar].filter(([, ciro]) => !ciro.isZero()).map(([id]) => id);
  if (idler.length === 0) return [];
  const doctors = await prisma.doctor.findMany({ where: { id: { in: idler } }, select: DOKTOR_RAPOR_SECIMI });
  return siraliDoktorRaporlari(doctors, cirolar);
}

const DOKTOR_RAPOR_SECIMI = { id: true, fullName: true, ownerSellerId: true, ownerSeller: { select: { name: true } } } as const;

/** Cari başına dönem cirosu (matrah, sevk − iade); sevk siparişin, iade iade belgesinin carisine yazılır. */
async function doktorCirolari(donem: Donem, kapsam: KpiKapsami, okuma?: PaylasilanOkuma): Promise<Map<string, Decimal>> {
  const { sevk, iade } = aralikta(await okumaFor(donem, kapsam, okuma), donem, kapsam);
  const doktorSevk = grupla(sevk, (s) => s.doktorId);
  const doktorIade = grupla(iade, (s) => s.doktorId);
  const idler = [...new Set([...doktorSevk.keys(), ...doktorIade.keys()])];
  return new Map(idler.map((id) => [id, net(doktorSevk.get(id) ?? [], doktorIade.get(id) ?? []).matrah]));
}

function siraliDoktorRaporlari(
  doctors: { id: string; fullName: string; ownerSellerId: string | null; ownerSeller: { name: string } | null }[],
  cirolar: Map<string, Decimal>
): DoctorReport[] {
  const rows = doctors.map((d) => ({
    doctorId: d.id,
    fullName: d.fullName,
    sellerId: d.ownerSellerId,
    sellerName: d.ownerSeller?.name ?? null,
    ciro: cirolar.get(d.id) ?? new Decimal(0),
  }));
  // Eşit ciroda ada, sonra kimliğe göre: sıra numarası istekten isteğe ve sayfadan sayfaya kaymasın (Ü-27).
  rows.sort((a, b) => b.ciro.comparedTo(a.ciro) || a.fullName.localeCompare(b.fullName, "tr") || a.doctorId.localeCompare(b.doctorId));
  return rows;
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

export type CiroToplami = {
  ciro: Decimal; // matrah, sevk − iade
  hakedis: Decimal; // matrah × donmuş oran
  iade: Decimal; // dönemde iade edilen matrah (pozitif)
};

const enErken = (tarihler: Date[]) => new Date(Math.min(...tarihler.map((t) => t.getTime())));
const enGec = (tarihler: Date[]) => new Date(Math.max(...tarihler.map((t) => t.getTime())));
const icinde = (an: Date, aralik: Donem) => an >= aralik.baslangic && an < aralik.bitis;

function toplamlar(sevk: SevkSatiri[], iade: SevkSatiri[]): CiroToplami {
  const n = net(sevk, iade);
  return { ciro: n.matrah, hakedis: n.hakedis, iade: hesaplaSatirTutarlari(iade.map(girdi)).toplam.matrah };
}

/**
 * KPI ciro özeti: kova (gün, hafta ya da ay) ciro serisi ve seçili dönemle karşılaştırma döneminin
 * toplamları.
 * Satırlar aralıkların birleşiminden BİR KEZ okunur ve bölünür (ekran başka hesaplarla paylaşıyorsa `okuma`
 * verilir); hesap `getCiroTotal()` ile aynı yoldur (`hesaplaSatirTutarlari()` — ikinci hesap yolu yok, KARARLAR §0.4).
 */
export async function ciroOzeti(
  g: { kovalar: readonly Kova[]; simdi: Donem; onceki: Donem | null },
  kapsam: KpiKapsami,
  okuma?: PaylasilanOkuma
): Promise<{ seri: Decimal[]; simdi: CiroToplami; onceki: CiroToplami | null }> {
  const aralik = ciroOzetiAraligi(g);
  const { sevk, iade } = aralikta(await okumaFor(aralik, kapsam, okuma), aralik, kapsam);
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

/** Ciro özetinin okuma aralığı: kovalar, seçili ve karşılaştırma dönemi. */
export function ciroOzetiAraligi(g: { kovalar: readonly Kova[]; simdi: Donem; onceki: Donem | null }): Donem {
  return kapsayanAralik([g.kovalar[0].aralik, g.kovalar[g.kovalar.length - 1].aralik, g.simdi, ...(g.onceki ? [g.onceki] : [])]);
}

/** Satıcı başına aylık ciro serisi (rapor tablosunun "Son 6 ay" hücresi) — ekranın şirket okumasından; ayrı sorgu yok. */
export async function saticiCiroSerileri(aylar: readonly Ay[], saticiIdleri: string[], okuma: PaylasilanOkuma): Promise<Map<string, Decimal[]>> {
  if (saticiIdleri.length === 0) return new Map();
  const aralik = kapsayanAralik(aylar.map((a) => a.aralik));
  const { sevk, iade } = aralikta(await okumaFor(aralik, { tur: "sirket" }, okuma), aralik);
  const saticiSevk = grupla(sevk, (s) => s.saticiId ?? "");
  const saticiIade = grupla(iade, (s) => s.saticiId ?? "");
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
