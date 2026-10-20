import type { Prisma } from "@/generated/prisma/client";
import { uretBelgeNo } from "@/lib/belge-no";
import { IsHatasi } from "@/lib/hata";
import { blokKontrolleriniCalistir, type BlokIhlali } from "@/lib/onay-blogu";
import { sert, yumusak } from "@/lib/sonuc";
import { negatifStokOnizle, stokHareketiYaz, varsayilanDepoId, type StokHareketi } from "@/lib/stok";

/**
 * Konum değiştiren stok belgeleri — **mali sonucu yoktur** (A-4, B-4, B-7 §(3)): cariye, ciroya,
 * prime ve riske girmez; sayılan stok hareketi değildir (`sayilanBelgeler.stokHareketi`).
 *
 * - `KonsinyeCikis` (`KNS`, A-4): malı depodan **doktorun konsinye konumuna** taşır. Konum doktor
 *   başına tektir, ilk çıkışta açılır (A-4 eki 20.10.2026).
 * - `StokTransfer` (`TRF`, B-4): konumdan **depoya** taşır. Kullanılan konsinye mal depoya
 *   transferle alınır, sonra normal sipariş ve sevkiyatla satılır (A-4 eki: satış depodan).
 *
 * Negatif stok (A-4 eki 20.10.2026): kaynak konum eksiye düşecekse yalnız `YONETICI` gerekçeyle
 * geçer — blok belgeye aynı işlemde `ONAY` ile yazılır, iz kalır. Diğer rol `SERT` alır: onaya
 * gönderilecek ayrı bir belge yoktur. Kilit sırası: ürün → belge sayacı (ADR-008 §(1)).
 */

type Kalem = { urunId: string; miktar: number };
type Yapan = { id: string; rol: "YONETICI" | "OPERASYON" | "SATICI" };

function kalemleriDenetle(kalemler: readonly Kalem[]): Kalem[] {
  const dolu = kalemler.filter((k) => k.miktar !== 0);
  if (dolu.length === 0 || dolu.some((k) => !Number.isInteger(k.miktar) || k.miktar < 0 || !k.urunId)) {
    throw new IsHatasi([sert("TRANSFER_KALEMI_YOK")]);
  }
  return dolu;
}

/**
 * Kaynaktan hedefe hareketler: önce negatif stok kapısı (yazımdan önce, kilit altında), sonra
 * belge, sonra hareketler ve gerekirse onaylı blok.
 */
async function tasi(
  tx: Prisma.TransactionClient,
  g: {
    onek: "KNS" | "TRF";
    kaynakId: string;
    hedefId: string;
    kalemler: Kalem[];
    yapan: Yapan;
    gerekce: string | null;
    belgeYaz: (documentNo: string) => Promise<{ id: string }>;
    bag: (belgeId: string) => Pick<StokHareketi, "consignmentIssueId" | "stockTransferId">;
    not: string;
  }
): Promise<{ belgeId: string; documentNo: string }> {
  const urunler = await tx.product.findMany({
    where: { id: { in: g.kalemler.map((k) => k.urunId) } },
    select: { id: true, name: true },
  });
  if (urunler.length !== new Set(g.kalemler.map((k) => k.urunId)).size) throw new IsHatasi([sert("URUN_BULUNAMADI")]);
  const ad = new Map(urunler.map((u) => [u.id, u.name]));

  const hareketler = (bag: ReturnType<typeof g.bag> | object): StokHareketi[] =>
    g.kalemler.flatMap((k) => [
      { productId: k.urunId, locationId: g.kaynakId, type: "CIKIS" as const, quantity: k.miktar, note: g.not, ...bag },
      { productId: k.urunId, locationId: g.hedefId, type: "GIRIS" as const, quantity: k.miktar, note: g.not, ...bag },
    ]);

  const ihlaller: BlokIhlali[] = (await negatifStokOnizle(tx, hareketler({}))).map((n) => ({
    kuralKodu: n.kuralKodu,
    parametreler: { urun: ad.get(n.urunId) ?? "", sonra: n.sonra },
  }));
  const gerekce = g.gerekce?.trim() || null;
  if (ihlaller.length > 0) {
    if (g.yapan.rol !== "YONETICI") {
      throw new IsHatasi(ihlaller.map((i) => sert("NEGATIF_STOK_YONETICI_GEREKIR", i.parametreler)));
    }
    if (!gerekce) throw new IsHatasi(ihlaller.map((i) => yumusak(i.kuralKodu, i.parametreler)));
  }

  const documentNo = await uretBelgeNo(g.onek, tx);
  const belge = await g.belgeYaz(documentNo);
  await stokHareketiYaz(tx, hareketler(g.bag(belge.id)));
  // Yönetici gerekçesi: blok aynı işlemde ONAY'la yazılır (A-8-5); ihlal yoksa hiçbir şey yazmaz.
  await blokKontrolleriniCalistir(tx, { belgeTipi: g.onek, belgeId: belge.id, ihlaller, yapan: g.yapan, gerekce });
  return { belgeId: belge.id, documentNo };
}

