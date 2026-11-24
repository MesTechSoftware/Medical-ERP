import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db";
import { degistirDoktorSahibi } from "@/lib/sahiplik";
import { siparisiSevkEt, topluKargo, type SevkSonucu, type TopluSatirSonucu } from "@/lib/sevk-et";
import { referansVeri, yeniDoktorVerisi } from "../../test/integration/referans";

// A-3-3 — sevk çekirdeği: kart formu ve toplu kargo aynı yoldan; toplu kargoda her sipariş ayrı işlem.

let s: Awaited<ReturnType<typeof seed>>;
let no = 0;

async function seed() {
  const ref = await referansVeri();
  const yonetici = await prisma.user.create({ data: { name: "Y", email: "y@medikal.local", passwordHash: "x", role: "YONETICI" } });
  const satici = await prisma.user.create({ data: { name: "S", email: "s@medikal.local", passwordHash: "x", role: "SATICI" } });
  const doktor = await prisma.doctor.create({ data: yeniDoktorVerisi("Dr. Kargo") });
  await prisma.$transaction((tx) => degistirDoktorSahibi([doktor.id], satici.id, { metin: "t", yapanId: yonetici.id }, tx));
  const urun = await prisma.product.create({ data: { name: "Stent", code: "STN-K", taxRateId: ref.kdv20.id } });
  const stoksuz = await prisma.product.create({ data: { name: "Kateter", code: "KAT-K", taxRateId: ref.kdv20.id } });
  await prisma.stockMovement.create({ data: { productId: urun.id, locationId: ref.depo.id, type: "GIRIS", quantity: 100 } });
  const firma = await prisma.carrier.create({ data: { name: "Test Kargo K" } });
  return { ...ref, yonetici, satici, doktor, urun, stoksuz, firma };
}

beforeEach(async () => {
  s = await seed();
});

async function siparis(kalemler: { urun?: string; miktar: number; bedelsiz?: boolean }[]) {
  no += 1;
  return prisma.order.create({
    data: {
      documentNo: `SIP-K-${no}`,
      doctorId: s.doktor.id,
      sellerId: s.satici.id,
      stage: "ONAYLI",
      status: "HAZIRLANIYOR",
      paymentTermDays: 30,
      items: {
        create: kalemler.map((k) => ({
          productId: k.urun ?? s.urun.id,
          quantity: k.miktar,
          listPrice: "40",
          unitPrice: k.bedelsiz ? "0" : "30",
          vatRate: "20",
          isFree: k.bedelsiz ?? false,
          freeReason: k.bedelsiz ? "NUMUNE" : null,
        })),
      },
    },
    include: { items: { orderBy: { id: "asc" } } },
  });
}

const yonetici = () => ({ id: s.yonetici.id, rol: "YONETICI" as const });
const kodlar = (r: SevkSonucu | TopluSatirSonucu["sonuc"]) => (r.durum === "HATA" ? r.sonuc.bildirimler.map((b) => b.kural_kodu) : []);

describe("siparisiSevkEt — tek sipariş", () => {
  it("başarı: SVK yazılır ve denetim kaydı bırakılır", async () => {
    const o = await siparis([{ miktar: 3 }]);
    const r = await siparisiSevkEt({
      siparisId: o.id,
      kalemler: [{ siparisKalemiId: o.items[0].id, miktar: 3 }],
      carrierId: s.firma.id,
      trackingNumber: "TR1",
      externalDispatchNo: null,
      yapan: yonetici(),
      gerekce: null,
    });
    expect(r).toMatchObject({ durum: "SEVK_EDILDI", tamamlandi: true });
    expect(await prisma.shipment.count({ where: { orderId: o.id } })).toBe(1);
    expect(await prisma.auditLog.count({ where: { entityType: "Order", entityId: o.id } })).toBe(1);
  });

  it("kalan aşımı: HATA, hiçbir şey yazılmaz", async () => {
    const o = await siparis([{ miktar: 3 }]);
    const r = await siparisiSevkEt({
      siparisId: o.id,
      kalemler: [{ siparisKalemiId: o.items[0].id, miktar: 4 }],
      carrierId: null,
      trackingNumber: null,
      externalDispatchNo: null,
      yapan: yonetici(),
      gerekce: null,
    });
    expect(kodlar(r)).toContain("SEVK_MIKTARI_ASILDI");
    expect(await prisma.shipment.count({ where: { orderId: o.id } })).toBe(0);
    expect(await prisma.auditLog.count({ where: { entityId: o.id } })).toBe(0);
  });
});

