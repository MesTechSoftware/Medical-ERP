import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { hesaplaSatirTutarlari } from "@/lib/satir-tutarlari";
import { stokHareketiYaz } from "@/lib/stok";
import { BOS_SUZGEC, type UrunSuzgeci } from "@/lib/urun-listesi/suzgec";
import { urunKpileri, urunListesi, urunPaneli } from "@/lib/urun-listesi/sorgu";
import { referansVeri, yeniDoktorVerisi } from "../../../test/integration/referans";

// Ürün listesi sorguları — KABUL_KRITERLERI B-4-7, X-10-4, Ü-3-2.

const SAYFA = { skip: 0, take: 100 };

let ref: Awaited<ReturnType<typeof referansVeri>>;
let sira = 0;
let yapanId = "";

/** Stoğu `stok` olan ürün; `createdAt` sırası oluşturma sırasıdır. */
async function urun(code: string, stok: number, status: "AKTIF" | "PASIF" = "AKTIF", taxRateId = ref.kdv20.id) {
  sira += 1;
  const u = await prisma.product.create({
    data: { name: code, code, status, taxRateId, createdAt: new Date(Date.UTC(2026, 0, 1, 0, sira)) },
  });
  const hareketler =
    stok >= 0
      ? [{ productId: u.id, locationId: ref.depo.id, type: "GIRIS" as const, quantity: stok, createdById: yapanId }]
      : [
          { productId: u.id, locationId: ref.depo.id, type: "GIRIS" as const, quantity: 1, createdById: yapanId },
          { productId: u.id, locationId: ref.depo.id, type: "CIKIS" as const, quantity: 1 - stok, createdById: yapanId },
        ];
  if (stok !== 0) await prisma.$transaction((tx) => stokHareketiYaz(tx, hareketler));
  return u;
}

const fiyatSatiri = (productId: string, listPrice: string, ek: Record<string, unknown> = {}) =>
  prisma.priceListItem.create({ data: { priceListId: ref.liste.id, productId, listPrice, ...ek } });

const kodlar = async (s: Partial<UrunSuzgeci>, sayfa = SAYFA) =>
  (await urunListesi({ ...BOS_SUZGEC, ...s }, sayfa)).satirlar.map((u) => u.code);

beforeEach(async () => {
  ref = await referansVeri();
  sira = 0;
  yapanId = (await prisma.user.create({ data: { name: "Depocu", email: "depocu@medikal.local", passwordHash: "x", role: "OPERASYON" } })).id;
});

describe("urunListesi — süzgeç", () => {
  beforeEach(async () => {
    await urun("BOL", 50);
    await urun("ESIK", 10);
    await urun("USTU", 11);
    await urun("SIFIR", 0);
    await urun("EKSI", -3);
    await urun("PASIF5", 5, "PASIF");
  });

  it("durum ve stok süzgeci birleşir; negatif stok tükendidir", async () => {
    expect(await kodlar({ stok: "kritik" })).toEqual(["PASIF5", "EKSI", "SIFIR", "ESIK"]);
    expect(await kodlar({ durum: "AKTIF", stok: "kritik" })).toEqual(["EKSI", "SIFIR", "ESIK"]);
    expect(await kodlar({ stok: "tukendi" })).toEqual(["EKSI", "SIFIR"]);
    expect(await kodlar({ durum: "PASIF" })).toEqual(["PASIF5"]);
  });

  it("sayfalama süzgeçten sonra; toplam süzülmüş sayıdır", async () => {
    const r = await urunListesi({ ...BOS_SUZGEC, stok: "kritik" }, { skip: 1, take: 2 });
    expect(r.toplam).toBe(4);
    expect(r.satirlar.map((u) => u.code)).toEqual(["EKSI", "SIFIR"]);
    expect(r.satirlar.map((u) => u.stok)).toEqual([-3, 0]);
  });

  it("KPI: kritik yalnız aktif ürünlerde, tükendi ve negatif dahil; karttaki süzgeçle aynı sayı", async () => {
    expect(await urunKpileri()).toEqual({ toplam: 6, aktif: 5, kritik: 3, pasif: 1 });
    expect((await urunListesi({ durum: "AKTIF", stok: "kritik" }, SAYFA)).toplam).toBe(3);
  });
});

