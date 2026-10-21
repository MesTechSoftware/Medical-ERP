import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { xlsxKitap } from "@/lib/disa-aktarim-yazici";
import { cozumleBirimFiyat } from "@/lib/fiyat";
import { calistirIceAktarim, partiGeriAl } from "@/lib/ice-aktarim";
import { referansVeri } from "../../../test/integration/referans";

// X-16-2 · X-16-3 — URUN ve FIYAT_LISTESI içe aktarımı: ekranın toplu hâli; dosya içi ve kayıtlı
// tekillik; fiyat satırı yalnız açılır; geri alma.

let yoneticiId = "";
beforeEach(async () => {
  await referansVeri();
  yoneticiId = (await prisma.user.create({ data: { name: "Y", email: "y@medikal.local", passwordHash: "x", role: "YONETICI" } })).id;
});
const dosya = (baslik: string[], satirlar: (string | null)[][]) => ({
  ad: "d.xlsx",
  icerik: xlsxKitap([{ ad: "Veri", kolonlar: baslik.map((b) => ({ baslik: b, tip: "metin" as const })), satirlar }]),
});
const hatalar = (r: { bildirimler: { kural_kodu: string; parametreler: Record<string, string | number> }[] }) =>
  r.bildirimler.map((b) => [b.parametreler.satir ?? null, b.parametreler.kolon ?? null, b.kural_kodu]);

describe("URUN içe aktarımı (X-16-2)", () => {
  const BASLIK = ["Ürün kodu", "Ürün adı", "KDV oranı kodu", "Liste fiyatı", "Durum"];

  it("ürün ekranının denetimi: kod tekilliği (dosya + kayıtlı), KDV kodu, fiyat; hatasız dosya ürün + varsayılan liste satırı yazar", async () => {
    await prisma.product.create({ data: { name: "Eski", code: "MED-9", taxRateId: (await prisma.taxRate.findFirstOrThrow()).id } });
    const r = await calistirIceAktarim(
      "URUN",
      dosya(BASLIK, [
        ["MED-1", "Stent", "kdv20", "100", null],
        ["MED-2", "Kateter", "KDV99", "50", null],
        ["MED-3", "Kılıf", "KDV10", "abc", "SİL"],
        ["MED-4", "A", "KDV20", "1", null],
        ["MED-4", "B", "KDV20", "1", null],
        ["MED-9", "Eski", "KDV20", "1", null],
        [null, "Kodsuz", "KDV20", "1", null],
      ]),
      "onizle",
      yoneticiId
    );
    expect(hatalar(r)).toEqual([
      [3, "KDV oranı kodu", "VERGI_ORANI_BULUNAMADI"],
      [4, "Durum", "DEGER_KATALOG_DISI"],
      [4, "Liste fiyatı", "GECERSIZ_TUTAR"],
      [5, "Ürün kodu", "URUN_KODU_KAYITLI"],
      [6, "Ürün kodu", "URUN_KODU_KAYITLI"],
      [7, "Ürün kodu", "URUN_KODU_KAYITLI"],
      [8, "Ürün kodu", "ALAN_ZORUNLU"],
    ]);

    const y = await calistirIceAktarim("URUN", dosya(BASLIK, [["MED-1", "Stent", "KDV20", "100", null], ["MED-2", "Kateter", "KDV10", "50", "PASIF"]]), "yaz", yoneticiId);
    expect(y.ozet).toEqual([
      { etiket: "Aktif ürün", deger: 1 },
      { etiket: "Pasif ürün", deger: 1 },
    ]);
    const urun = await prisma.product.findUniqueOrThrow({ where: { code: "MED-1" }, include: { taxRate: true } });
    expect([urun.taxRate.code, urun.importBatchId !== null]).toEqual(["KDV20", true]);
    const f = await cozumleBirimFiyat(urun.id, null, { miktar: 1, gun: new Date("2026-10-21T00:00:00Z") });
    expect(f.durum === "TAMAM" && f.listeFiyat.toFixed(2)).toBe("100.00");
  });

  it("geri alma: ürün harekette ya da başka listede kullanıldıysa reddedilir; değilse ürün ve liste satırı silinir", async () => {
    const { partiNo } = await calistirIceAktarim("URUN", dosya(BASLIK, [["MED-1", "Stent", "KDV20", "100", null]]), "yaz", yoneticiId);
    const parti = await prisma.importBatch.findUniqueOrThrow({ where: { batchNo: partiNo! } });
    const urun = await prisma.product.findUniqueOrThrow({ where: { code: "MED-1" } });
    const depo = await prisma.stockLocation.findFirstOrThrow();
    const h = await prisma.stockMovement.create({ data: { productId: urun.id, locationId: depo.id, type: "GIRIS", quantity: 1 } });
    expect((await partiGeriAl(parti.id, yoneticiId, "x")).bildirimler.map((b) => b.kural_kodu)).toEqual(["PARTI_GERI_ALINAMAZ"]);
    await prisma.stockMovement.delete({ where: { id: h.id } });
    expect((await partiGeriAl(parti.id, yoneticiId, "x")).durum).toBe("BASARILI");
    expect([await prisma.product.count(), await prisma.priceListItem.count()]).toEqual([0, 0]);
  });
});

