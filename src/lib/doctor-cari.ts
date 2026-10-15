import Decimal from "decimal.js";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
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

export async function hesaplaDoktorBakiye(doktorId: string, tarih?: Date, db: Db = prisma): Promise<DoktorBakiye> {
  const tarihFiltresi = tarih ? Prisma.sql`AND "createdAt" < ${gunAraligi(tarih).bitis}` : Prisma.empty;
  const [s] = await db.$queryRaw<Satir[]>`
    SELECT COALESCE(SUM(CASE WHEN "direction" = 'BORC' THEN "amount" END), 0) AS borc,
           COALESCE(SUM(CASE WHEN "direction" = 'ALACAK' THEN "amount" END), 0) AS alacak,
           COALESCE(SUM(CASE WHEN "direction" = 'BORC' THEN "amount" ELSE -"amount" END), 0) AS bakiye
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
