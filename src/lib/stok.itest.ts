import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { hesaplaStok, hesaplaStoklar, stokHareketiYaz } from "@/lib/stok";
import { bugun, gunEkle } from "@/lib/zaman";
import { referansVeri, yeniDoktorVerisi } from "../../test/integration/referans";

// `stokHareketiYaz()` — KABUL_KRITERLERI B-4-2…B-4-4.

let depoId = "";
let konsinyeId = "";
let taxRateId = "";

const urun = (code: string) => prisma.product.create({ data: { name: code, code, taxRateId } });
const giris = (productId: string, quantity: number, locationId = depoId) =>
  ({ productId, locationId, type: "GIRIS", quantity }) as const;
const cikis = (productId: string, quantity: number, locationId = depoId) =>
  ({ productId, locationId, type: "CIKIS", quantity }) as const;
const bekle = (ms: number) => new Promise((r) => setTimeout(r, ms));

beforeEach(async () => {
  const ref = await referansVeri();
  // Konsinye konumu bir doktora aittir (A-4 eki, CHECK).
  const doktor = await prisma.doctor.create({ data: yeniDoktorVerisi() });
  const kns = await prisma.stockLocation.create({ data: { code: "KNS-S", name: "Konsinye", type: "KONSINYE", doctorId: doktor.id } });
  depoId = ref.depo.id;
  konsinyeId = kns.id;
  taxRateId = ref.kdv20.id;
});

describe("stokHareketiYaz — yazım (B-4-2)", () => {
  it("hareketleri yazar; stok hareketlerden türer", async () => {
    const u = await urun("U1");
    await prisma.$transaction((tx) => stokHareketiYaz(tx, [giris(u.id, 10), cikis(u.id, 3)]));
    expect(await hesaplaStok(u.id)).toBe(7);
    expect(await prisma.stockMovement.count({ where: { productId: u.id } })).toBe(2);
  });

  it("ürün satırını yazan transaction bitene kadar kilitli tutar", async () => {
    const u = await urun("U1");
    let birinciBitti = false;
    const birinci = prisma.$transaction(async (tx) => {
      await stokHareketiYaz(tx, [giris(u.id, 1)]);
      await bekle(300);
      birinciBitti = true;
    });
    await bekle(100);
    // Kilitli satırı NOWAIT ile almaya çalışan ikinci bağlantı hemen reddedilir. `NO KEY UPDATE`
    // seçilir: hareketin yabancı anahtarı satıra KEY SHARE koyar, bu yalnız FOR UPDATE ile çakışır.
    await expect(
      prisma.$transaction((tx) => tx.$queryRaw`SELECT "id" FROM "Product" WHERE "id" = ${u.id} FOR NO KEY UPDATE NOWAIT`)
    ).rejects.toThrow();
    expect(birinciBitti).toBe(false);
    await birinci;
  });
});

describe("stokHareketiYaz — NEGATIF_STOK (B-4-3)", () => {
  it("negatife düşen çıkış yazılır ve kalem olarak döner", async () => {
    const u = await urun("U1");
    await prisma.$transaction((tx) => stokHareketiYaz(tx, [giris(u.id, 5)]));

    const negatif = await prisma.$transaction((tx) => stokHareketiYaz(tx, [cikis(u.id, 3), cikis(u.id, 4)]));
    expect(negatif).toEqual([{ kuralKodu: "NEGATIF_STOK", urunId: u.id, konumId: depoId, once: 5, sonra: -2 }]);
    expect(await hesaplaStok(u.id)).toBe(-2); // engellenmez (B-4)
  });

  it("sıfıra inen, giriş alan ve başka konumdaki stok kalem değildir", async () => {
    const a = await urun("A");
    const b = await urun("B");
    await prisma.$transaction((tx) => stokHareketiYaz(tx, [giris(a.id, 4), cikis(b.id, 2)])); // B depoda −2
    const negatif = await prisma.$transaction((tx) =>
      stokHareketiYaz(tx, [
        cikis(a.id, 4), // A depoda 0
        giris(b.id, 1), // B depoda −1: giriş alan konum kalem değil
        giris(a.id, 9, konsinyeId),
        cikis(a.id, 2, konsinyeId), // A konsinyede 7
      ])
    );
    expect(negatif).toEqual([]);
  });

  it("çok ürünlü yazımda kalemler ürün ve konum başına ayrı döner", async () => {
    const a = await urun("A");
    const b = await urun("B");
    const negatif = await prisma.$transaction((tx) =>
      stokHareketiYaz(tx, [cikis(b.id, 1), cikis(a.id, 2), cikis(a.id, 1, konsinyeId)])
    );
    expect(negatif.map((n) => [n.urunId, n.konumId, n.sonra]).sort()).toEqual(
      [
        [a.id, depoId, -2],
        [a.id, konsinyeId, -1],
        [b.id, depoId, -1],
      ].sort()
    );
  });
});

