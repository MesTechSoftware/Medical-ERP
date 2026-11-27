import { describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { sevkiyatListesi } from "@/lib/kargo-listesi/sorgu";
import { BOS_SUZGEC } from "@/lib/kargo-listesi/suzgec";
import { siparisiHazirla, teslimEdildiIsaretle } from "@/lib/siparis-durum";
import { yeniDoktorVerisi } from "../../test/integration/referans";

// Durum geçişleri — KABUL_KRITERLERI A-3-9, A-3-10, A-5-10 (Ü-42 M3).

let no = 0;

async function yonetici() {
  return prisma.user.create({ data: { name: "Yönetici", email: "y@medikal.local", passwordHash: "x", role: "YONETICI" } });
}

async function siparis(stage: "TEKLIF" | "ONAYLI", status: "BEKLIYOR" | "KARGOLANDI") {
  no += 1;
  const d = await prisma.doctor.create({ data: yeniDoktorVerisi() });
  return prisma.order.create({ data: { documentNo: `SIP-D-${no}`, doctorId: d.id, paymentTermDays: 30, stage, status } });
}

describe("siparisiHazirla — aşama koşulu (A-5-10)", () => {
  it("TEKLIF aşamasındaki sipariş hazırlanmaz; durum ve denetim kaydı değişmez", async () => {
    const y = await yonetici();
    const s = await siparis("TEKLIF", "BEKLIYOR");
    expect(await prisma.$transaction((tx) => siparisiHazirla(tx, { siparisId: s.id, yapanId: y.id }))).toBe(false);
    expect((await prisma.order.findUniqueOrThrow({ where: { id: s.id } })).status).toBe("BEKLIYOR");
    expect(await prisma.auditLog.count({ where: { entityId: s.id } })).toBe(0);
  });
});

describe("toplu hazırlık — karışık seçim (A-3-10)", () => {
  it("uygun olanlar ilerler, teklif ve durumu değişmiş olan yalnız kendi sonucunu bozar", async () => {
    const y = await yonetici();
    const a = await siparis("ONAYLI", "BEKLIYOR");
    const teklif = await siparis("TEKLIF", "BEKLIYOR");
    const kargolu = await siparis("ONAYLI", "KARGOLANDI");
    const b = await siparis("ONAYLI", "BEKLIYOR");
    const sonuc: boolean[] = [];
    for (const s of [a, teklif, kargolu, b]) {
      sonuc.push(await prisma.$transaction((tx) => siparisiHazirla(tx, { siparisId: s.id, yapanId: y.id })));
    }
    expect(sonuc).toEqual([true, false, false, true]);
    const durumlar = await prisma.order.findMany({ where: { id: { in: [a.id, teklif.id, kargolu.id, b.id] } }, select: { id: true, status: true } });
    const d = Object.fromEntries(durumlar.map((x) => [x.id, x.status]));
    expect([d[a.id], d[teklif.id], d[kargolu.id], d[b.id]]).toEqual(["HAZIRLANIYOR", "BEKLIYOR", "KARGOLANDI", "HAZIRLANIYOR"]);
  });
});

describe("Teslim — sipariş başına bir kez (A-3-9)", () => {
  async function ikiSevkiyatli() {
    const s = await siparis("ONAYLI", "KARGOLANDI");
    const eski = await prisma.shipment.create({ data: { documentNo: `SVK-D-${s.documentNo}-1`, orderId: s.id, shippedAt: new Date("2026-10-01T09:00:00Z") } });
    const yeni = await prisma.shipment.create({ data: { documentNo: `SVK-D-${s.documentNo}-2`, orderId: s.id, shippedAt: new Date("2026-10-02T09:00:00Z") } });
    return { s, eski, yeni };
  }

  it("yalnız en yeni sevkiyat satırı teslim edilebilir", async () => {
    const { eski, yeni } = await ikiSevkiyatli();
    const { satirlar } = await sevkiyatListesi(BOS_SUZGEC, { skip: 0, take: 50 });
    expect(satirlar.find((r) => r.id === eski.id)?.teslimEdilebilir).toBe(false);
    expect(satirlar.find((r) => r.id === yeni.id)?.teslimEdilebilir).toBe(true);
  });

  it("işlem siparişi ve bütün sevkiyatları TESLIM_EDILDI yapar, denetim yazar; sonra satırda Teslim kalmaz", async () => {
    const y = await yonetici();
    const { s, eski, yeni } = await ikiSevkiyatli();
    expect(await prisma.$transaction((tx) => teslimEdildiIsaretle(tx, { siparisId: s.id, yapanId: y.id }))).toBe(true);
    expect((await prisma.order.findUniqueOrThrow({ where: { id: s.id } })).status).toBe("TESLIM_EDILDI");
    const v = await prisma.shipment.findMany({ where: { id: { in: [eski.id, yeni.id] } }, select: { status: true } });
    expect(v.map((x) => x.status)).toEqual(["TESLIM_EDILDI", "TESLIM_EDILDI"]);
    expect(await prisma.auditLog.count({ where: { entityId: s.id, action: "ORDER_STATUS_CHANGE" } })).toBe(1);
    const { satirlar } = await sevkiyatListesi(BOS_SUZGEC, { skip: 0, take: 50 });
    expect(satirlar.some((r) => r.teslimEdilebilir)).toBe(false);
  });
});
