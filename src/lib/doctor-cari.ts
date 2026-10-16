import Decimal from "decimal.js";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { sayilanBelgeler } from "@/lib/sayilan-belgeler";
import { SIPARIS_SATIRI, siparisToplami } from "@/lib/siparis";
import { gunAraligi } from "@/lib/zaman";

type Db = Prisma.TransactionClient | typeof prisma;

/**
 * `hesaplaDoktorBakiye(doktor, tarih?)` — cari bakiyenin TEK kaynağı (K-2, tek çağrı
 * noktası listesinin 2. maddesi). Bayi de aynı fonksiyonu kullanır (X-8 §(2)).
 *
 * Bakiye ayrı bir kolonda TUTULMAZ; cari hareketlerin toplamıdır (RULE-08, X-11 §(6)).
 * Bütün hareket tipleri girer — açılış ve vade farkı bakiyenin parçasıdır; sayılan
 * belgeler filtresi burada uygulanmaz. Toplama veritabanında `SUM()` ile yapılır;
 * uygulamada parasal aritmetik yoktur (X-5 §(4)). Tutarlar KDV dahildir (C-6 §(6)).
 *
 * `tarih` verilirse sonuç o günün İstanbul günü sonu itibarıyladır (C-2 §(3), E-1 §(5)).
 * Negatif bakiye avanstır (K-2); ekran çıplak negatif göstermez, `yon` ile etiketler.
 */

export type BakiyeYonu = "BORC" | "ALACAK" | "KAPALI";

export type DoktorBakiye = {
  toplamBorc: Decimal;
  toplamAlacak: Decimal;
  bakiye: Decimal; // işaretli: pozitif = doktor borçlu, negatif = avans
  yon: BakiyeYonu;
};

type Satir = { borc: Prisma.Decimal; alacak: Prisma.Decimal; bakiye: Prisma.Decimal };

/** İşaretli bakiye ifadesi; bakiye de risk de bunu okur. */
const BAKIYE = Prisma.sql`COALESCE(SUM(CASE WHEN "direction" = 'BORC' THEN "amount" ELSE -"amount" END), 0)`;

export async function hesaplaDoktorBakiye(doktorId: string, tarih?: Date, db: Db = prisma): Promise<DoktorBakiye> {
  const tarihFiltresi = tarih ? Prisma.sql`AND "createdAt" < ${gunAraligi(tarih).bitis}` : Prisma.empty;
  const [s] = await db.$queryRaw<Satir[]>`
    SELECT COALESCE(SUM(CASE WHEN "direction" = 'BORC' THEN "amount" END), 0) AS borc,
           COALESCE(SUM(CASE WHEN "direction" = 'ALACAK' THEN "amount" END), 0) AS alacak,
           ${BAKIYE} AS bakiye
    FROM "LedgerEntry"
    WHERE "doctorId" = ${doktorId} ${tarihFiltresi}`;
  const bakiye = new Decimal(s.bakiye);
  return {
    toplamBorc: new Decimal(s.borc),
    toplamAlacak: new Decimal(s.alacak),
    bakiye,
    yon: bakiye.gt(0) ? "BORC" : bakiye.lt(0) ? "ALACAK" : "KAPALI",
  };
}

/**
 * `hesaplaDoktorRisk(doktor)` — kredi riskinin TEK kaynağı (A-12, tek çağrı noktası
 * listesinin 3. maddesi).
 *
 * Risk = cari bakiye + açık sipariş tutarı. Açık sipariş sayılan sipariş kümesidir
 * (`ONAYLI`, iptal edilmemiş); yalnız sevk edilmemiş miktar girer. Taban brüttür (C-6):
 * satır tutarı `siparisToplami()` → `hesaplaSatirTutarlari()`'dan gelir, bedelsiz satır 0'dır.
 * Eşleştirme kullanılmaz (X-11 §(8)). Toplama veritabanındadır (X-5 §(4)).
 *
 * Limit aşımı bilgi kademesidir (§0.3): fonksiyon işlemi durdurmaz, `limitAsildi` döner.
 */

export type DoktorRisk = {
  bakiye: Decimal;
  acikSiparis: Decimal;
  risk: Decimal;
  krediLimiti: Decimal | null; // null = limitsiz
  limitAsildi: boolean;
};

export async function hesaplaDoktorRisk(doktorId: string, db: Db = prisma): Promise<DoktorRisk> {
  const [doktor, satirlar] = await Promise.all([
    db.doctor.findUniqueOrThrow({ where: { id: doktorId }, select: { creditLimit: true } }),
    db.orderItem.findMany({
      where: { order: { ...sayilanBelgeler.siparis, doctorId: doktorId } },
      select: { ...SIPARIS_SATIRI, shipmentItems: { select: { quantity: true } } },
    }),
  ]);
  const acik = siparisToplami(
    satirlar
      .map((s) => ({ ...s, quantity: s.quantity - s.shipmentItems.reduce((t, i) => t + i.quantity, 0) }))
      .filter((s) => s.quantity > 0)
  ).toplam;
  const [r] = await db.$queryRaw<{ bakiye: Prisma.Decimal; risk: Prisma.Decimal }[]>`
    SELECT ${BAKIYE} AS bakiye, ${BAKIYE} + ${acik.toFixed(2)}::numeric AS risk
    FROM "LedgerEntry"
    WHERE "doctorId" = ${doktorId}`;
  const risk = new Decimal(r.risk);
  const krediLimiti = doktor.creditLimit === null ? null : new Decimal(doktor.creditLimit);
  return {
    bakiye: new Decimal(r.bakiye),
    acikSiparis: acik,
    risk,
    krediLimiti,
    limitAsildi: krediLimiti !== null && risk.gt(krediLimiti),
  };
}
