import { describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { degistirDoktorSahibi } from "@/lib/sahiplik";
import { getCiroTotal, getDoctorReports, getSellerReports, saticiOrtalamaIskontosu } from "@/lib/reports-service";
import { sayilanBelgeler } from "@/lib/sayilan-belgeler";
import { SIPARIS_SATIRI, siparisToplami } from "@/lib/siparis";
import { TUM_ZAMANLAR } from "@/lib/zaman";
import { referansVeri, yeniDoktorVerisi } from "../../test/integration/referans";

// X-1-1 · X-14-1 · D-4-1. Satıcı raporu dönem zorunlu, yarı açık aralık alır ve satıcı
// başına üç mutlak sayı döner: ciro (matrah, sevkiyat tarihi), hakediş (matrah × donmuş
// oran), tahsilat (brüt, tahsilat tarihi, tahsilat anındaki sahip — X-1 17.10 eki).

const EKIM = { baslangic: new Date("2026-09-30T21:00:00Z"), bitis: new Date("2026-10-31T21:00:00Z") };
const KASIM = { baslangic: new Date("2026-10-31T21:00:00Z"), bitis: new Date("2026-11-30T21:00:00Z") };
const yonetici = (id = "y") => ({ id, role: "YONETICI" as const });

async function kullanici(name: string, email: string, role: "SATICI" | "YONETICI" | "OPERASYON" = "SATICI") {
  return prisma.user.create({ data: { name, email, passwordHash: "test", role } });
}

/** Sahipliği iz kaydıyla verir ve izi `tarih`e geri tarihler (tahsilat anındaki sahip testleri). */
async function sahiplikVer(doktorId: string, sahipId: string | null, tarih: Date) {
  const yapan = await prisma.user.findFirstOrThrow({ orderBy: { createdAt: "asc" } });
  await prisma.$transaction((tx) =>
    degistirDoktorSahibi([doktorId], sahipId, { metin: "test", yapanId: yapan.id }, tx)
  );
  const son = await prisma.doctorAssignment.findFirstOrThrow({ where: { doctorId: doktorId }, orderBy: { changedAt: "desc" } });
  await prisma.doctorAssignment.update({ where: { id: son.id }, data: { changedAt: tarih } });
}

async function doktor(ad: string, sahipId: string | null, accountClass: "DOKTOR" | "BAYI" = "DOKTOR") {
  const d = await prisma.doctor.create({ data: { ...yeniDoktorVerisi(ad), accountClass } });
  if (sahipId) await sahiplikVer(d.id, sahipId, new Date("2020-01-01T00:00:00Z"));
  return d;
}

let no = 0;
async function tahsilat(doctorId: string, amount: string, paidAt: Date, status: "AKTIF" | "IPTAL" = "AKTIF") {
  const { havale } = await referansVeri();
  no += 1;
  const kaydeden = await prisma.user.findFirstOrThrow();
  return prisma.doctorPayment.create({
    data: {
      documentNo: `THS-T-${no}`,
      doctorId,
      amount,
      paymentMethodId: havale.id,
      commissionRate: "0",
      commissionAmount: "0",
      recordedBy: kaydeden.id,
      paidAt,
      status,
    },
  });
}

type Satir = { unitPrice: string; quantity: number; primOrani?: string | null; isFree?: boolean; listPrice?: string };

/** Siparişi açar ve tamamını `shippedAt` anında sevk eder; satırın oranı sevkiyat satırına donar. */
async function sevkliSiparis(
  sellerId: string | null,
  doctorId: string,
  shippedAt: Date,
  satirlar: Satir[],
  siparis: { stage?: "TEKLIF" | "ONAYLI"; status?: "BEKLIYOR" | "IPTAL" } = {}
) {
  const { kdv20 } = await referansVeri();
  no += 1;
  const urun = await prisma.product.create({ data: { name: `Ü${no}`, code: `U${no}`, taxRateId: kdv20.id } });
  const order = await prisma.order.create({
    data: {
      documentNo: `SIP-T-${no}`,
      sellerId,
      doctorId,
      paymentTermDays: 30,
      stage: siparis.stage ?? "ONAYLI",
      status: siparis.status ?? "BEKLIYOR",
      items: {
        create: satirlar.map((s) => ({
          productId: urun.id,
          quantity: s.quantity,
          listPrice: s.listPrice ?? s.unitPrice,
          unitPrice: s.unitPrice,
          vatRate: "20",
          isFree: s.isFree ?? false,
          freeReason: s.isFree ? "NUMUNE" : null,
        })),
      },
    },
    include: { items: { orderBy: { id: "asc" } } },
  });
  await prisma.shipment.create({
    data: {
      documentNo: `SVK-T-${no}`,
      orderId: order.id,
      shippedAt,
      items: {
        create: order.items.map((it, i) => ({
          orderItemId: it.id,
          quantity: satirlar[i].quantity,
          commissionRate: satirlar[i].primOrani ?? null,
        })),
      },
    },
  });
  return order;
}

const satiri = async (kullanici: Parameters<typeof getSellerReports>[0], donem: typeof EKIM, ad: string) =>
  (await getSellerReports(kullanici, donem)).find((r) => r.name === ad)!;

describe("satıcı raporu — dönem cirosu ve hakedişi (X-1-1 · X-14-1)", () => {
  it("ciro sevkiyat tarihi dönemde olan satırların matrahıdır; bitiş hariçtir", async () => {
    const ali = await kullanici("Ali", "ali@medikal.local");
    const d = await doktor("Dr. A", ali.id);
    await sevkliSiparis(ali.id, d.id, new Date("2026-10-05T10:00:00Z"), [{ unitPrice: "90", quantity: 4, listPrice: "100" }]);
    await sevkliSiparis(ali.id, d.id, EKIM.bitis, [{ unitPrice: "1000", quantity: 1 }]); // Kasım'ın ilk anı
    await sevkliSiparis(ali.id, d.id, new Date("2026-09-30T20:59:59Z"), [{ unitPrice: "500", quantity: 1 }]); // Eylül

    const r = await satiri(yonetici(), EKIM, "Ali");
    expect(r.ciro.toFixed(2)).toBe("360.00");
    expect(r.ortalamaIskonto?.toFixed(2)).toBe("10.00");
    expect((await satiri(yonetici(), KASIM, "Ali")).ciro.toFixed(2)).toBe("1000.00");
  });

  it("ciro siparişin satıcısına yazılır; doktorun sonraki devri taşımaz (X-13 §(4))", async () => {
    const ali = await kullanici("Ali", "ali@medikal.local");
    const veli = await kullanici("Veli", "veli@medikal.local");
    const d = await doktor("Dr. A", ali.id);
    await sevkliSiparis(ali.id, d.id, new Date("2026-10-05T10:00:00Z"), [{ unitPrice: "100", quantity: 1, primOrani: "5" }]);
    const once = await satiri(yonetici(), EKIM, "Ali");

    await sahiplikVer(d.id, veli.id, new Date("2026-10-20T00:00:00Z"));
    const sonra = await satiri(yonetici(), EKIM, "Ali");
    expect(sonra.ciro.toFixed(2)).toBe(once.ciro.toFixed(2));
    expect(sonra.hakedis.toFixed(2)).toBe("5.00");
    expect((await satiri(yonetici(), EKIM, "Veli")).ciro.toFixed(2)).toBe("0.00");
  });

  it("hakediş satır matrahı × satıra donmuş orandır; oranı boş ve bedelsiz satır doğurmaz", async () => {
    const ali = await kullanici("Ali", "ali@medikal.local");
    const d = await doktor("Dr. A", ali.id);
    await sevkliSiparis(ali.id, d.id, new Date("2026-10-05T10:00:00Z"), [
      { unitPrice: "100", quantity: 2, primOrani: "5" }, // 200 × %5 = 10
      { unitPrice: "300", quantity: 1, primOrani: "10" }, // 300 × %10 = 30
      { unitPrice: "50", quantity: 1, primOrani: null },
      { unitPrice: "80", quantity: 1, primOrani: "5", isFree: true },
    ]);
    const r = await satiri(yonetici(), EKIM, "Ali");
    expect(r.ciro.toFixed(2)).toBe("550.00");
    expect(r.hakedis.toFixed(2)).toBe("40.00");
  });

  it("satıcının oranı sonradan değişse geçmiş hakediş değişmez (X-14 §(3))", async () => {
    const ali = await kullanici("Ali", "ali@medikal.local");
    const d = await doktor("Dr. A", ali.id);
    await sevkliSiparis(ali.id, d.id, new Date("2026-10-05T10:00:00Z"), [{ unitPrice: "100", quantity: 1, primOrani: "5" }]);
    await prisma.user.update({ where: { id: ali.id }, data: { commissionRate: "20" } });
    expect((await satiri(yonetici(), EKIM, "Ali")).hakedis.toFixed(2)).toBe("5.00");
  });

  it("hakediş dönem cirosunun büyüklüğüne bağlı değildir (D-4-1)", async () => {
    const ali = await kullanici("Ali", "ali@medikal.local");
    const d = await doktor("Dr. A", ali.id);
    await sevkliSiparis(ali.id, d.id, new Date("2026-10-05T10:00:00Z"), [{ unitPrice: "100", quantity: 1, primOrani: "5" }]);
    await sevkliSiparis(ali.id, d.id, new Date("2026-11-05T10:00:00Z"), [{ unitPrice: "90000", quantity: 1, primOrani: "5" }]);
    expect((await satiri(yonetici(), EKIM, "Ali")).hakedis.toFixed(2)).toBe("5.00");
    expect((await satiri(yonetici(), TUM_ZAMANLAR, "Ali")).hakedis.toFixed(2)).toBe("4505.00");
  });

  it("TEKLIF ve iptal siparişin sevk satırı sayılmaz — sayılan belgeler filtresi (A-5-6)", async () => {
    const ali = await kullanici("Ali", "ali@medikal.local");
    const d = await doktor("Dr. A", ali.id);
    const an = new Date("2026-10-05T10:00:00Z");
    await sevkliSiparis(ali.id, d.id, an, [{ unitPrice: "100", quantity: 1, primOrani: "5" }]);
    await sevkliSiparis(ali.id, d.id, an, [{ unitPrice: "7000", quantity: 1, primOrani: "5" }], { stage: "TEKLIF" });
    await sevkliSiparis(ali.id, d.id, an, [{ unitPrice: "9000", quantity: 1, primOrani: "5" }], { status: "IPTAL" });

    const r = await satiri(yonetici(), EKIM, "Ali");
    expect(r.ciro.toFixed(2)).toBe("100.00");
    expect(r.hakedis.toFixed(2)).toBe("5.00");
    expect((await getCiroTotal(EKIM)).toFixed(2)).toBe("100.00");
    const [dr] = await getDoctorReports(EKIM, 50, { tur: "sirket" });
    expect(dr.ciro.toFixed(2)).toBe("100.00");
  });

  it("sevkiyat yoksa ciro ve hakediş sıfırdır, ortalama iskonto boştur", async () => {
    await kullanici("Ali", "ali@medikal.local");
    const r = await satiri(yonetici(), EKIM, "Ali");
    expect(r.ciro.toFixed(2)).toBe("0.00");
    expect(r.hakedis.toFixed(2)).toBe("0.00");
    expect(r.ortalamaIskonto).toBeNull();
  });
});

describe("satıcı raporu — dönem tahsilatı (X-1 17.10 eki)", () => {
  it("dönemdeki aktif tahsilatlar; iptal, dönem dışı ve başkasınınki sayılmaz", async () => {
    const ali = await kullanici("Ali", "ali@medikal.local");
    const veli = await kullanici("Veli", "veli@medikal.local");
    const d1 = await doktor("Dr. A", ali.id);
    const d2 = await doktor("Dr. B", veli.id);
    await tahsilat(d1.id, "1000.00", new Date("2026-10-02T10:00:00Z"));
    await tahsilat(d1.id, "2500.50", new Date("2026-10-30T10:00:00Z"));
    await tahsilat(d1.id, "9999.99", new Date("2026-10-10T10:00:00Z"), "IPTAL");
    await tahsilat(d1.id, "7777.00", EKIM.bitis);
    await tahsilat(d2.id, "700.00", new Date("2026-10-10T10:00:00Z"));

    expect((await satiri(yonetici(), EKIM, "Ali")).tahsilat.toFixed(2)).toBe("3500.50");
    expect((await satiri(yonetici(), EKIM, "Veli")).tahsilat.toFixed(2)).toBe("700.00");
  });

  it("tahsilat anındaki sahibe sayılır; devir geçmiş tahsilatı taşımaz", async () => {
    const ali = await kullanici("Ali", "ali@medikal.local");
    const veli = await kullanici("Veli", "veli@medikal.local");
    const d = await doktor("Dr. A", ali.id);
    await tahsilat(d.id, "100.00", new Date("2026-10-05T10:00:00Z"));
    const once = await satiri(yonetici(), EKIM, "Ali");

    await sahiplikVer(d.id, veli.id, new Date("2026-10-15T00:00:00Z"));
    await tahsilat(d.id, "40.00", new Date("2026-10-20T10:00:00Z"));

    expect(once.tahsilat.toFixed(2)).toBe("100.00");
    expect((await satiri(yonetici(), EKIM, "Ali")).tahsilat.toFixed(2)).toBe("100.00");
    expect((await satiri(yonetici(), EKIM, "Veli")).tahsilat.toFixed(2)).toBe("40.00");
  });

  it("ilk devirden önceki tahsilat, devirden önceki sahibe sayılır", async () => {
    const ali = await kullanici("Ali", "ali@medikal.local");
    const veli = await kullanici("Veli", "veli@medikal.local");
    // Satıcının açtığı doktorda açılış iz satırı yoktur (X-13 §(2)): sahip doğrudan yazılır.
    const d = await prisma.doctor.create({ data: { ...yeniDoktorVerisi("Dr. A"), ownerSellerId: ali.id } });
    await tahsilat(d.id, "100.00", new Date("2026-10-05T10:00:00Z"));
    await sahiplikVer(d.id, veli.id, new Date("2026-10-15T00:00:00Z"));

    expect((await satiri(yonetici(), EKIM, "Ali")).tahsilat.toFixed(2)).toBe("100.00");
    expect((await satiri(yonetici(), EKIM, "Veli")).tahsilat.toFixed(2)).toBe("0.00");
  });

  it("tahsilat anında sahipsiz doktorun ve BAYI'nin tahsilatı hiçbir satıcıya sayılmaz", async () => {
    const ali = await kullanici("Ali", "ali@medikal.local");
    const d = await doktor("Dr. A", ali.id);
    await sahiplikVer(d.id, null, new Date("2026-10-10T00:00:00Z"));
    await tahsilat(d.id, "100.00", new Date("2026-10-12T10:00:00Z"));
    await sahiplikVer(d.id, ali.id, new Date("2026-10-20T00:00:00Z"));
    const bayi = await doktor("Bayi A.Ş.", null, "BAYI");
    await tahsilat(bayi.id, "500.00", new Date("2026-10-12T10:00:00Z"));

    expect((await satiri(yonetici(), EKIM, "Ali")).tahsilat.toFixed(2)).toBe("0.00");
  });
});

describe("satıcı raporu — yetki sorguda (X-1 §(8), D-2 §(4))", () => {
  it("SATICI yalnız kendi satırını alır; YONETICI bütün satıcıları", async () => {
    const ali = await kullanici("Ali", "ali@medikal.local");
    await kullanici("Veli", "veli@medikal.local");
    const y = await kullanici("Yönetici", "y@medikal.local", "YONETICI");

    const kendi = await getSellerReports({ id: ali.id, role: "SATICI" }, EKIM);
    expect(kendi.map((r) => r.name)).toEqual(["Ali"]);
    expect((await getSellerReports(yonetici(y.id), EKIM)).map((r) => r.name)).toEqual(["Ali", "Veli"]);
  });

  it("OPERASYON prim raporunu alamaz", async () => {
    const o = await kullanici("Operasyon", "o@medikal.local", "OPERASYON");
    await expect(getSellerReports({ id: o.id, role: "OPERASYON" }, EKIM)).rejects.toThrow();
  });
});

describe("saticiOrtalamaIskontosu — FR-61, gruplanmış okuma", () => {
  it("kalem kalem hesapla aynı sonucu verir; teklif, iptal, bedelsiz ve başka satıcı girmez", async () => {
    const ayse = await kullanici("Ayşe", "ayse-isk@x");
    const ali = await kullanici("Ali", "ali-isk@x");
    const d = await doktor("Dr. İskonto", ayse.id);
    const an = new Date("2026-11-02T09:00:00Z");
    // Aynı fiyat çifti iki siparişte (gruplanır), ayrık fiyatlar, liste üstü satış, bedelsiz satır.
    await sevkliSiparis(ayse.id, d.id, an, [
      { unitPrice: "90.1234", listPrice: "100", quantity: 3 },
      { unitPrice: "45", listPrice: "50", quantity: 1 },
      { unitPrice: "0", listPrice: "70", quantity: 2, isFree: true },
    ]);
    await sevkliSiparis(ayse.id, d.id, an, [
      { unitPrice: "90.1234", listPrice: "100", quantity: 7 },
      { unitPrice: "110", listPrice: "100", quantity: 1 },
    ]);
    await sevkliSiparis(ayse.id, d.id, an, [{ unitPrice: "1", listPrice: "100", quantity: 50 }], { stage: "TEKLIF" });
    await sevkliSiparis(ayse.id, d.id, an, [{ unitPrice: "1", listPrice: "100", quantity: 50 }], { status: "IPTAL" });
    await sevkliSiparis(ali.id, d.id, an, [{ unitPrice: "1", listPrice: "100", quantity: 50 }]);

    const kalemler = await prisma.orderItem.findMany({
      where: { order: { ...sayilanBelgeler.siparis, sellerId: ayse.id } },
      select: SIPARIS_SATIRI,
    });
    const beklenen = siparisToplami(kalemler).iskontoOran;
    expect(beklenen).not.toBeNull();
    expect((await saticiOrtalamaIskontosu(ayse.id))?.toFixed()).toBe(beklenen!.toFixed());
  });

  it("siparişi yoksa boştur", async () => {
    const veli = await kullanici("Veli", "veli-isk@x");
    expect(await saticiOrtalamaIskontosu(veli.id)).toBeNull();
  });
});
