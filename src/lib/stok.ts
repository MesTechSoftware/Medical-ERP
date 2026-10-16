import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { gunAraligi } from "@/lib/zaman";

type Db = Prisma.TransactionClient | typeof prisma;

/**
 * `hesaplaStok()` — stok okumasının TEK yolu (B-4 · ADR-005). Inline `SUM` yasaktır.
 * Tek çağrı noktası listesinin 4. maddesi: hareket toplamıdır. Okuma kilit almaz
 * (ADR-008 §(4)); yazım `stokHareketiYaz()`'dadır.
 *
 * `tarih` verilirse sonuç o günün İstanbul günü sonu itibarıyladır (E-1 §(5)).
 */
export async function hesaplaStok(
  urunId: string,
  konumId?: string,
  tarih?: Date,
  db: Db = prisma
): Promise<number> {
  const gruplar = await db.stockMovement.groupBy({
    by: ["type"],
    where: {
      productId: urunId,
      ...(konumId ? { locationId: konumId } : {}),
      ...(tarih ? { createdAt: { lt: gunAraligi(tarih).bitis } } : {}),
    },
    _sum: { quantity: true },
  });
  let stok = 0;
  for (const g of gruplar) {
    const miktar = g._sum.quantity ?? 0;
    stok += g.type === "GIRIS" ? miktar : -miktar;
  }
  return stok;
}

/**
 * Ürün satırlarını id sırasıyla kilitler (ADR-005 §3, ADR-008 §(1)/(3)). Kilit transaction
 * sonuna kadar tutulur; aynı ürüne yazan ikinci transaction bekler. Belge numarası alan
 * akış bunu `uretBelgeNo()`'dan ÖNCE çağırır — sayaç en son alınır (ADR-008 §(2)).
 */
export async function stokKilitle(tx: Prisma.TransactionClient, urunIdler: readonly string[]): Promise<void> {
  const idler = [...new Set(urunIdler)].sort();
  if (idler.length === 0) return;
  await tx.$queryRaw`SELECT "id" FROM "Product" WHERE "id" IN (${Prisma.join(idler)}) ORDER BY "id" FOR UPDATE`;
}

export type StokHareketi = Omit<Prisma.StockMovementUncheckedCreateInput, "id" | "createdAt">;

export type NegatifStok = {
  kuralKodu: "NEGATIF_STOK";
  urunId: string;
  konumId: string;
  once: number;
  sonra: number;
};

/**
 * Stok hareketinin TEK yazım yolu (B-4, ADR-005 §3): kilitle → `hesaplaStok()` oku → yaz.
 *
 * Negatife düşüş engellenmez (B-4 yumuşak kısıt). Yazımdan sonra sıfırın altında kalan ve
 * bu yazımda çıkış alan her ürün × konum `NEGATIF_STOK` kalemi olarak döner; kalemin
 * `OnayBlogu`'na dönüşmesi `blokKontrolleriniCalistir()`'ın işidir (A-8).
 */
export async function stokHareketiYaz(
  tx: Prisma.TransactionClient,
  hareketler: readonly StokHareketi[]
): Promise<NegatifStok[]> {
  await stokKilitle(tx, hareketler.map((h) => h.productId));

  const fark = new Map<string, { urunId: string; konumId: string; fark: number; cikis: boolean }>();
  for (const h of hareketler) {
    const anahtar = `${h.productId}|${h.locationId}`;
    const k = fark.get(anahtar) ?? { urunId: h.productId, konumId: h.locationId, fark: 0, cikis: false };
    k.fark += h.type === "GIRIS" ? h.quantity : -h.quantity;
    k.cikis ||= h.type === "CIKIS";
    fark.set(anahtar, k);
  }

  const negatif: NegatifStok[] = [];
  for (const k of fark.values()) {
    if (!k.cikis) continue;
    const once = await hesaplaStok(k.urunId, k.konumId, undefined, tx);
    const sonra = once + k.fark;
    if (sonra < 0) negatif.push({ kuralKodu: "NEGATIF_STOK", urunId: k.urunId, konumId: k.konumId, once, sonra });
  }

  await tx.stockMovement.createMany({ data: [...hareketler] });
  return negatif;
}

/**
 * Konum seçilmeyen akışların deposu. Faz 1'de tek depo seed edilir (B-4); çoklu
 * depoda UI davranışı satır sayısından türer ve konum seçimi 1B madde 7'dedir.
 */
export async function varsayilanDepoId(db: Db = prisma): Promise<string> {
  const depo = await db.stockLocation.findFirst({
    where: { type: "DEPO", isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true },
  });
  if (!depo) throw new Error("Aktif depo tanımlı değil.");
  return depo.id;
}
