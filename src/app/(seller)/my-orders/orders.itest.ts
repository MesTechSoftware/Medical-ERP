import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db";
import { hesaplaStok } from "@/lib/stok";
import { degistirDoktorSahibi } from "@/lib/sahiplik";
import { takvimYili } from "@/lib/zaman";
import { referansVeri, yeniDoktorVerisi } from "../../../../test/integration/referans";

// Sipariş oluşturma — CM sonrası tek fiyat yolu (X-10), Decimal (X-5), belge no (A-14),
// stok sipariş anında düşmez — çıkış sevkiyatta doğar (A-3, sevkiyat.itest.ts).
// C6 (GÇ-8): taban fiyat reddi yok — iskonto tavanı yok, liste üstü satış serbest.
const h = vi.hoisted(() => ({ sellerId: "" }));

vi.mock("@/lib/session", () => ({
  requireSeller: async () => ({ user: { id: h.sellerId, role: "SATICI" } }),
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("next/navigation", () => ({ redirect: () => {} }));

const { createOrder } = await import("./actions");

async function seed() {
  const ref = await referansVeri();
  const seller = await prisma.user.create({
    data: { name: "Satıcı", email: "satici@medikal.local", passwordHash: "test", role: "SATICI" },
  });
  h.sellerId = seller.id;

  const doctor = await prisma.doctor.create({ data: yeniDoktorVerisi("Dr. Ayşe Kaya") });
  await prisma.$transaction((tx) =>
    degistirDoktorSahibi([doctor.id], seller.id, { metin: "test", yapanId: seller.id }, tx)
  );

  const product = await prisma.product.create({
    data: { name: "Stent", code: "MED-001", taxRateId: ref.kdv20.id },
  });
  await prisma.priceListItem.create({
    data: { priceListId: ref.liste.id, productId: product.id, listPrice: "1000" },
  });
  await prisma.stockMovement.create({
    data: { productId: product.id, locationId: ref.depo.id, type: "GIRIS", quantity: 10 },
  });

  return { doctor, product, ref };
}

function siparisFormu(doctorId: string, productId: string, birimFiyat?: string, quantity = 2) {
  const fd = new FormData();
  fd.set("doctorId", doctorId);
  fd.set(
    "items",
    JSON.stringify([{ productId, quantity, ...(birimFiyat !== undefined ? { birimFiyat } : {}) }])
  );
  return fd;
}

describe("sipariş oluşturma (CM)", () => {
  let s: Awaited<ReturnType<typeof seed>>;

  beforeEach(async () => {
    s = await seed();
  });

  it("listenin altındaki fiyatla sipariş kabul edilir; liste ve birim fiyat ayrı donar (X-5 §(9))", async () => {
    const sonuc = await createOrder(null, siparisFormu(s.doctor.id, s.product.id, "500"));
    expect(sonuc).toBeUndefined(); // başarıda redirect

    const [item] = await prisma.orderItem.findMany();
    expect(item.unitPrice.toFixed(4)).toBe("500.0000");
    expect(item.listPrice.toFixed(4)).toBe("1000.0000");
    expect(item.vatRate.toFixed(2)).toBe("20.00"); // değer olarak donar (C-6 §(2-a))
  });

  it("liste üstü fiyat da serbesttir (A-10)", async () => {
    await createOrder(null, siparisFormu(s.doctor.id, s.product.id, "1250.5"));
    const [item] = await prisma.orderItem.findMany();
    expect(item.unitPrice.toFixed(2)).toBe("1250.50");
  });

  it("fiyat girilmezse liste fiyatı kullanılır", async () => {
    await createOrder(null, siparisFormu(s.doctor.id, s.product.id));
    const [item] = await prisma.orderItem.findMany();
    expect(item.unitPrice.toFixed(2)).toBe("1000.00");
  });

  it("barem satırın miktarına göre çözülür ve liste fiyatı olarak donar (B-6-1)", async () => {
    await prisma.priceListItem.create({
      data: { priceListId: s.ref.liste.id, productId: s.product.id, listPrice: "900", minQuantity: 10 },
    });
    await createOrder(null, siparisFormu(s.doctor.id, s.product.id, undefined, 9));
    await createOrder(null, siparisFormu(s.doctor.id, s.product.id, undefined, 10));
    const kalemler = await prisma.orderItem.findMany({ orderBy: { quantity: "asc" } });
    expect(kalemler.map((k) => [k.quantity, k.listPrice.toFixed(2), k.unitPrice.toFixed(2)])).toEqual([
      [9, "1000.00", "1000.00"],
      [10, "900.00", "900.00"],
    ]);
  });

  it("sipariş SIP numarası alır; numaralar sıralıdır (A-14)", async () => {
    await createOrder(null, siparisFormu(s.doctor.id, s.product.id));
    await createOrder(null, siparisFormu(s.doctor.id, s.product.id));
    const nolar = (await prisma.order.findMany({ orderBy: { createdAt: "asc" } })).map((o) => o.documentNo);
    const yil = takvimYili();
    expect(nolar).toEqual([`SIP-${yil}-000001`, `SIP-${yil}-000002`]);
  });

  it("sipariş ONAYLI açılır ve vade gün sayısını taşır (A-5, A-7)", async () => {
    await createOrder(null, siparisFormu(s.doctor.id, s.product.id));
    const order = await prisma.order.findFirstOrThrow();
    expect(order.stage).toBe("ONAYLI");
    expect(order.paymentTermDays).toBe(30);
    expect(order.sellerId).toBe(h.sellerId); // X-13 §(3): sipariş anındaki sahip
  });

  it("sipariş stok düşürmez; çıkış sevkiyatta doğar (A-3)", async () => {
    await createOrder(null, siparisFormu(s.doctor.id, s.product.id));
    expect(await hesaplaStok(s.product.id)).toBe(10);
    expect(await prisma.stockMovement.count({ where: { type: "CIKIS" } })).toBe(0);
  });

  it("stok yetersiz olsa da sipariş engellenmez (B-4, GÇ-17)", async () => {
    const sonuc = await createOrder(null, siparisFormu(s.doctor.id, s.product.id, undefined, 15));
    expect(sonuc).toBeUndefined(); // başarıda redirect
    expect(await prisma.order.count()).toBe(1);
  });

  it("varsayılan listede satırı olmayan ürün sipariş edilemez (X-10 §(3))", async () => {
    const yeni = await prisma.product.create({
      data: { name: "Listesiz", code: "MED-002", taxRateId: s.ref.kdv20.id },
    });
    const sonuc = await createOrder(null, siparisFormu(s.doctor.id, yeni.id));
    expect(sonuc?.bildirimler.map((b) => b.kural_kodu)).toEqual(["FIYAT_COZUMLENEMEDI"]);
    expect(await prisma.order.count()).toBe(0);
  });

  it("kalem hatalarının hepsi birlikte döner, ilkinde durulmaz; sipariş ve numara yazılmaz (X-4-3)", async () => {
    const listesiz = await prisma.product.create({
      data: { name: "Listesiz", code: "MED-002", taxRateId: s.ref.kdv20.id },
    });
    const pasif = await prisma.product.create({
      data: { name: "Eski Kateter", code: "MED-003", taxRateId: s.ref.kdv20.id, status: "PASIF" },
    });
    const fd = new FormData();
    fd.set("doctorId", s.doctor.id);
    fd.set(
      "items",
      JSON.stringify([
        { productId: listesiz.id, quantity: 1 },
        { productId: s.product.id, quantity: 1 },
        { productId: pasif.id, quantity: 1 },
      ])
    );

    expect(await createOrder(null, fd)).toEqual({
      durum: "ENGELLENDI",
      kademe: "SERT",
      bildirimler: [
        { kademe: "SERT", kural_kodu: "FIYAT_COZUMLENEMEDI", parametreler: { urun: "Listesiz" } },
        { kademe: "SERT", kural_kodu: "URUN_PASIF", parametreler: { urun: "Eski Kateter" } },
      ],
    });
    expect(await prisma.order.count()).toBe(0);
    expect(await prisma.documentCounter.count()).toBe(0);
  });

  it("atanmış listede satır yoksa varsayılana düşülmez (X-10 §(3))", async () => {
    const ozel = await prisma.priceList.create({ data: { code: "OZEL", name: "Özel" } });
    await prisma.doctor.update({ where: { id: s.doctor.id }, data: { priceListId: ozel.id } });
    const sonuc = await createOrder(null, siparisFormu(s.doctor.id, s.product.id));
    expect(sonuc?.bildirimler.map((b) => b.kural_kodu)).toEqual(["FIYAT_COZUMLENEMEDI"]);
  });

  it("atanmış listenin fiyatı varsayılanın önüne geçer (X-10 §(2))", async () => {
    const ozel = await prisma.priceList.create({ data: { code: "OZEL", name: "Özel" } });
    await prisma.priceListItem.create({
      data: { priceListId: ozel.id, productId: s.product.id, listPrice: "900" },
    });
    await prisma.doctor.update({ where: { id: s.doctor.id }, data: { priceListId: ozel.id } });
    await createOrder(null, siparisFormu(s.doctor.id, s.product.id));
    const [item] = await prisma.orderItem.findMany();
    expect(item.listPrice.toFixed(2)).toBe("900.00");
  });

  it("4 haneden fazla ondalıklı fiyat reddedilir — float'a düşmez (X-5)", async () => {
    const sonuc = await createOrder(null, siparisFormu(s.doctor.id, s.product.id, "10.12345"));
    expect(sonuc?.durum).toBe("ENGELLENDI");
    expect(await prisma.order.count()).toBe(0);
  });
});

describe("bedelsiz satır ve onayı (A-2-1, A-2-2)", () => {
  let s: Awaited<ReturnType<typeof seed>>;
  beforeEach(async () => {
    s = await seed();
  });
  const bedelsizFormu = (bedelsiz: Record<string, string>, gerekce?: string) => {
    const fd = new FormData();
    fd.set("doctorId", s.doctor.id);
    fd.set(
      "items",
      JSON.stringify([
        { productId: s.product.id, quantity: 1 },
        { productId: s.product.id, quantity: 2, bedelsiz },
      ])
    );
    if (gerekce) fd.set("gerekce", gerekce);
    return fd;
  };
  const satirlar = () =>
    prisma.orderItem.findMany({
      orderBy: { isFree: "asc" },
      select: { isFree: true, freeReason: true, freeNote: true, unitPrice: true, listPrice: true },
    });

  it("numune bedelsiz satırı onaysız kaydolur: tutar 0, liste fiyatı görünür, sebep donar; blok açılmaz", async () => {
    expect(await createOrder(null, bedelsizFormu({ sebep: "NUMUNE" }))).toBeUndefined();
    const [, bedelsiz] = await satirlar();
    expect([bedelsiz.isFree, bedelsiz.freeReason, bedelsiz.unitPrice.toFixed(2), bedelsiz.listPrice.toFixed(2)]).toEqual([
      true,
      "NUMUNE",
      "0.00",
      "1000.00",
    ]);
    expect(await prisma.approvalBlock.count()).toBe(0);
  });

  it("numune dışı sebep gerekçesiz YUMUSAK döner, sipariş ve numara yazılmaz; gerekçeyle sipariş kaydolur ve onaya gider", async () => {
    const r = await createOrder(null, bedelsizFormu({ sebep: "PROMOSYON" }));
    expect(r?.durum).toBe("ONAY_GEREKLI");
    expect(r?.bildirimler.map((b) => [b.kural_kodu, b.parametreler])).toEqual([
      ["BEDELSIZ_ONAYI", { urun: "Stent", sebep: "PROMOSYON" }],
    ]);
    expect(await prisma.order.count()).toBe(0);
    expect(await prisma.documentCounter.count()).toBe(0);

    expect(await createOrder(null, bedelsizFormu({ sebep: "PROMOSYON" }, "Kongre standı"))).toBeUndefined();
    const o = await prisma.order.findFirstOrThrow();
    expect(await prisma.approvalBlock.findMany({ select: { documentType: true, documentId: true, ruleCode: true, openReason: true, decision: true } })).toEqual([
      { documentType: "SIP", documentId: o.id, ruleCode: "BEDELSIZ_ONAYI", openReason: "Kongre standı", decision: null },
    ]);
  });

  it("DIGER sebebinde açıklama zorunludur; açıklama donar", async () => {
    expect((await createOrder(null, bedelsizFormu({ sebep: "DIGER" }, "x")))?.bildirimler[0].kural_kodu).toBe(
      "BEDELSIZ_ACIKLAMA_ZORUNLU"
    );
    expect(await createOrder(null, bedelsizFormu({ sebep: "DIGER", aciklama: "Hasta yakını" }, "x"))).toBeUndefined();
    const [, bedelsiz] = await satirlar();
    expect([bedelsiz.freeReason, bedelsiz.freeNote]).toEqual(["DIGER", "Hasta yakını"]);
  });

  it("veritabanı: bedelsiz satır sebepsiz, bedelli satır sebepli, DIGER açıklamasız yazılamaz (CHECK)", async () => {
    const o = await prisma.order.create({
      data: { documentNo: "SIP-C", doctorId: s.doctor.id, stage: "ONAYLI", status: "BEKLIYOR", paymentTermDays: 30 },
    });
    const satir = (veri: object) =>
      prisma.orderItem.create({
        data: { orderId: o.id, productId: s.product.id, quantity: 1, listPrice: "1", unitPrice: "0", vatRate: "20", ...veri },
      });
    await expect(satir({ isFree: true })).rejects.toThrow();
    await expect(satir({ isFree: false, freeReason: "NUMUNE" })).rejects.toThrow();
    await expect(satir({ isFree: true, freeReason: "DIGER" })).rejects.toThrow();
    await expect(satir({ isFree: true, freeReason: "DIGER", freeNote: "  " })).rejects.toThrow();
    await expect(satir({ isFree: true, freeReason: "DIGER", freeNote: "ok" })).resolves.toBeTruthy();
  });
});
