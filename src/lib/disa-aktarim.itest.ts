import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db";
import { calistirDisaAktarim } from "@/lib/disa-aktarim";
import { referansVeri, yeniDoktorVerisi } from "../../test/integration/referans";

// D-5-1 · D-5-2 — veri setleri ve kütük.
const h = vi.hoisted(() => ({ adminId: "" }));
vi.mock("@/lib/session", () => ({
  requireAdmin: async () => ({ user: { id: h.adminId, role: "YONETICI" } }),
}));
const { disaAktar } = await import("@/app/(admin)/exports/actions");

let s: Awaited<ReturnType<typeof seed>>;

async function seed() {
  const ref = await referansVeri();
  const admin = await prisma.user.create({
    data: { name: "Yönetici", email: "y@medikal.local", passwordHash: "x", role: "YONETICI" },
  });
  h.adminId = admin.id;
  const doktor = await prisma.doctor.create({
    data: { ...yeniDoktorVerisi("Dr. Ayşe Kaya"), taxId: "1234567890", invoiceTitle: "Kaya Klinik Ltd." },
  });
  const urun = await prisma.product.create({ data: { name: "Stent", code: "MED-001", taxRateId: ref.kdv20.id } });
  return { ...ref, admin, doktor, urun };
}

beforeEach(async () => {
  s = await seed();
});

// İstanbul 01.10.2026 00:00 = UTC 30.09 21:00; Ekim aralığı [01.10, 01.11).
const EKIM = { baslangic: new Date("2026-09-30T21:00:00Z"), bitis: new Date("2026-10-31T21:00:00Z") };

const siparis = (no: string, stage: "ONAYLI" | "TEKLIF", status: "BEKLIYOR" | "IPTAL", orderDate: string) =>
  prisma.order.create({
    data: {
      documentNo: no,
      doctorId: s.doktor.id,
      stage,
      status,
      paymentTermDays: 30,
      orderDate: new Date(orderDate),
      items: {
        create: [
          { productId: s.urun.id, quantity: 3, listPrice: "100", unitPrice: "33.335", vatRate: "20" },
          { productId: s.urun.id, quantity: 1, listPrice: "100", unitPrice: "0", vatRate: "20", isFree: true },
        ],
      },
    },
  });

describe("sipariş veri seti — sayılan belgeler + hesaplaSatirTutarlari (D-5-1)", () => {
  it("teklif ve iptal çıkmaz; tutarlar satır hesabından, bedelsiz satır işaretli ve KDV'siz", async () => {
    await siparis("SIP-1", "ONAYLI", "BEKLIYOR", "2026-10-05T09:00:00Z");
    await siparis("SIP-2", "TEKLIF", "BEKLIYOR", "2026-10-05T09:00:00Z");
    await siparis("SIP-3", "ONAYLI", "IPTAL", "2026-10-05T09:00:00Z");
    await siparis("SIP-4", "ONAYLI", "BEKLIYOR", "2026-09-30T20:59:00Z"); // İstanbul 30.09 23:59 — aralık dışı

    const c = await calistirDisaAktarim({ kod: "SIPARIS", aralik: EKIM });
    expect(c.kolonlar.map((k) => k.baslik)).toContain("Toplam (KDV dahil)");
    expect(c.satirlar).toEqual([
      ["SIP-1", "2026-10-05", "Dr. Ayşe Kaya", null, "MED-001", "Stent", "3", "33.3350", "100.01", "20.00", "20.00", "120.01", "HAYIR"],
      ["SIP-1", "2026-10-05", "Dr. Ayşe Kaya", null, "MED-001", "Stent", "1", "0.0000", "0.00", "20.00", "0.00", "0.00", "EVET"],
    ]);
  });
});

describe("cari hareket veri seti — mutabakat için bütün tipler (D-5-1)", () => {
  it("açılış dahil aralıktaki hareketler tipi ve yönüyle; aralık yarı açık, İstanbul günü", async () => {
    const hareket = (type: "ACILIS" | "SEVKIYAT", createdAt: string, dueDate?: string) =>
      prisma.ledgerEntry.create({
        data: {
          doctorId: s.doktor.id,
          type,
          direction: "BORC",
          amount: "1000",
          documentNo: `T-${createdAt}`,
          createdById: s.admin.id,
          createdAt: new Date(createdAt),
          dueDate: dueDate ? new Date(`${dueDate}T00:00:00Z`) : null,
        },
      });
    await hareket("ACILIS", "2026-09-30T21:00:00Z"); // İstanbul 01.10 00:00 — dahil
    await hareket("SEVKIYAT", "2026-10-15T10:00:00Z", "2026-11-14");
    await hareket("SEVKIYAT", "2026-10-31T21:00:00Z"); // İstanbul 01.11 00:00 — hariç

    const c = await calistirDisaAktarim({ kod: "CARI_HAREKET", aralik: EKIM });
    expect(c.satirlar.map((r) => [r[0], r[4], r[5], r[6], r[7]])).toEqual([
      ["2026-10-01", "ACILIS", "BORC", "1000.00", null],
      ["2026-10-15", "SEVKIYAT", "BORC", "1000.00", "2026-11-14"],
    ]);
  });
});

