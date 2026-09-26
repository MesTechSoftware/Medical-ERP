import { beforeEach, describe, expect, it, vi } from "vitest";

import { AUDIT_ACTIONS } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { getDoctorCari } from "@/lib/doctor-cari";

// Tahsilatın DAYANIKLI davranışını sınar: C2 (kongre sökümü) öncesi ve
// sonrası aynı kalmak zorunda olan kısım. KARARLAR'a göre RULE-12'nin dört
// bileşeninden üçü Faz 1'de düşüyor (mahsuplaşma GÇ-3 · prim matrahı GÇ-1 ·
// kongre kazanımı GÇ-4); "geriye tahsilat kaydı + cari hareket kalır".
// Bu test tam olarak o kalanı tutar — bu yüzden mahsup satırlarını BİLEREK
// sınamaz: onlar C3'te tanım gereği yok olacak. Kongre defteri C2'de söküldü;
// tablosu CM'e kadar şemada durduğu için tahsilatın ona YAZMADIĞI sınanır.
const h = vi.hoisted(() => ({ adminId: "" }));

// Server action'ın iki çerçeve bağımlılığı var; ikisi de iş kuralı taşımıyor.
vi.mock("@/lib/session", () => ({
  requireAdmin: async () => ({ user: { id: h.adminId, role: "ADMIN" } }),
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

const { recordCollection, cancelCollection } = await import("./actions");

const SIPARIS_BRUT = 1_100_000n; // 11.000,00 TL (net 10.000 + %10 KDV)
const TAHSILAT_TL = 5_000; // 5.000,00 TL

async function seed() {
  const admin = await prisma.user.create({
    data: {
      name: "Yönetici",
      email: "yonetici@medikal.local",
      passwordHash: "test",
      role: "ADMIN",
    },
  });
  h.adminId = admin.id;

  const doctor = await prisma.doctor.create({
    data: {
      fullName: "Dr. Ayşe Kaya",
      clinic: "Özel Anka Klinik",
      region: "İç Anadolu",
      phoneNormalized: "+905321112233",
      ownerSellerId: admin.id,
    },
  });

  const order = await prisma.order.create({
    data: {
      sellerId: admin.id,
      doctorId: doctor.id,
      netTotal: 1_000_000n,
      vatTotal: 100_000n,
      grossTotal: SIPARIS_BRUT,
      dueDate: new Date("2026-10-15T00:00:00.000Z"),
    },
  });

  return { admin, doctor, order };
}

function tahsilatFormu(doctorId: string) {
  const fd = new FormData();
  fd.set("doctorId", doctorId);
  fd.set("amount", String(TAHSILAT_TL));
  fd.set("method", "TRANSFER");
  fd.set("paidAt", "2026-09-26");
  fd.set("referenceNo", "DEKONT-001");
  return fd;
}

describe("tahsilat — dayanıklı davranış", () => {
  let doctorId = "";

  beforeEach(async () => {
    const { doctor } = await seed();
    doctorId = doctor.id;
  });

  it("tahsilat kaydını kuruş cinsinden yazar", async () => {
    const sonuc = await recordCollection({}, tahsilatFormu(doctorId));
    expect(sonuc.error).toBeUndefined();

    const payments = await prisma.doctorPayment.findMany({ where: { doctorId } });
    expect(payments).toHaveLength(1);
    expect(payments[0].amount).toBe(500_000n);
    expect(payments[0].method).toBe("TRANSFER");
    expect(payments[0].status).toBe("AKTIF");
    expect(payments[0].recordedBy).toBe(h.adminId);
    expect(payments[0].referenceNo).toBe("DEKONT-001");
  });

  it("cari bakiyeyi tahsilat kadar düşürür — bakiye saklanmaz, hesaplanır (RULE-08)", async () => {
    const once = await getDoctorCari(doctorId);
    expect(once.bakiye).toBe(SIPARIS_BRUT);

    await recordCollection({}, tahsilatFormu(doctorId));

    const sonra = await getDoctorCari(doctorId);
    expect(sonra.toplamSiparis).toBe(SIPARIS_BRUT);
    expect(sonra.toplamTahsilat).toBe(500_000n);
    expect(sonra.bakiye).toBe(600_000n);
  });

  it("denetim kaydı yazar (RULE-13 — Faz 1'de kalır)", async () => {
    await recordCollection({}, tahsilatFormu(doctorId));

    const payment = await prisma.doctorPayment.findFirstOrThrow({ where: { doctorId } });
    const logs = await prisma.auditLog.findMany({
      where: { action: AUDIT_ACTIONS.COLLECTION_CREATE },
    });

    expect(logs).toHaveLength(1);
    expect(logs[0].entityType).toBe("DoctorPayment");
    expect(logs[0].entityId).toBe(payment.id);
    expect(logs[0].actorId).toBe(h.adminId);
  });

  it("kongre hareketi yazmaz (C2 — GÇ-4: kongre kazanımı söküldü)", async () => {
    await recordCollection({}, tahsilatFormu(doctorId));

    expect(await prisma.doctorPayment.count()).toBe(1);
    expect(await prisma.congressLedger.count()).toBe(0);
  });

  it("iptal, tahsilatı IPTAL işaretler ve cariyi geri alır (FR-29 — ters kayıt)", async () => {
    await recordCollection({}, tahsilatFormu(doctorId));
    const payment = await prisma.doctorPayment.findFirstOrThrow({ where: { doctorId } });

    const fd = new FormData();
    fd.set("paymentId", payment.id);
    fd.set("reason", "Dekont hatalı");
    const sonuc = await cancelCollection({}, fd);
    expect(sonuc.error).toBeUndefined();

    const iptal = await prisma.doctorPayment.findUniqueOrThrow({ where: { id: payment.id } });
    expect(iptal.status).toBe("IPTAL");
    expect(iptal.cancelledBy).toBe(h.adminId);
    expect(iptal.cancelReason).toBe("Dekont hatalı");

    const cari = await getDoctorCari(doctorId);
    expect(cari.toplamTahsilat).toBe(0n);
    expect(cari.bakiye).toBe(SIPARIS_BRUT);

    const logs = await prisma.auditLog.findMany({
      where: { action: AUDIT_ACTIONS.COLLECTION_CANCEL },
    });
    expect(logs).toHaveLength(1);
    expect(logs[0].entityId).toBe(payment.id);
    expect(await prisma.congressLedger.count()).toBe(0);
  });

  it("geçersiz tutarı reddeder ve hiçbir şey yazmaz", async () => {
    const fd = tahsilatFormu(doctorId);
    fd.set("amount", "0");

    const sonuc = await recordCollection({}, fd);

    expect(sonuc.error).toBeDefined();
    expect(await prisma.doctorPayment.count()).toBe(0);
    expect(await prisma.auditLog.count()).toBe(0);
  });
});
