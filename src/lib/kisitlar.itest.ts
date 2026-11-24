import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { uretBelgeNo } from "@/lib/belge-no";
import { hesaplaStok } from "@/lib/stok";
import { takvimYili } from "@/lib/zaman";
import { referansVeri, yeniDoktorVerisi } from "../../test/integration/referans";

// CM migration'ının elle yazılan ve tek noktaya bağlanan kısıtları.

describe("fiyat listesi satırı — tarih aralığı çakışmaz (EXCLUDE — B-5, X-10 §(1))", () => {
  let liste = "";
  let urun = "";

  beforeEach(async () => {
    const ref = await referansVeri();
    liste = ref.liste.id;
    urun = (await prisma.product.create({ data: { name: "Ü", code: "U1", taxRateId: ref.kdv20.id } })).id;
  });

  const satir = (validFrom: string | null, validTo: string | null, minQuantity = 1) =>
    prisma.priceListItem.create({
      data: {
        priceListId: liste,
        productId: urun,
        listPrice: "10",
        minQuantity,
        validFrom: validFrom ? new Date(`${validFrom}T00:00:00Z`) : null,
        validTo: validTo ? new Date(`${validTo}T00:00:00Z`) : null,
      },
    });

  it("art arda gelen aralıklar kabul edilir — yarı açık [başlangıç, bitiş) (E-1 §(4))", async () => {
    await satir("2026-01-01", "2026-07-01");
    await expect(satir("2026-07-01", null)).resolves.toBeDefined();
  });

  it("çakışan aralık reddedilir", async () => {
    await satir("2026-01-01", "2026-07-01");
    await expect(satir("2026-06-01", "2026-08-01")).rejects.toThrow(/PriceListItem_tarih_cakismasi_excl/);
  });

  it("süresiz satır her aralıkla çakışır", async () => {
    await satir(null, null);
    await expect(satir("2030-01-01", "2030-02-01")).rejects.toThrow();
  });

  it("farklı barem (minQuantity) ayrı satırdır, çakışmaz (B-6)", async () => {
    await satir(null, null, 1);
    await expect(satir(null, null, 10)).resolves.toBeDefined();
  });
});

describe("sipariş satırı — bedelsiz olmayan satırın birim fiyatı > 0 (CHECK — A-10-5)", () => {
  it("bedelli satır 0 fiyatla yazılamaz; bedelsiz satır 0 olabilir", async () => {
    const ref = await referansVeri();
    const doktor = await prisma.doctor.create({ data: yeniDoktorVerisi("Dr. Fiyat") });
    const urun = await prisma.product.create({ data: { name: "Ü", code: "U-CHK", taxRateId: ref.kdv20.id } });
    const o = await prisma.order.create({
      data: { documentNo: "SIP-CHK", doctorId: doktor.id, stage: "ONAYLI", status: "BEKLIYOR", paymentTermDays: 30 },
    });
    const satir = (veri: object) =>
      prisma.orderItem.create({
        data: { orderId: o.id, productId: urun.id, quantity: 1, listPrice: "10", unitPrice: "10", vatRate: "20", ...veri },
      });
    await expect(satir({ unitPrice: "0" })).rejects.toThrow(/OrderItem_birim_fiyat_pozitif_check/);
    await expect(satir({ unitPrice: "-1" })).rejects.toThrow(/OrderItem_birim_fiyat_pozitif_check/);
    await expect(satir({ unitPrice: "0.0001" })).resolves.toBeTruthy();
    await expect(satir({ unitPrice: "0", isFree: true, freeReason: "NUMUNE" })).resolves.toBeTruthy();
  });
});

describe("uretBelgeNo (A-14)", () => {
  it("biçim {ÖNEK}-{YIL}-{SIRA}, önek başına ayrı sayaç", async () => {
    const [a, b, c] = await prisma.$transaction(async (tx) => [
      await uretBelgeNo("SIP", tx),
      await uretBelgeNo("SIP", tx),
      await uretBelgeNo("THS", tx),
    ]);
    const y = takvimYili();
    expect([a, b, c]).toEqual([`SIP-${y}-000001`, `SIP-${y}-000002`, `THS-${y}-000001`]);
  });

  it("eşzamanlı transaction'lar aynı numarayı alamaz (satır kilidi)", async () => {
    const nolar = await Promise.all(
      Array.from({ length: 10 }, () => prisma.$transaction((tx) => uretBelgeNo("SVK", tx)))
    );
    expect(new Set(nolar).size).toBe(10);
  });

  it("geri alınan transaction sayacı tüketmez", async () => {
    // A-14 §(6) "iptalde kalır" belge iptalidir; kaydı hiç oluşmamış transaction sayacı da tüketmez.
    await expect(
      prisma.$transaction(async (tx) => {
        await uretBelgeNo("DZL", tx);
        throw new Error("vazgeç");
      })
    ).rejects.toThrow("vazgeç");
    const no = await prisma.$transaction((tx) => uretBelgeNo("DZL", tx));
    expect(no).toBe(`DZL-${takvimYili()}-000001`);
  });
});

describe("hesaplaStok — konum ve tarih (B-4, C-2, E-1 §(5))", () => {
  it("konum bazında ve gün sonu itibarıyla okur", async () => {
    const ref = await referansVeri();
    const konsinye = await prisma.stockLocation.create({
      data: {
        code: "KNS-1",
        name: "Dr. A konsinye",
        type: "KONSINYE",
        doctorId: (await prisma.doctor.create({ data: yeniDoktorVerisi() })).id,
      },
    });
    const urun = await prisma.product.create({ data: { name: "Ü", code: "U1", taxRateId: ref.kdv20.id } });
    const hareket = (locationId: string, type: "GIRIS" | "CIKIS", quantity: number, an: string) =>
      prisma.stockMovement.create({
        data: { productId: urun.id, locationId, type, quantity, createdAt: new Date(an) },
      });

    await hareket(ref.depo.id, "GIRIS", 100, "2026-09-01T09:00:00Z");
    await hareket(ref.depo.id, "CIKIS", 30, "2026-09-10T20:30:00Z"); // İstanbul 10 Eylül 23:30
    await hareket(konsinye.id, "GIRIS", 30, "2026-09-10T21:30:00Z"); // İstanbul 11 Eylül 00:30

    expect(await hesaplaStok(urun.id)).toBe(100);
    expect(await hesaplaStok(urun.id, ref.depo.id)).toBe(70);
    expect(await hesaplaStok(urun.id, konsinye.id)).toBe(30);
    // "10 Eylül itibarıyla" İstanbul günü sonunu okur: 23:30 çıkışı dahil, 00:30 girişi hariç.
    expect(await hesaplaStok(urun.id, undefined, new Date("2026-09-10T12:00:00Z"))).toBe(70);
  });
});