describe("tahsilat ve stok veri setleri (D-5-1)", () => {
  it("tahsilat iptal edilmiş olanı durumuyla verir; komisyon donmuş değerdir", async () => {
    const yaz = (no: string, status: "AKTIF" | "IPTAL") =>
      prisma.doctorPayment.create({
        data: {
          documentNo: no,
          doctorId: s.doktor.id,
          amount: "500",
          paymentMethodId: s.havale.id,
          commissionRate: "1.5",
          commissionAmount: "7.5",
          paidAt: new Date("2026-10-10T08:00:00Z"),
          recordedBy: s.admin.id,
          status,
        },
      });
    await yaz("THS-1", "AKTIF");
    await yaz("THS-2", "IPTAL");
    const c = await calistirDisaAktarim({ kod: "TAHSILAT", aralik: EKIM });
    expect(c.satirlar.map((r) => [r[1], r[5], r[6], r[7], r[9]])).toEqual([
      ["THS-1", "500.00", "1.50", "7.50", "AKTIF"],
      ["THS-2", "500.00", "1.50", "7.50", "IPTAL"],
    ]);
  });

  it("stok gün sonu itibarıyla miktar verir; tutar kolonu yok, sıfır satır çıkmaz", async () => {
    const hareket = (quantity: number, createdAt: string) =>
      prisma.stockMovement.create({
        data: { productId: s.urun.id, locationId: s.depo.id, type: "GIRIS", quantity, createdAt: new Date(createdAt) },
      });
    await hareket(10, "2026-10-10T20:59:00Z"); // İstanbul 10.10 23:59
    await hareket(5, "2026-10-10T21:00:00Z"); // İstanbul 11.10 00:00
    const c = await calistirDisaAktarim({ kod: "STOK", tarih: new Date("2026-10-10T00:00:00Z") });
    expect(c.kolonlar.every((k) => !/tutar|fiyat/i.test(k.baslik))).toBe(true);
    expect(c.satirlar).toEqual([["MED-001", "Stent", expect.any(String), "10", "2026-10-10"]]);
    const once = await calistirDisaAktarim({ kod: "STOK", tarih: new Date("2026-10-09T00:00:00Z") });
    expect(once.satirlar).toEqual([]);
  });

  it("doktor listesi vergi kimliği ve fatura alanlarını taşır", async () => {
    const c = await calistirDisaAktarim({ kod: "DOKTOR_LISTESI" });
    const vkn = c.kolonlar.findIndex((k) => k.baslik === "VKN / TCKN");
    expect(c.satirlar[0][vkn]).toBe("1234567890");
  });
});

describe("dışa aktarım kütüğü (D-5-2)", () => {
  const form = (alanlar: Record<string, string>) => {
    const fd = new FormData();
    for (const [k, v] of Object.entries(alanlar)) fd.set(k, v);
    return fd;
  };

  it("her çalıştırma kimlik, veri seti, parametre ve satır sayısıyla yazılır; içerik yazılmaz", async () => {
    await siparis("SIP-1", "ONAYLI", "BEKLIYOR", "2026-10-05T09:00:00Z");
    const r = await disaAktar(null, form({ kod: "SIPARIS", bicim: "xlsx", baslangic: "2026-10-01", bitis: "2026-10-31" }));
    expect(r).toMatchObject({ durum: "BASARILI", parametreler: { satir: 2 } });
    expect(Buffer.from(r.dosya!.icerik, "base64").subarray(0, 2).toString()).toBe("PK");

    const [k] = await prisma.exportLog.findMany();
    expect(k).toMatchObject({
      userId: s.admin.id,
      datasetCode: "SIPARIS",
      parameters: { baslangic: "2026-10-01", bitis: "2026-10-31", bicim: "xlsx" },
      rowCount: 2,
    });
    expect(JSON.stringify(k)).not.toMatch(/Ayşe|Stent|120/);
  });

  it("dönem zorunludur; tüm zamanlar bilinçli seçimdir; ters aralık reddedilir, kütüğe yazılmaz", async () => {
    expect((await disaAktar(null, form({ kod: "TAHSILAT", bicim: "csv" }))).bildirimler[0]).toMatchObject({
      kural_kodu: "ALAN_ZORUNLU",
      alan: "baslangic",
    });
    expect(
      (await disaAktar(null, form({ kod: "TAHSILAT", bicim: "csv", baslangic: "2026-10-31", bitis: "2026-10-01" })))
        .bildirimler[0].kural_kodu
    ).toBe("TARIH_ARALIGI_TERS");
    expect(await prisma.exportLog.count()).toBe(0);

    await disaAktar(null, form({ kod: "TAHSILAT", bicim: "csv", tumZamanlar: "on" }));
    expect((await prisma.exportLog.findFirstOrThrow()).parameters).toEqual({ donem: "tum", bicim: "csv" });
  });
});
