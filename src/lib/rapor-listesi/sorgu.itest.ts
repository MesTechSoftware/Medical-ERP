import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { degistirDoktorSahibi } from "@/lib/sahiplik";
import { doktorSiralamasi } from "@/lib/rapor-listesi/sorgu";
import { BOS_SUZGEC, SAHIPSIZ, type RaporSuzgeci } from "@/lib/rapor-listesi/suzgec";
import { referansVeri, yeniDoktorVerisi } from "../../../test/integration/referans";

// Raporlar'ın doktor ciro sıralaması — KABUL_KRITERLERI X-1-2 (spec Ü-27 §4).

const EKIM = { baslangic: new Date("2026-09-30T21:00:00Z"), bitis: new Date("2026-10-31T21:00:00Z") };
const SAYFA = { skip: 0, take: 100 };
const S = (ek: Partial<RaporSuzgeci>): RaporSuzgeci => ({ ...BOS_SUZGEC, ...ek });
let no = 0;

let yapan: { id: string };

async function doktor(ad: string, sahipId: string | null) {
  const d = await prisma.doctor.create({ data: yeniDoktorVerisi(ad) });
  if (sahipId) await prisma.$transaction((tx) => degistirDoktorSahibi([d.id], sahipId, { metin: "test", yapanId: yapan.id }, tx));
  return d;
}

/** Tek satırlık siparişi `shippedAt` anında sevk eder; matrah `fiyat`. */
async function sevk(doctorId: string, fiyat: string, shippedAt: Date) {
  const { kdv20 } = await referansVeri();
  no += 1;
  const urun = await prisma.product.create({ data: { name: `Ü${no}`, code: `RU${no}`, taxRateId: kdv20.id } });
  const order = await prisma.order.create({
    data: {
      documentNo: `SIP-R-${no}`,
      doctorId,
      paymentTermDays: 30,
      stage: "ONAYLI",
      status: "KARGOLANDI",
      items: { create: [{ productId: urun.id, quantity: 1, listPrice: fiyat, unitPrice: fiyat, vatRate: "20" }] },
    },
    include: { items: true },
  });
  await prisma.shipment.create({
    data: { documentNo: `SVK-R-${no}`, orderId: order.id, shippedAt, items: { create: [{ orderItemId: order.items[0].id, quantity: 1 }] } },
  });
  return order.items[0];
}

let ali: { id: string };
let ids: Record<string, string>;

beforeEach(async () => {
  const { depo } = await referansVeri();
  no += 1;
  ali = await prisma.user.create({ data: { name: "Ali", email: `ali${no}@medikal.local`, passwordHash: "x", role: "SATICI" } });
  yapan = await prisma.user.create({ data: { name: "Yön", email: `y${no}@medikal.local`, passwordHash: "x", role: "YONETICI" } });
  const ekim = new Date("2026-10-10T09:00:00Z");
  const a = await doktor("Dr. Ada", null);
  const b = await doktor("Dr. Bora", ali.id);
  const c = await doktor("Dr. Işık", ali.id);
  const d = await doktor("Dr. Deniz", null);
  const e = await doktor("Dr. Ece", null);
  await sevk(a.id, "300", ekim);
  await sevk(b.id, "200", ekim);
  await sevk(c.id, "200", ekim);
  // E: Eylül'de sevk, Ekim'de iade → Ekim cirosu −50
  const kalem = await sevk(e.id, "50", new Date("2026-09-10T09:00:00Z"));
  await prisma.returnNote.create({
    data: {
      documentNo: `IAD-R-${no}`,
      doctorId: e.id,
      locationId: depo.id,
      reason: "test",
      createdById: yapan.id,
      createdAt: ekim,
      items: { create: [{ orderItemId: kalem.id, quantity: 1, vatRate: "20" }] },
    },
  });
  ids = { a: a.id, b: b.id, c: c.id, d: d.id, e: e.id };
});

const ozet = (r: Awaited<ReturnType<typeof doktorSiralamasi>>) => r.satirlar.map((s) => [s.doctorId, s.sira, s.ciro.toFixed(2)]);

describe("doktor ciro sıralaması (X-1-2)", () => {
  it("sıfır ciro düşer, eksi ciro kalır; eşit ciroda ada göre; lider oranı 1", async () => {
    const r = await doktorSiralamasi(EKIM, BOS_SUZGEC, SAYFA);
    expect(ozet(r)).toEqual([
      [ids.a, 1, "300.00"],
      [ids.b, 2, "200.00"],
      [ids.c, 3, "200.00"],
      [ids.e, 4, "-50.00"],
    ]);
    expect(r.toplam).toBe(4);
    expect(r.satirlar[0].oran).toBe(1);
    expect(r.satirlar[3].oran).toBe(0);
  });

  it("satıcı süzgeci carinin sahibine bakar; sıra dönem sırasıdır", async () => {
    expect(ozet(await doktorSiralamasi(EKIM, S({ satici: ali.id }), SAYFA))).toEqual([
      [ids.b, 2, "200.00"],
      [ids.c, 3, "200.00"],
    ]);
    expect((await doktorSiralamasi(EKIM, S({ satici: SAHIPSIZ }), SAYFA)).satirlar.map((s) => s.doctorId)).toEqual([ids.a, ids.e]);
  });

  it("metin cari adına bakar (Türkçe I/ı); sayfalama", async () => {
    expect((await doktorSiralamasi(EKIM, S({ q: "IŞIK" }), SAYFA)).satirlar.map((s) => s.doctorId)).toEqual([ids.c]);
    expect((await doktorSiralamasi(EKIM, S({ q: "ışık" }), SAYFA)).satirlar.map((s) => s.doctorId)).toEqual([ids.c]);
    const r = await doktorSiralamasi(EKIM, BOS_SUZGEC, { skip: 2, take: 2 });
    expect(ozet(r).map((x) => x[1])).toEqual([3, 4]);
    expect(r.toplam).toBe(4);
  });
});
