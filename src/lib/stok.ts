import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { bugun, gunAraligi, gunEkle, yerelGunMetni } from "@/lib/zaman";

type Db = Prisma.TransactionClient | typeof prisma;

/**
 * `hesaplaStok()` — stok okumasının TEK yolu (B-4 · ADR-005). Inline `SUM` yasaktır.
 * Tek çağrı noktası listesinin 4. maddesi: hareket toplamıdır. Okuma kilit almaz
 * (ADR-008 §(4)); yazım `stokHareketiYaz()`'dadır.
 *
 * `tarih` verilirse sonuç o günün İstanbul günü sonu itibarıyladır (E-1 §(5)).
 * Toplu ve tekli aynı yoldur (B-4-7): bu fonksiyon `hesaplaStoklar()`'ı tek kimlikle çağırır.
 */
export async function hesaplaStok(
  urunId: string,
  konumId?: string,
  tarih?: Date,
  db: Db = prisma
): Promise<number> {
  return (await hesaplaStoklar([urunId], konumId, tarih, db)).get(urunId)!;
}

/**
 * Birden çok ürünün stoğu tek sorguda (B-4-7). Her istenen kimlik haritadadır; hareketsiz ürün 0.
 */
export async function hesaplaStoklar(
  urunIdler: readonly string[],
  konumId?: string,
  tarih?: Date,
  db: Db = prisma
): Promise<Map<string, number>> {
  const stoklar = new Map<string, number>(urunIdler.map((id) => [id, 0]));
  if (urunIdler.length === 0) return stoklar;
  const gruplar = await db.stockMovement.groupBy({
    by: ["productId", "type"],
    where: {
      productId: { in: [...urunIdler] },
      ...(konumId ? { locationId: konumId } : {}),
      ...(tarih ? { createdAt: { lt: gunAraligi(tarih).bitis } } : {}),
    },
    _sum: { quantity: true },
  });
  for (const g of gruplar) {
    const miktar = g._sum.quantity ?? 0;
    stoklar.set(g.productId, stoklar.get(g.productId)! + (g.type === "GIRIS" ? miktar : -miktar));
  }
  return stoklar;
}

/**
 * Son `gunSayisi` İstanbul gününün gün sonu stoğu, eskiden yeniye; son eleman bugündür (B-4-7).
 * Her nokta `hesaplaStok(urun, undefined, gün)` ile aynıdır: başlangıç o yoldan okunur, aralıktaki
 * hareketler gün gün eklenir (E-1 gün sınırı).
 */
export async function stokSerisi(
  urunId: string,
  gunSayisi: number,
  db: Db = prisma
): Promise<{ gun: string; stok: number }[]> {
  const ilk = gunEkle(bugun(), -(gunSayisi - 1));
  const [baslangic, hareketler] = await Promise.all([
    hesaplaStok(urunId, undefined, gunEkle(ilk, -1), db),
    db.stockMovement.findMany({
      where: { productId: urunId, createdAt: { gte: gunAraligi(ilk).baslangic } },
      select: { type: true, quantity: true, createdAt: true },
    }),
  ]);
  const gunluk = new Map<string, number>();
  for (const h of hareketler) {
    const gun = yerelGunMetni(h.createdAt);
    gunluk.set(gun, (gunluk.get(gun) ?? 0) + (h.type === "GIRIS" ? h.quantity : -h.quantity));
  }
  let stok = baslangic;
  return Array.from({ length: gunSayisi }, (_, i) => {
    const gun = yerelGunMetni(gunEkle(ilk, i));
    stok += gunluk.get(gun) ?? 0;
    return { gun, stok };
  });
}

/**
 * Aktif ürünler ve stokları (dashboard: kritik stok listesi ve istisna bandı tek okumayı paylaşır).
 * Tek `hesaplaStoklar()` okuması; ad sırasıyla.
 */
export async function aktifUrunStoklari(): Promise<{ id: string; name: string; code: string; stok: number }[]> {
  const urunler = await prisma.product.findMany({
    where: { status: "AKTIF" },
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
  });
  const stoklar = await hesaplaStoklar(urunler.map((u) => u.id));
  return urunler.map((u) => ({ ...u, stok: stoklar.get(u.id)! }));
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

/** Yazılacak hareket; işlemi yapan zorunludur (B-4 eki 01.11 — B-4-8). */
export type StokHareketi = Omit<Prisma.StockMovementUncheckedCreateInput, "id" | "createdAt" | "createdById"> & {
  createdById: string;
};

export type NegatifStok = {
  kuralKodu: "NEGATIF_STOK";
  urunId: string;
  konumId: string;
  once: number;
  sonra: number;
};

/**
 * Yazımdan önce: bu hareketler yazılırsa sıfırın altında kalacak ve çıkış alan her ürün × konum
 * (B-4). Ürünleri kilitler; kilit transaction sonuna kadar tutulduğu için sonuç yazıma kadar
 * geçerlidir. Sonuç doğuran adımı yazmadan önce durdurması gereken akış (A-8 — sevkiyat) bunu
 * çağırır; `stokHareketiYaz()` aynı hesabı kendisi yapar.
 */
export async function negatifStokOnizle(
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
  return negatif;
}

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
  const negatif = await negatifStokOnizle(tx, hareketler);
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
