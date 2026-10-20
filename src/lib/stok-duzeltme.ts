import type { Prisma } from "@/generated/prisma/client";
import { uretBelgeNo } from "@/lib/belge-no";
import { IsHatasi } from "@/lib/hata";
import { blokKontrolleriniCalistir, type BlokIhlali } from "@/lib/onay-blogu";
import { sert, yumusak, type Bildirim } from "@/lib/sonuc";
import { negatifStokOnizle, stokHareketiYaz, type StokHareketi } from "@/lib/stok";

/**
 * Stok düzeltme — B-7. Belge `StokDuzeltme` (`DZL`), çok satırlı; satır: ürün · konum · ± fark ·
 * sebep (tanım tablosu) · açıklama (zorunlu). Pozitif düzeltme de aynı belgedir (§(8)).
 *
 * - **Yalnız `YONETICI`** (D-2 §(2)); yönetimsel eylemdir: yetki + zorunlu gerekçe + log, düzeltmenin
 *   kendisi için `OnayBlogu` kullanılmaz (§(6)). Log çağıranın denetim kaydıdır.
 * - **Mali sonucu yoktur** (§(3)); sayılan stok hareketi değildir.
 * - Belge tarihi kayıt anıdır, geriye tarihlendirilemez (§(4)) — tarih girdisi yoktur.
 * - Tutanak numarası salt kayıttır (§(5)): doğrulanmaz, tekillik aranmaz.
 * - Negatif stok yumuşak kısıttır (§(7)): gerekçesiz `YUMUSAK`; gerekçeyle belge yazılır ve
 *   `NEGATIF_STOK` bloğu aynı işlemde `ONAY`'lanır (yapan yöneticidir — A-8-5).
 *
 * Kilit sırası: ürün → belge sayacı (ADR-008 §(1)).
 */
export type DuzeltmeKalemi = { urunId: string; konumId: string; fark: number; sebepId: string; aciklama: string };

export async function stokDuzeltmeYaz(
  tx: Prisma.TransactionClient,
  g: {
    kalemler: readonly DuzeltmeKalemi[];
    hariciBelgeNo: string | null;
    yapan: { id: string; rol: "YONETICI" | "OPERASYON" | "SATICI" };
    gerekce: string | null;
  }
): Promise<{ belgeId: string; documentNo: string }> {
  if (g.yapan.rol !== "YONETICI") throw new Error("Stok düzeltme yalnız YONETICI'dedir (B-7 §(6), D-2 §(2)).");

  const hatalar: Bildirim[] = [];
  if (g.kalemler.length === 0 || g.kalemler.some((k) => !k.urunId || !k.konumId || !Number.isInteger(k.fark) || k.fark === 0)) {
    hatalar.push(sert("DUZELTME_KALEMI_GECERSIZ"));
  }
  if (g.kalemler.some((k) => k.aciklama.trim() === "")) hatalar.push(sert("GEREKCE_ZORUNLU"));
  if (hatalar.length > 0) throw new IsHatasi(hatalar);

  const [urunler, konumlar, sebepler] = await Promise.all([
    tx.product.findMany({ where: { id: { in: g.kalemler.map((k) => k.urunId) } }, select: { id: true, name: true } }),
    tx.stockLocation.findMany({ where: { id: { in: g.kalemler.map((k) => k.konumId) }, isActive: true }, select: { id: true } }),
    tx.stockAdjustmentReason.findMany({ where: { id: { in: g.kalemler.map((k) => k.sebepId) }, isActive: true }, select: { id: true } }),
  ]);
  const ad = new Map(urunler.map((u) => [u.id, u.name]));
  const konum = new Set(konumlar.map((k) => k.id));
  const sebep = new Set(sebepler.map((s) => s.id));
  if (g.kalemler.some((k) => !ad.has(k.urunId) || !konum.has(k.konumId))) hatalar.push(sert("DUZELTME_KALEMI_GECERSIZ"));
  if (g.kalemler.some((k) => !sebep.has(k.sebepId))) hatalar.push(sert("DUZELTME_SEBEBI_GECERSIZ"));
  if (hatalar.length > 0) throw new IsHatasi(hatalar);

  const hareketler = (bag: Pick<StokHareketi, "stockAdjustmentId">): StokHareketi[] =>
    g.kalemler.map((k) => ({
      productId: k.urunId,
      locationId: k.konumId,
      type: k.fark > 0 ? ("GIRIS" as const) : ("CIKIS" as const),
      quantity: Math.abs(k.fark),
      note: "Stok düzeltme",
      ...bag,
    }));

  const ihlaller: BlokIhlali[] = (await negatifStokOnizle(tx, hareketler({}))).map((n) => ({
    kuralKodu: n.kuralKodu,
    parametreler: { urun: ad.get(n.urunId) ?? "", sonra: n.sonra },
  }));
  const gerekce = g.gerekce?.trim() || null;
  if (ihlaller.length > 0 && !gerekce) throw new IsHatasi(ihlaller.map((i) => yumusak(i.kuralKodu, i.parametreler)));

  const documentNo = await uretBelgeNo("DZL", tx);
  const belge = await tx.stockAdjustment.create({
    data: {
      documentNo,
      externalDocNo: g.hariciBelgeNo?.trim().slice(0, 64) || null,
      createdById: g.yapan.id,
      items: {
        create: g.kalemler.map((k) => ({
          productId: k.urunId,
          locationId: k.konumId,
          quantityDelta: k.fark,
          reasonId: k.sebepId,
          note: k.aciklama.trim(),
        })),
      },
    },
    select: { id: true },
  });
  await stokHareketiYaz(tx, hareketler({ stockAdjustmentId: belge.id }));
  await blokKontrolleriniCalistir(tx, { belgeTipi: "DZL", belgeId: belge.id, ihlaller, yapan: g.yapan, gerekce });
  return { belgeId: belge.id, documentNo };
}
