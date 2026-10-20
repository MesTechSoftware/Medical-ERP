import { beforeEach, describe, expect, it, vi } from "vitest";

import { AUDIT_ACTIONS } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { hesaplaDoktorBakiye } from "@/lib/doctor-cari";
import { takvimYili } from "@/lib/zaman";
import { referansVeri, yeniDoktorVerisi } from "../../../../test/integration/referans";

// Tahsilatın DAYANIKLI davranışı (RULE-12'den Faz 1'de kalan: tahsilat kaydı + cari hareket).
// Kongre defteri (GÇ-4), mahsup (GÇ-3) ve prim dönemi (GÇ-16) tabloları CM'de şemadan
// çıktı — "onlara yazmaz" testleri yerini şemaya ve C8 anti-şema testine bıraktı.
// Tahsilatın cari hareketi 1B madde 7'de yazılır (X-11 §(5), A-11); o zamana kadar yazılmaz (R-11).
const h = vi.hoisted(() => ({ adminId: "" }));

vi.mock("@/lib/session", () => ({
  requireAdmin: async () => ({ user: { id: h.adminId, role: "YONETICI" } }),
  requireStaff: async () => ({ user: { id: h.adminId, role: "YONETICI" } }),
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

const { recordCollection, cancelCollection, changeDueDate } = await import("./actions");

async function seed() {
  const ref = await referansVeri();
  const pos = await prisma.paymentMethod.create({
    data: { name: "POS", type: "POS", commissionRate: "2.5" },
  });
  const admin = await prisma.user.create({
    data: { name: "Yönetici", email: "yonetici@medikal.local", passwordHash: "test", role: "YONETICI" },
  });
  h.adminId = admin.id;
  const doctor = await prisma.doctor.create({ data: yeniDoktorVerisi("Dr. Ayşe Kaya") });
  return { ...ref, pos, admin, doctor };
}

function tahsilatFormu(doctorId: string, paymentMethodId: string, amount = "5000") {
  const fd = new FormData();
  fd.set("doctorId", doctorId);
  fd.set("amount", amount);
  fd.set("paymentMethodId", paymentMethodId);
  fd.set("paidAt", "2026-09-26");
  fd.set("referenceNo", "DEKONT-001");
  return fd;
}

describe("tahsilat — numara ve kayıt aynı transaction'da (X-2-1)", () => {
  let s: Awaited<ReturnType<typeof seed>>;

  beforeEach(async () => {
    s = await seed();
  });

  it("tahsilat yazılamazsa THS numarası harcanmaz; teknik hata mesaja çevrilmez (X-3-3)", async () => {
    // Numara alındıktan sonra kayıt yabancı anahtarda düşer: olmayan cari. Teknik hatadır —
    // iş mesajına dönmez, hata sınırına fırlar (X-3 §(4)).
    await expect(recordCollection({}, tahsilatFormu("olmayan-cari", s.havale.id))).rejects.toThrow();
    expect(await prisma.doctorPayment.count()).toBe(0);
    expect(await prisma.auditLog.count()).toBe(0);

    expect((await recordCollection({}, tahsilatFormu(s.doctor.id, s.havale.id))).error).toBeUndefined();
    const [p] = await prisma.doctorPayment.findMany();
    expect(p.documentNo).toBe(`THS-${takvimYili()}-000001`);
  });

  it("pasif ödeme yöntemi iş hatasıdır: mesaj döner, numara ve kayıt yazılmaz (X-3-3)", async () => {
    await prisma.paymentMethod.update({ where: { id: s.havale.id }, data: { isActive: false } });
    expect(await recordCollection({}, tahsilatFormu(s.doctor.id, s.havale.id))).toEqual({
      error: "Ödeme yöntemi bulunamadı.",
    });
    expect(await prisma.doctorPayment.count()).toBe(0);
    expect(await prisma.documentCounter.count()).toBe(0);
  });

  it("BAYI carisinin tahsilatı aynı yoldan numaralanır (X-8 §(7))", async () => {
    const bayi = await prisma.doctor.create({ data: { ...yeniDoktorVerisi("Bayi A.Ş."), accountClass: "BAYI" } });
    await recordCollection({}, tahsilatFormu(s.doctor.id, s.havale.id));
    expect((await recordCollection({}, tahsilatFormu(bayi.id, s.havale.id))).error).toBeUndefined();

    const p = await prisma.doctorPayment.findFirstOrThrow({ where: { doctorId: bayi.id } });
    expect(p.documentNo).toBe(`THS-${takvimYili()}-000002`);
  });
});

describe("tahsilat — dayanıklı davranış", () => {
  let s: Awaited<ReturnType<typeof seed>>;

  beforeEach(async () => {
    s = await seed();
  });

  it("tahsilatı Decimal tutar ve THS numarasıyla yazar (X-5, A-14)", async () => {
    const sonuc = await recordCollection({}, tahsilatFormu(s.doctor.id, s.havale.id, "5000,50"));
    expect(sonuc.error).toBeUndefined();

    const [p] = await prisma.doctorPayment.findMany({ where: { doctorId: s.doctor.id } });
    expect(p.amount.toFixed(2)).toBe("5000.50");
    expect(p.documentNo).toBe(`THS-${takvimYili()}-000001`);
    expect(p.paymentMethodId).toBe(s.havale.id);
    expect(p.status).toBe("AKTIF");
    expect(p.recordedBy).toBe(h.adminId);
    expect(p.referenceNo).toBe("DEKONT-001");
  });

  it("komisyon oranı yöntemden kopyalanır ve tutarı donar (A-11)", async () => {
    await recordCollection({}, tahsilatFormu(s.doctor.id, s.pos.id, "1000"));
    const p = await prisma.doctorPayment.findFirstOrThrow();
    expect(p.commissionRate.toFixed(2)).toBe("2.50");
    expect(p.commissionAmount.toFixed(2)).toBe("25.00");

    // Yöntemin oranı sonradan değişse de kayıt değişmez.
    await prisma.paymentMethod.update({ where: { id: s.pos.id }, data: { commissionRate: "3" } });
    const sonra = await prisma.doctorPayment.findFirstOrThrow();
    expect(sonra.commissionRate.toFixed(2)).toBe("2.50");
  });

  it("denetim kaydı yazar (RULE-13)", async () => {
    await recordCollection({}, tahsilatFormu(s.doctor.id, s.havale.id));
    const payment = await prisma.doctorPayment.findFirstOrThrow();
    const logs = await prisma.auditLog.findMany({ where: { action: AUDIT_ACTIONS.COLLECTION_CREATE } });

    expect(logs).toHaveLength(1);
    expect(logs[0].entityType).toBe("DoctorPayment");
    expect(logs[0].entityId).toBe(payment.id);
    expect(logs[0].actorId).toBe(h.adminId);
    expect(logs[0].afterData).toContain('"amount":"5000"'); // Decimal log'a ham metin yazılır
  });

  it("iptal, tahsilatı IPTAL işaretler (FR-29 — kayıt silinmez)", async () => {
    await recordCollection({}, tahsilatFormu(s.doctor.id, s.havale.id));
    const payment = await prisma.doctorPayment.findFirstOrThrow();

    const fd = new FormData();
    fd.set("paymentId", payment.id);
    fd.set("reason", "Dekont hatalı");
    const sonuc = await cancelCollection({}, fd);
    expect(sonuc.error).toBeUndefined();

    const iptal = await prisma.doctorPayment.findUniqueOrThrow({ where: { id: payment.id } });
    expect(iptal.status).toBe("IPTAL");
    expect(iptal.cancelledBy).toBe(h.adminId);
    expect(iptal.cancelReason).toBe("Dekont hatalı");
    expect(
      await prisma.auditLog.count({ where: { action: AUDIT_ACTIONS.COLLECTION_CANCEL } })
    ).toBe(1);
  });

  it("geçersiz tutarı reddeder ve hiçbir şey yazmaz", async () => {
    for (const amount of ["0", "-5", "1.234", "abc"]) {
      const sonuc = await recordCollection({}, tahsilatFormu(s.doctor.id, s.havale.id, amount));
      expect(sonuc.error).toBeDefined();
    }
    expect(await prisma.doctorPayment.count()).toBe(0);
    expect(await prisma.auditLog.count()).toBe(0);
  });

  it("ödeme yöntemi seçilmeden tahsilat yazılmaz (A-11: zorunlu)", async () => {
    const fd = tahsilatFormu(s.doctor.id, "");
    expect((await recordCollection({}, fd)).error).toBeDefined();
    expect(await prisma.doctorPayment.count()).toBe(0);
  });
});

describe("cari bakiye — cari hareketin toplamı (X-11 §(6), RULE-08)", () => {
  let s: Awaited<ReturnType<typeof seed>>;
  const hareket = (direction: "BORC" | "ALACAK", amount: string, type: "SEVKIYAT" | "TAHSILAT" | "ACILIS") =>
    prisma.ledgerEntry.create({
      data: { doctorId: s.doctor.id, type, direction, amount, documentNo: "TEST", createdById: s.admin.id },
    });

  beforeEach(async () => {
    s = await seed();
  });

  it("hareket yoksa bakiye sıfırdır", async () => {
    const cari = await hesaplaDoktorBakiye(s.doctor.id);
    expect(cari.bakiye.toFixed(2)).toBe("0.00");
  });

  it("bakiye = Σ borç − Σ alacak; veritabanında toplanır", async () => {
    await hareket("BORC", "11000.00", "SEVKIYAT");
    await hareket("ALACAK", "5000.50", "TAHSILAT");
    const cari = await hesaplaDoktorBakiye(s.doctor.id);
    expect(cari.toplamBorc.toFixed(2)).toBe("11000.00");
    expect(cari.toplamAlacak.toFixed(2)).toBe("5000.50");
    expect(cari.bakiye.toFixed(2)).toBe("5999.50");
  });

  it("borçtan büyük alacak bakiyeyi eksiye çevirir (K-2: avans ayrı tutulmaz)", async () => {
    await hareket("BORC", "11000", "SEVKIYAT");
    await hareket("ALACAK", "12000", "TAHSILAT");
    expect((await hesaplaDoktorBakiye(s.doctor.id)).bakiye.toFixed(2)).toBe("-1000.00");
  });

  it("başka doktorun hareketi sayılmaz", async () => {
    const diger = await prisma.doctor.create({ data: yeniDoktorVerisi("Dr. Diğer") });
    await prisma.ledgerEntry.create({
      data: { doctorId: diger.id, type: "ACILIS", direction: "BORC", amount: "999", documentNo: "ACL", createdById: s.admin.id },
    });
    expect((await hesaplaDoktorBakiye(s.doctor.id)).bakiye.toFixed(2)).toBe("0.00");
  });
});

describe("vade değişikliği — cari harekette, sistem sınırı yok (X-15 §(1), KARARLAR §2 madde 16)", () => {
  let s: Awaited<ReturnType<typeof seed>>;
  let ledgerEntryId = "";

  beforeEach(async () => {
    s = await seed();
    const e = await prisma.ledgerEntry.create({
      data: {
        doctorId: s.doctor.id,
        type: "SEVKIYAT",
        direction: "BORC",
        amount: "11000",
        dueDate: new Date("2026-10-15T00:00:00Z"),
        documentNo: "SVK-2026-000001",
        createdById: s.admin.id,
      },
    });
    ledgerEntryId = e.id;
  });

  function vadeFormu(newDueDate: string, reason = "Doktor talebi") {
    const fd = new FormData();
    fd.set("ledgerEntryId", ledgerEntryId);
    fd.set("newDueDate", newDueDate);
    fd.set("reason", reason);
    return fd;
  }

  it("eski 180 günlük sınırın çok ötesine uzatılabilir; iz ve audit yazılır", async () => {
    const sonuc = await changeDueDate({}, vadeFormu("2029-12-31"));
    expect(sonuc.error).toBeUndefined();

    const e = await prisma.ledgerEntry.findUniqueOrThrow({ where: { id: ledgerEntryId } });
    expect(e.dueDate?.toISOString().slice(0, 10)).toBe("2029-12-31");

    const iz = await prisma.dueDateChange.findMany({ where: { ledgerEntryId } });
    expect(iz).toHaveLength(1);
    expect(iz[0].oldDueDate?.toISOString().slice(0, 10)).toBe("2026-10-15");
    expect(iz[0].reason).toBe("Doktor talebi");
    expect(
      await prisma.auditLog.count({ where: { action: AUDIT_ACTIONS.DUE_DATE_CHANGE } })
    ).toBe(1);
  });

  it("gerekçesiz değişiklik reddedilir (X-15 §(1))", async () => {
    expect((await changeDueDate({}, vadeFormu("2027-01-01", ""))).error).toBeDefined();
    expect(await prisma.dueDateChange.count()).toBe(0);
  });

  it("alacak hareketinin vadesi değişmez", async () => {
    const alacak = await prisma.ledgerEntry.create({
      data: { doctorId: s.doctor.id, type: "TAHSILAT", direction: "ALACAK", amount: "1", documentNo: "THS", createdById: s.admin.id },
    });
    ledgerEntryId = alacak.id;
    expect((await changeDueDate({}, vadeFormu("2027-01-01"))).error).toBeDefined();
  });
});