/** Doktorun konsinye konumu; yoksa açılır (doktor başına tek — DB `UNIQUE`). */
export async function konsinyeKonumu(tx: Prisma.TransactionClient, doktorId: string): Promise<string> {
  const doktor = await tx.doctor.findUnique({ where: { id: doktorId }, select: { id: true, fullName: true } });
  if (!doktor) throw new IsHatasi([sert("DOKTOR_KAPSAM_DISI", {}, "doctorId")]);
  const konum = await tx.stockLocation.upsert({
    where: { doctorId: doktor.id },
    create: { code: `KONSINYE-${doktor.id}`, name: `Konsinye — ${doktor.fullName}`, type: "KONSINYE", doctorId: doktor.id },
    update: {},
    select: { id: true },
  });
  return konum.id;
}

export async function konsinyeCikisYaz(
  tx: Prisma.TransactionClient,
  g: { doktorId: string; kalemler: readonly Kalem[]; yapan: Yapan; gerekce: string | null }
): Promise<{ belgeId: string; documentNo: string }> {
  const kalemler = kalemleriDenetle(g.kalemler);
  const kaynakId = await varsayilanDepoId(tx);
  const hedefId = await konsinyeKonumu(tx, g.doktorId);
  return tasi(tx, {
    onek: "KNS",
    kaynakId,
    hedefId,
    kalemler,
    yapan: g.yapan,
    gerekce: g.gerekce,
    not: "Konsinye çıkış",
    belgeYaz: (documentNo) =>
      tx.consignmentIssue.create({
        data: {
          documentNo,
          doctorId: g.doktorId,
          fromLocationId: kaynakId,
          toLocationId: hedefId,
          createdById: g.yapan.id,
          items: { create: kalemler.map((k) => ({ productId: k.urunId, quantity: k.miktar })) },
        },
        select: { id: true },
      }),
    bag: (id) => ({ consignmentIssueId: id }),
  });
}

export async function stokTransferYaz(
  tx: Prisma.TransactionClient,
  g: { kaynakId: string; hedefId: string; kalemler: readonly Kalem[]; yapan: Yapan; gerekce: string | null }
): Promise<{ belgeId: string; documentNo: string }> {
  const kalemler = kalemleriDenetle(g.kalemler);
  const konumlar = await tx.stockLocation.findMany({
    where: { id: { in: [g.kaynakId, g.hedefId] }, isActive: true },
    select: { id: true, type: true },
  });
  const hedef = konumlar.find((k) => k.id === g.hedefId);
  // Hedef depodur: konsinyeye yerleştirme KonsinyeCikis belgesiyle yapılır (A-4).
  if (g.kaynakId === g.hedefId || konumlar.length !== 2 || hedef?.type !== "DEPO") {
    throw new IsHatasi([sert("TRANSFER_KONUMU_GECERSIZ")]);
  }
  return tasi(tx, {
    onek: "TRF",
    kaynakId: g.kaynakId,
    hedefId: g.hedefId,
    kalemler,
    yapan: g.yapan,
    gerekce: g.gerekce,
    not: "Stok transferi",
    belgeYaz: (documentNo) =>
      tx.stockTransfer.create({
        data: {
          documentNo,
          fromLocationId: g.kaynakId,
          toLocationId: g.hedefId,
          createdById: g.yapan.id,
          items: { create: kalemler.map((k) => ({ productId: k.urunId, quantity: k.miktar })) },
        },
        select: { id: true },
      }),
    bag: (id) => ({ stockTransferId: id }),
  });
}