describe("FIYAT_LISTESI içe aktarımı (X-16-3)", () => {
  const BASLIK = ["Liste kodu", "Ürün kodu", "Min. adet", "Liste fiyatı"];

  it("liste ve ürün kodla çözülür; kayıtlı ya da dosyada tekrarlanan (liste, ürün, min adet) reddedilir; satırlar süresiz açılır", async () => {
    const vergi = await prisma.taxRate.findFirstOrThrow();
    const urun = await prisma.product.create({ data: { name: "Stent", code: "MED-1", taxRateId: vergi.id } });
    const bayi = await prisma.priceList.create({ data: { code: "BAYI", name: "Bayi" } });
    await prisma.priceListItem.create({ data: { priceListId: bayi.id, productId: urun.id, listPrice: "90", minQuantity: 1 } });

    const r = await calistirIceAktarim(
      "FIYAT_LISTESI",
      dosya(BASLIK, [
        ["bayi", "MED-1", "10", "80"],
        ["BAYI", "MED-1", null, "85"], // kayıtlı (min 1)
        ["YOK", "MED-1", "5", "70"],
        ["BAYI", "MED-X", "5", "70"],
        ["BAYI", "MED-1", "20", "75"],
        ["BAYI", "MED-1", "20", "74"],
        ["BAYI", "MED-1", "0", "74"],
      ]),
      "onizle",
      yoneticiId
    );
    expect(hatalar(r)).toEqual([
      [3, "Min. adet", "FIYAT_SATIRI_CAKISIYOR"],
      [4, "Liste kodu", "FIYAT_LISTESI_BULUNAMADI"],
      [5, "Ürün kodu", "URUN_BULUNAMADI"],
      [6, "Min. adet", "FIYAT_SATIRI_CAKISIYOR"],
      [7, "Min. adet", "FIYAT_SATIRI_CAKISIYOR"],
      [8, "Min. adet", "GECERSIZ_MIKTAR"],
    ]);

    const y = await calistirIceAktarim("FIYAT_LISTESI", dosya(BASLIK, [["bayi", "MED-1", "10", "80"]]), "yaz", yoneticiId);
    expect(y.ozet).toEqual([{ etiket: "Liste BAYI", deger: 1 }]);
    const satir = await prisma.priceListItem.findFirstOrThrow({ where: { minQuantity: 10 } });
    expect([satir.listPrice.toFixed(2), satir.validFrom, satir.validTo, satir.importBatchId !== null]).toEqual(["80.00", null, null, true]);

    const parti = await prisma.importBatch.findUniqueOrThrow({ where: { batchNo: y.partiNo! } });
    expect((await partiGeriAl(parti.id, yoneticiId, "Yanlış fiyat")).durum).toBe("BASARILI");
    expect(await prisma.priceListItem.count()).toBe(1); // yalnız elle girilen satır kalır
  });
});
