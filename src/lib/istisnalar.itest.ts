import { describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { istisnalar } from "@/lib/istisnalar";
import { aktifUrunStoklari } from "@/lib/stok";
import { simdi } from "@/lib/zaman";
import { referansVeri, yeniDoktorVerisi } from "../../test/integration/referans";

// Dashboard istisnaları (brief §3.1, §4.3): tek fonksiyon, rol parametreli; kaynaklar mevcut tanımlar.

const SAAT = 3_600_000;

async function urun(ad: string, stok: number, status: "AKTIF" | "PASIF" = "AKTIF") {
  const ref = await referansVeri();
  const u = await prisma.product.create({ data: { name: ad, code: ad, taxRateId: ref.kdv20.id, status } });
  if (stok > 0) await prisma.stockMovement.create({ data: { productId: u.id, locationId: ref.depo.id, type: "GIRIS", quantity: stok } });
  return u;
}

const blok = (documentId: string, openedAt: Date, karar = false) =>
  prisma.approvalBlock.create({
    data: {
      documentType: "SIP",
      documentId,
      ruleCode: "NEGATIF_STOK",
      openedAt,
      openedById: "u",
      openReason: "acil",
      ...(karar ? { decision: "ONAY" as const, decidedById: "y", decidedAt: openedAt, decisionNote: "not" } : {}),
    },
  });

async function hepsi() {
  const an = simdi();
  await urun("Tükenen", 0);
  await urun("Kritik", 5);
  await urun("Bol", 50);
  await urun("Pasif", 0, "PASIF");
  await prisma.doctor.create({ data: yeniDoktorVerisi("Dr. Eksik") }); // sahipsiz ve fatura bilgisi eksik
  await prisma.doctor.create({
    data: {
      ...yeniDoktorVerisi("Bayi Tam"),
      accountClass: "BAYI",
      partyType: "GERCEK_KISI",
      taxId: "12345678901",
      invoiceAddress: "Adres",
      invoiceCity: "İzmir",
    },
  });
  await blok("eski", new Date(an.getTime() - 25 * SAAT));
  await blok("yeni", new Date(an.getTime() - 1 * SAAT));
  await blok("kararli", new Date(an.getTime() - 30 * SAAT), true);
  return an;
}

describe("istisnalar — dashboard istisna listesi (brief §3.1)", () => {
  it("boş veritabanında istisna yok: bant hiç çizilmez", async () => {
    await referansVeri();
    const stoklar = await aktifUrunStoklari();
    expect(await istisnalar("YONETICI", stoklar, simdi())).toEqual([]);
    expect(await istisnalar("OPERASYON", stoklar, simdi())).toEqual([]);
  });

  it("yönetici: beş kaynak, önem sırasıyla (hata → uyarı); her biri bağlantı verdiği listenin sayısıyla", async () => {
    const an = await hepsi();
    const liste = await istisnalar("YONETICI", await aktifUrunStoklari(), an);
    expect(liste.map((i) => [i.kod, i.ton, i.adet])).toEqual([
      ["tukenen", "hata", 1],
      ["kritik", "uyari", 1],
      ["eskiOnay", "uyari", 1],
      ["faturaEksik", "uyari", 1],
      ["sahipsiz", "uyari", 1],
    ]);
    expect(liste.map((i) => i.href)).toEqual(["/stock", "/stock", "/approvals", "/doctors?fatura=eksik", "/doctors?sahip=yok"]);
    expect(liste[0].metin).toBe("ürün tükendi");
    expect(liste[2].metin).toBe("onay 24 saatten uzun süredir bekliyor");
  });

  it("OPERASYON onay istisnasını görmez (onay ekranı yöneticinindir); geri kalanı aynı", async () => {
    const an = await hepsi();
    const liste = await istisnalar("OPERASYON", await aktifUrunStoklari(), an);
    expect(liste.map((i) => i.kod)).toEqual(["tukenen", "kritik", "faturaEksik", "sahipsiz"]);
  });

  it("aktif ürünlerin stoğu hesaplaStok() yolundan; pasif ürün listede yok", async () => {
    await hepsi();
    expect((await aktifUrunStoklari()).map((u) => [u.name, u.stok])).toEqual([
      ["Bol", 50],
      ["Kritik", 5],
      ["Tükenen", 0],
    ]);
  });
});
