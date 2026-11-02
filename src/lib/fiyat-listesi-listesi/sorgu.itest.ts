import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { cozumleListeFiyatlari } from "@/lib/fiyat";
import { BOS_SUZGEC } from "@/lib/fiyat-listesi-listesi/suzgec";
import { fiyatListeleri, fiyatListesiKpileri, fiyatListesiPaneli } from "@/lib/fiyat-listesi-listesi/sorgu";
import { bugun, gunEkle } from "@/lib/zaman";
import { referansVeri, yeniDoktorVerisi } from "../../../test/integration/referans";

// Fiyat listesi ekranı sorguları — KABUL_KRITERLERI X-10-6 (spec Ü-21 §4.2).

const SAYFA = { skip: 0, take: 100 };
let ref: Awaited<ReturnType<typeof referansVeri>>;

const urun = (code: string, status: "AKTIF" | "PASIF" = "AKTIF") =>
  prisma.product.create({ data: { name: code, code, status, taxRateId: ref.kdv20.id } });
const satir = (priceListId: string, productId: string, minQuantity = 1, validFrom: Date | null = null, validTo: Date | null = null) =>
  prisma.priceListItem.create({ data: { priceListId, productId, listPrice: "100", minQuantity, validFrom, validTo } });
const liste = (code: string) => prisma.priceList.create({ data: { code, name: `${code} adı` } });
const cari = (ad: string, priceListId: string | null, status: "AKTIF" | "PASIF" = "AKTIF") =>
  prisma.doctor.create({ data: { ...yeniDoktorVerisi(ad), priceListId, status } });

beforeEach(async () => {
  ref = await referansVeri();
});

describe("aktif / boş sınıflaması ve KPI (X-10-6)", () => {
  it("bugün geçerli satırı olan liste aktif; yalnız süresi geçmiş ya da başlamamış satırlı ve satırsız liste boş", async () => {
    const a = await urun("A");
    const l1 = await liste("L1");
    const l2 = await liste("L2");
    const l3 = await liste("L3");
    await liste("L4");
    await satir(l1.id, a.id);
    await satir(l2.id, a.id, 1, null, bugun()); // bugün hariç biter
    await satir(l3.id, a.id, 1, gunEkle(bugun(), 1)); // yarın başlar

    const aktif = await fiyatListeleri({ durum: "aktif" }, SAYFA);
    const bos = await fiyatListeleri({ durum: "bos" }, SAYFA);
    expect(aktif.satirlar.map((l) => l.code)).toEqual(["L1"]);
    expect(bos.satirlar.map((l) => l.code)).toEqual(["L2", "L3", "L4", ref.liste.code].sort());
    expect(bos.satirlar.every((l) => !l.aktif)).toBe(true);

    const k = await fiyatListesiKpileri();
    expect(k.aktif).toBe(aktif.toplam);
    expect(k.toplam).toBe((await fiyatListeleri(BOS_SUZGEC, SAYFA)).toplam);
    expect(k.toplam).toBe(5);
  });

  it("ürün, barem ve cari sayıları; özel listeli cari yalnız aktif carilerdir", async () => {
    const [a, b] = [await urun("A"), await urun("B")];
    const l1 = await liste("L1");
    await satir(l1.id, a.id, 1);
    await satir(l1.id, a.id, 10);
    await satir(l1.id, b.id, 1);
    await satir(l1.id, b.id, 20, null, bugun()); // geçersiz barem sayılmaz
    await cari("Dr. A", l1.id);
    await cari("Dr. B", l1.id);
    await cari("Dr. C", l1.id, "PASIF");
    await cari("Dr. D", null);

    const [s] = (await fiyatListeleri({ durum: "aktif" }, SAYFA)).satirlar;
    expect(s).toMatchObject({ code: "L1", urunSayisi: 2, baremSayisi: 1, cariSayisi: 3, aktif: true, varsayilan: false });
    const k = await fiyatListesiKpileri();
    expect(k.ozelListeliCari).toBe(2);
    expect(k.varsayilanKullanan).toBe(1);
  });

  it("varsayılan liste rozeti ve sıralama koda göre", async () => {
    await liste("ZZ");
    await liste("AA");
    const { satirlar } = await fiyatListeleri(BOS_SUZGEC, SAYFA);
    expect(satirlar.map((l) => l.code)).toEqual(satirlar.map((l) => l.code).sort());
    expect(satirlar.filter((l) => l.varsayilan).map((l) => l.code)).toEqual([ref.liste.code]);
  });

  it("fiyatsız ürün = aktif ürünlerden varsayılan listede 1 adet için HATA dönenler", async () => {
    const a = await urun("A");
    const b = await urun("B"); // satırsız
    const c = await urun("C"); // yalnız 10+
    await urun("P", "PASIF"); // pasif sayılmaz
    await satir(ref.liste.id, a.id);
    await satir(ref.liste.id, c.id, 10);

    const fiyatlar = await cozumleListeFiyatlari([a.id, b.id, c.id], { miktar: 1, gun: bugun() });
    const beklenen = [...fiyatlar.values()].filter((f) => f.durum === "HATA").length;
    const k = await fiyatListesiKpileri();
    expect(k.fiyatsizUrun).toBe(beklenen);
    expect(k.fiyatsizUrun).toBe(2);
    expect(k.varsayilanListeId).toBe(ref.liste.id);
  });

  it("varsayılan liste yoksa bütün aktif ürünler fiyatsızdır ve bağlantı kimliği yoktur", async () => {
    await urun("A");
    await urun("B");
    await prisma.priceList.update({ where: { id: ref.liste.id }, data: { code: "BASKA" } });
    const k = await fiyatListesiKpileri();
    expect(k.fiyatsizUrun).toBe(2);
    expect(k.varsayilanListeId).toBeNull();
  });
});

describe("yan panel (spec §3.5)", () => {
  it("ilk 20 cari ada göre, toplam, pasif işareti; tarihli satır sayısı; matris", async () => {
    const a = await urun("A");
    const l = await liste("L1");
    await satir(l.id, a.id, 1);
    await satir(l.id, a.id, 10, gunEkle(bugun(), -5));
    await satir(l.id, a.id, 50, null, gunEkle(bugun(), -1)); // süresi geçmiş
    for (let i = 25; i >= 1; i--) await cari(`Dr. ${String(i).padStart(2, "0")}`, l.id, i === 1 ? "PASIF" : "AKTIF");

    const p = await fiyatListesiPaneli(l.id);
    expect(p).not.toBeNull();
    expect(p!.cariToplam).toBe(25);
    expect(p!.cariler).toHaveLength(20);
    expect(p!.cariler[0]).toMatchObject({ fullName: "Dr. 01", pasif: true });
    expect(p!.cariler[19].fullName).toBe("Dr. 20");
    expect(p!.toplamSatir).toBe(3);
    expect(p!.tarihliSatir).toBe(2);
    expect(p!.matris.esikler).toEqual([1, 10]);
    expect(p!.liste).toMatchObject({ code: "L1", urunSayisi: 1, baremSayisi: 1, cariSayisi: 25 });
  });

  it("bulunamayan kimlik null", async () => {
    expect(await fiyatListesiPaneli("yok")).toBeNull();
  });
});