describe("topluKargo (A-3-3)", () => {
  it("her sipariş ayrı işlem: onay bloklu yazılmaz, öbürleri kalanlarının tamamıyla, kendi takip ve irsaliyeleriyle yazılır", async () => {
    const a = await siparis([{ miktar: 3 }]);
    const b = await siparis([{ miktar: 2 }, { miktar: 1, bedelsiz: true }]); // bedelsiz NUMUNE: onay gerekmez
    const bloklu = await siparis([{ miktar: 1 }, { miktar: 1, bedelsiz: true }]);
    await prisma.approvalBlock.create({
      data: { documentType: "SIP", documentId: bloklu.id, ruleCode: "BEDELSIZ_ONAYI", openedById: s.satici.id, openReason: "Kongre" },
    });
    // a kısmen sevk edilmiş: kalan 2
    await siparisiSevkEt({
      siparisId: a.id,
      kalemler: [{ siparisKalemiId: a.items[0].id, miktar: 1 }],
      carrierId: null,
      trackingNumber: null,
      externalDispatchNo: null,
      yapan: yonetici(),
      gerekce: null,
    });

    const sonuc = await topluKargo(
      [
        { siparisId: a.id, takip: "TR-A", irsaliye: "IRS-A" },
        { siparisId: bloklu.id, takip: "TR-X", irsaliye: null },
        { siparisId: b.id, takip: "TR-B", irsaliye: null },
      ],
      s.firma.id,
      yonetici()
    );

    expect(sonuc.map((r) => [r.documentNo, r.sonuc.durum])).toEqual([
      [a.documentNo, "SEVK_EDILDI"],
      [bloklu.documentNo, "HATA"],
      [b.documentNo, "SEVK_EDILDI"],
    ]);
    expect(sonuc[0].cari).toBe("Dr. Kargo");
    expect(kodlar(sonuc[1].sonuc)).toEqual(["ONAY_BEKLIYOR"]);

    const sonA = await prisma.shipment.findFirstOrThrow({ where: { orderId: a.id }, orderBy: { createdAt: "desc" }, include: { items: true } });
    expect(sonA).toMatchObject({ carrierId: s.firma.id, trackingNumber: "TR-A", externalDispatchNo: "IRS-A" });
    expect(sonA.items.map((i) => i.quantity)).toEqual([2]);
    const svkB = await prisma.shipment.findFirstOrThrow({ where: { orderId: b.id }, include: { items: true } });
    expect(svkB.trackingNumber).toBe("TR-B");
    expect(svkB.items.map((i) => i.quantity).sort()).toEqual([1, 2]);

    expect((await prisma.order.findUniqueOrThrow({ where: { id: a.id } })).status).toBe("KARGOLANDI");
    expect((await prisma.order.findUniqueOrThrow({ where: { id: bloklu.id } })).status).toBe("HAZIRLANIYOR");
    expect(await prisma.shipment.count({ where: { orderId: bloklu.id } })).toBe(0);
  });

  it("negatif stokta gerekçesiz yönetici: HATA (ONAY_GEREKLI), sevkiyat yok; öbür sipariş yazılır", async () => {
    const stoksuz = await siparis([{ urun: s.stoksuz.id, miktar: 1 }]);
    const normal = await siparis([{ miktar: 1 }]);
    const sonuc = await topluKargo(
      [
        { siparisId: stoksuz.id, takip: null, irsaliye: null },
        { siparisId: normal.id, takip: null, irsaliye: null },
      ],
      null,
      yonetici()
    );
    const [r0, r1] = sonuc.map((r) => r.sonuc);
    expect(r0.durum === "HATA" && r0.sonuc.durum).toBe("ONAY_GEREKLI");
    expect(r1.durum).toBe("SEVK_EDILDI");
    expect(await prisma.shipment.count({ where: { orderId: stoksuz.id } })).toBe(0);
  });

  it("bayat kalan: seçimden sonra kısmi sevk edilen sipariş tam kalanını yine gönderir; bulunmayan sipariş HATA", async () => {
    const o = await siparis([{ miktar: 2 }]);
    await siparisiSevkEt({
      siparisId: o.id,
      kalemler: [{ siparisKalemiId: o.items[0].id, miktar: 2 }],
      carrierId: null,
      trackingNumber: null,
      externalDispatchNo: null,
      yapan: yonetici(),
      gerekce: null,
    });
    const sonuc = await topluKargo(
      [
        { siparisId: o.id, takip: null, irsaliye: null },
        { siparisId: "yok-boyle-siparis", takip: null, irsaliye: null },
      ],
      null,
      yonetici()
    );
    // Kalan sıfır olan (tamamlanmış) sipariş sevk edilmez; durumu artık uygun değil.
    expect(sonuc.map((r) => r.sonuc.durum)).toEqual(["HATA", "HATA"]);
    // Kalanı kalmamış sipariş "kalem giriniz" demez; artık kargo beklemediğini söyler.
    expect(kodlar(sonuc[0].sonuc)).toEqual(["SIPARIS_DURUMU_UYGUN_DEGIL"]);
    expect(kodlar(sonuc[1].sonuc)).toEqual(["SIPARIS_DURUMU_UYGUN_DEGIL"]);
    expect(sonuc[1].documentNo).toBeNull();
  });

  it("teknik hata (X-3) yalnız o siparişi düşürür: referansla döner, öbür sipariş yazılır", async () => {
    const bozuk = await siparis([{ miktar: 1 }]);
    const normal = await siparis([{ miktar: 1 }]);
    const hata = vi.spyOn(console, "error").mockImplementation(() => {});
    const sonuc = await topluKargo(
      [
        // İrsaliye kolonu 32 karakterdir; ekran kırpar, doğrudan çağrı veritabanı hatası üretir.
        { siparisId: bozuk.id, takip: null, irsaliye: "X".repeat(40) },
        { siparisId: normal.id, takip: null, irsaliye: null },
      ],
      null,
      yonetici()
    );
    hata.mockRestore();
    expect(sonuc[0].sonuc).toEqual({ durum: "TEKNIK", referans: expect.stringMatching(/^[0-9a-f]{8}$/) });
    expect(sonuc[1].sonuc.durum).toBe("SEVK_EDILDI");
    expect(await prisma.shipment.count({ where: { orderId: bozuk.id } })).toBe(0);
  });
});