describe("urunListesi — liste fiyatı (X-10-4, Ü-3-2)", () => {
  it("varsayılan listeden; KDV dahil 1 adetlik satır toplamı; çözülemezse ikisi de null", async () => {
    const kdv10 = await prisma.taxRate.create({ data: { code: "TEST-KDV10", name: "Test KDV %10", rate: "10" } });
    const yuz = await urun("YUZ", 1);
    const kesirli = await urun("KESIR", 1, "AKTIF", kdv10.id);
    const yalniz10 = await urun("BAREM10", 1);
    await urun("SATIRSIZ", 1);
    await fiyatSatiri(yuz.id, "100.0000");
    await fiyatSatiri(kesirli.id, "33.3333");
    await fiyatSatiri(yalniz10.id, "80", { minQuantity: 10 });

    const satirlar = new Map((await urunListesi(BOS_SUZGEC, SAYFA)).satirlar.map((u) => [u.code, u]));
    expect(satirlar.get("YUZ")!.fiyat!.toFixed(2)).toBe("100.00");
    expect(satirlar.get("YUZ")!.fiyatKdvDahil!.toFixed(2)).toBe("120.00");
    const beklenen = hesaplaSatirTutarlari([{ birimFiyat: "33.3333", listeFiyat: "33.3333", miktar: 1, kdvOrani: "10" }]);
    expect(satirlar.get("KESIR")!.fiyatKdvDahil!.toFixed(2)).toBe(beklenen.toplam.toplam.toFixed(2));
    expect(satirlar.get("KESIR")!.fiyatKdvDahil!.toFixed(2)).toBe("36.66");
    for (const kod of ["BAREM10", "SATIRSIZ"]) {
      expect(satirlar.get(kod)!.fiyat).toBeNull();
      expect(satirlar.get(kod)!.fiyatKdvDahil).toBeNull();
    }
  });
});

describe("urunPaneli", () => {
  it("bilinmeyen kimlik null", async () => {
    expect(await urunPaneli("yok")).toBeNull();
  });

  it("son 10 hareket yeniden eskiye; tür kaynak belgeden; çıkış eksi; seri 90 nokta", async () => {
    const u = await urun("P", 0);
    await prisma.$transaction((tx) =>
      stokHareketiYaz(
        tx,
        Array.from({ length: 11 }, () => ({ productId: u.id, locationId: ref.depo.id, type: "GIRIS" as const, quantity: 2, createdById: yapanId }))
      )
    );
    const doktor = await prisma.doctor.create({ data: yeniDoktorVerisi() });
    const siparis = await prisma.order.create({
      data: { documentNo: "SIP-P-1", doctorId: doktor.id, paymentTermDays: 30, stage: "ONAYLI" },
    });
    const sevk = await prisma.shipment.create({ data: { documentNo: "SVK-P-1", orderId: siparis.id } });
    await prisma.$transaction((tx) =>
      stokHareketiYaz(tx, [{ productId: u.id, locationId: ref.depo.id, type: "CIKIS", quantity: 5, shipmentId: sevk.id, createdById: yapanId }])
    );

    const p = (await urunPaneli(u.id))!;
    expect(p.urun.stok).toBe(17);
    expect(p.hareketler).toHaveLength(10);
    expect(p.hareketler[0]).toMatchObject({ tur: "Sevkiyat", miktar: -5 });
    expect(p.hareketler[1]).toMatchObject({ tur: "Stok girişi", miktar: 2 });
    expect(p.seri).toHaveLength(90);
    expect(p.seri.at(-1)!.stok).toBe(17);
  });

  it("fiyat listeleri: süresi geçmiş satır yok, ileri tarihli var, varsayılan ve pasif işaretli; listedeki fiyat bugünkü satır", async () => {
    const u = await urun("F", 1);
    const gun = (t: string) => new Date(`${t}T00:00:00Z`);
    await fiyatSatiri(u.id, "90", { validTo: gun("2020-01-01") });
    await fiyatSatiri(u.id, "100", { validFrom: gun("2020-01-01"), validTo: gun("2099-01-01") });
    await fiyatSatiri(u.id, "110", { validFrom: gun("2099-01-01") });
    await fiyatSatiri(u.id, "95", { minQuantity: 10 });
    const ozel = await prisma.priceList.create({ data: { code: "OZEL", name: "Özel", isActive: false } });
    await prisma.priceListItem.create({ data: { priceListId: ozel.id, productId: u.id, listPrice: "70" } });

    const p = (await urunPaneli(u.id))!;
    expect(p.urun.fiyat!.toFixed(2)).toBe("100.00");
    const varsayilan = p.listeler.find((l) => l.id === ref.liste.id)!;
    expect(varsayilan.varsayilan).toBe(true);
    expect(varsayilan.satirlar.map((s) => [s.minQuantity, s.listPrice.toFixed(2)])).toEqual([
      [1, "100.00"],
      [1, "110.00"],
      [10, "95.00"],
    ]);
    const pasif = p.listeler.find((l) => l.id === ozel.id)!;
    expect(pasif).toMatchObject({ code: "OZEL", isActive: false, varsayilan: false });
    expect(p.listeler).toHaveLength(2);
  });

  it("hiçbir listede olmayan ürünün listesi boş", async () => {
    const u = await urun("L", 0);
    expect((await urunPaneli(u.id))!.listeler).toEqual([]);
  });
});