describe("stokHareketiYaz — eşzamanlılık (B-4-4)", () => {
  it("ikinci çıkış birincinin commit'ini bekler ve negatife düşüşü görür", async () => {
    const u = await urun("U1");
    await prisma.$transaction((tx) => stokHareketiYaz(tx, [giris(u.id, 10)]));

    // İki ayrı bağlantı: birinci yazar ve commit etmeden bekler; ikinci o sırada başlar.
    const birinci = prisma.$transaction(async (tx) => {
      const n = await stokHareketiYaz(tx, [cikis(u.id, 8)]);
      await bekle(300);
      return n;
    });
    await bekle(100);
    const ikinci = prisma.$transaction((tx) => stokHareketiYaz(tx, [cikis(u.id, 8)]));

    const [n1, n2] = await Promise.all([birinci, ikinci]);
    expect(n1).toEqual([]);
    expect(n2).toEqual([{ kuralKodu: "NEGATIF_STOK", urunId: u.id, konumId: depoId, once: 2, sonra: -6 }]);
    expect(await hesaplaStok(u.id)).toBe(-6);
  });
});

describe("hesaplaStoklar — toplu ≡ tekli (B-4-7)", () => {
  it("her ürün için tekliyle aynı: konumsuz, konumlu, tarihli", async () => {
    const [a, b, c] = [await urun("A"), await urun("B"), await urun("C")];
    await prisma.$transaction((tx) =>
      stokHareketiYaz(tx, [giris(a.id, 20), cikis(a.id, 5), giris(b.id, 10), cikis(b.id, 4), giris(b.id, 4, konsinyeId)])
    );
    const idler = [a.id, b.id, c.id];
    const dun = gunEkle(bugun(), -1);
    for (const [konum, tarih] of [
      [undefined, undefined],
      [depoId, undefined],
      [konsinyeId, undefined],
      [undefined, dun],
      [depoId, bugun()],
    ] as const) {
      const toplu = await hesaplaStoklar(idler, konum, tarih);
      for (const id of idler) expect(toplu.get(id)).toBe(await hesaplaStok(id, konum, tarih));
    }
    expect((await hesaplaStoklar(idler)).get(a.id)).toBe(15);
    expect((await hesaplaStoklar(idler, konsinyeId)).get(b.id)).toBe(4);
  });

  it("hareketsiz ürün 0 döner", async () => {
    const u = await urun("H");
    expect((await hesaplaStoklar([u.id])).get(u.id)).toBe(0);
  });

  it("boş liste boş harita", async () => {
    expect((await hesaplaStoklar([])).size).toBe(0);
  });

  it("negatif stok korunur", async () => {
    const u = await urun("N");
    await prisma.$transaction((tx) => stokHareketiYaz(tx, [giris(u.id, 2), cikis(u.id, 5)]));
    expect((await hesaplaStoklar([u.id])).get(u.id)).toBe(-3);
  });
});