describe("limit ve vade BİLGİ şeridi (A-12-6)", () => {
  it("sevkiyat sonrası risk limiti aşarsa tekli ve toplu sonuç LIMIT_ASILDI taşır; sevkiyat yine yazılır", async () => {
    await prisma.doctor.update({ where: { id: s.doktor.id }, data: { creditLimit: "10" } });
    const a = await siparis([{ miktar: 1 }]);
    const tek = await siparisiSevkEt({
      siparisId: a.id,
      kalemler: [{ siparisKalemiId: a.items[0].id, miktar: 1 }],
      carrierId: null,
      trackingNumber: null,
      externalDispatchNo: null,
      yapan: yonetici(),
      gerekce: null,
    });
    expect(tek.durum).toBe("SEVK_EDILDI");
    if (tek.durum === "SEVK_EDILDI") expect(tek.bildirimler.map((x) => x.kural_kodu)).toEqual(["LIMIT_ASILDI"]);
    expect(await prisma.shipment.count({ where: { orderId: a.id } })).toBe(1);

    const b = await siparis([{ miktar: 1 }]);
    const [toplu] = await topluKargo([{ siparisId: b.id, takip: null, irsaliye: null }], s.firma.id, yonetici());
    expect(toplu.sonuc.durum).toBe("SEVK_EDILDI");
    if (toplu.sonuc.durum === "SEVK_EDILDI") expect(toplu.sonuc.bildirimler.map((x) => x.kural_kodu)).toContain("LIMIT_ASILDI");
  });

  it("limit tanımsızken (null) bilgi yoktur", async () => {
    const a = await siparis([{ miktar: 1 }]);
    const r = await siparisiSevkEt({
      siparisId: a.id,
      kalemler: [{ siparisKalemiId: a.items[0].id, miktar: 1 }],
      carrierId: null,
      trackingNumber: null,
      externalDispatchNo: null,
      yapan: yonetici(),
      gerekce: null,
    });
    if (r.durum === "SEVK_EDILDI") expect(r.bildirimler).toEqual([]);
    else throw new Error(r.durum);
  });
});
