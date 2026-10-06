import Decimal from "decimal.js";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

/**
 * Doktor cari hesabı — TEK KAYNAK.
 *
 * Bakiye ayrı bir kolonda TUTULMAZ; cari hareketlerin toplamıdır (RULE-08, K-2, X-11 §(6)).
 * Toplama veritabanında `SUM()` ile yapılır; uygulamada parasal aritmetik yoktur (X-5 §(4)).
 * Tutarlar KDV dahildir (C-6 §(6)).
 *
 * `CM` → 1B arası `LedgerEntry`'yi yazan akış yoktur; bakiye boş görünür (FAZ1 R-11).
 * 1B madde 1'de bu dosya `hesaplaDoktorBakiye(doktor, tarih?)`'e dönüşür.
 */

export type DoctorCari = {
  toplamBorc: Decimal;
  toplamAlacak: Decimal;
  bakiye: Decimal; // pozitif = doktor borçlu
};

type Satir = { doctorId: string; borc: Prisma.Decimal; alacak: Prisma.Decimal; bakiye: Prisma.Decimal };

async function oku(doctorId?: string): Promise<Satir[]> {
  const filtre = doctorId ? Prisma.sql`WHERE "doctorId" = ${doctorId}` : Prisma.empty;
  return prisma.$queryRaw<Satir[]>`
    SELECT "doctorId",
           COALESCE(SUM(CASE WHEN "direction" = 'BORC' THEN "amount" END), 0) AS borc,
           COALESCE(SUM(CASE WHEN "direction" = 'ALACAK' THEN "amount" END), 0) AS alacak,
           COALESCE(SUM(CASE WHEN "direction" = 'BORC' THEN "amount" ELSE -"amount" END), 0) AS bakiye
    FROM "LedgerEntry"
    ${filtre}
    GROUP BY "doctorId"`;
}

function cevir(s: Satir | undefined): DoctorCari {
  return {
    toplamBorc: new Decimal(s?.borc ?? 0),
    toplamAlacak: new Decimal(s?.alacak ?? 0),
    bakiye: new Decimal(s?.bakiye ?? 0),
  };
}

export async function getDoctorCari(doctorId: string): Promise<DoctorCari> {
  const [satir] = await oku(doctorId);
  return cevir(satir);
}

/** Liste ekranları için tüm doktorların carisi tek seferde. */
export async function getAllDoctorsCari(): Promise<Map<string, DoctorCari>> {
  const satirlar = await oku();
  return new Map(satirlar.map((s) => [s.doctorId, cevir(s)]));
}
