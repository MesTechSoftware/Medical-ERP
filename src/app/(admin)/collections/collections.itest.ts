import { beforeEach, describe, expect, it, vi } from "vitest";

import { AUDIT_ACTIONS } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { hesaplaDoktorBakiye } from "@/lib/doctor-cari";
import { takvimYili } from "@/lib/zaman";
import { referansVeri, yeniDoktorVerisi } from "../../../../test/integration/referans";

// Tahsilatın DAYANIKLI davranışı (RULE-12'den Faz 1'de kalan: tahsilat kaydı + cari hareket).
// Kongre defteri (GÇ-4), mahsup (GÇ-3) ve prim dönemi (GÇ-16) tabloları CM'de şemadan
// çıktı — "onlara yazmaz" testleri yerini şemaya ve C8 anti-şema testine bıraktı.
// Tahsilat cari hareketi belgeyle aynı transaction'da yazılır; iptal ters kayıttır (X-11 §(5), A-11 — 1B-7b).
const h = vi.hoisted(() => ({ adminId: "", tevsikLimiti: null as string | null }));

vi.mock("@/lib/session", () => ({
  requireAdmin: async () => ({ user: { id: h.adminId, role: "YONETICI" } }),
  requireStaff: async () => ({ user: { id: h.adminId, role: "YONETICI" } }),
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
// A-15 limiti kurulumda `null`'dır (kapalı); testte çalışma anında okunan değer verilir.
vi.mock("@/lib/policy", async (asil) => {
  const m = await asil<typeof import("@/lib/policy")>();
  return {
    policy: {
      ...m.policy,
      finance: {
        ...m.policy.finance,
        get nakitTevsikLimiti() {
          return h.tevsikLimiti;
        },
      },
    },
  };
});

const { recordCollection, cancelCollection, changeDueDate } = await import("./actions");
const { nakitTevsikUyarisi } = await import("@/lib/tevsik");

async function seed() {
  const ref = await referansVeri();
  const pos = await prisma.paymentMethod.create({
    data: { name: "POS", type: "POS", commissionRate: "2.5" },
  });
  const nakit = await prisma.paymentMethod.findUniqueOrThrow({ where: { name: "Nakit" } });
  h.tevsikLimiti = null;
  const admin = await prisma.user.create({
    data: { name: "Yönetici", email: "yonetici@medikal.local", passwordHash: "test", role: "YONETICI" },
  });
  h.adminId = admin.id;
  const doctor = await prisma.doctor.create({ data: yeniDoktorVerisi("Dr. Ayşe Kaya") });
  return { ...ref, pos, nakit, admin, doctor };
}

function tahsilatFormu(doctorId: string, paymentMethodId: string, amount = "5000", paidAt = "2026-09-26") {
  const fd = new FormData();
  fd.set("doctorId", doctorId);
  fd.set("amount", amount);
  fd.set("paymentMethodId", paymentMethodId);
  fd.set("paidAt", paidAt);
  fd.set("referenceNo", "DEKONT-001");
  return fd;
}

describe("tahsilat — geçersiz tarih ve doktor varlığı (A-11-4)", () => {
  it("geçersiz paidAt iş hatasıdır (500 değil); hiçbir şey yazılmaz", async () => {
    const s = await seed();
    expect(await recordCollection(null, tahsilatFormu(s.doctor.id, s.havale.id, "5000", "31.31.2026"))).toMatchObject({
      durum: "ENGELLENDI",
      bildirimler: [{ kademe: "SERT", kural_kodu: "GECERSIZ_TARIH", alan: "paidAt" }],
    });
    expect(await prisma.doctorPayment.count()).toBe(0);
  });

  it("olmayan doktor DOKTOR_BULUNAMADI ile reddedilir; numara harcanmaz", async () => {
    const s = await seed();
    expect(await recordCollection(null, tahsilatFormu("olmayan-cari", s.havale.id))).toMatchObject({
      durum: "ENGELLENDI",
      bildirimler: [{ kademe: "SERT", kural_kodu: "DOKTOR_BULUNAMADI", alan: "doctorId" }],
    });
    expect(await prisma.doctorPayment.count()).toBe(0);
    expect((await recordCollection(null, tahsilatFormu(s.doctor.id, s.havale.id))).durum).toBe("BASARILI");
    expect((await prisma.doctorPayment.findFirstOrThrow()).documentNo).toBe(`THS-${takvimYili()}-000001`);
  });

  it("pasif doktora tahsilat reddedilmez (tahliye vanası, B-7)", async () => {
    const s = await seed();
    await prisma.doctor.update({ where: { id: s.doctor.id }, data: { status: "PASIF" } });
    expect((await recordCollection(null, tahsilatFormu(s.doctor.id, s.havale.id))).durum).toBe("BASARILI");
    expect(await prisma.doctorPayment.count()).toBe(1);
  });
});

describe("tahsilat — numara ve kayıt aynı transaction'da (X-2-1)", () => {
  let s: Awaited<ReturnType<typeof seed>>;

  beforeEach(async () => {
    s = await seed();
  });

  it("tahsilat yazılamazsa THS numarası harcanmaz; teknik hata mesaja çevrilmez (X-3-3)", async () => {
    // Numara alındıktan sonra kayıt yabancı anahtarda düşer: olmayan kullanıcı. Teknik hatadır —
    // iş mesajına dönmez, hata sınırına fırlar (X-3 §(4)).
    h.adminId = "olmayan-kullanici";
    await expect(recordCollection(null, tahsilatFormu(s.doctor.id, s.havale.id))).rejects.toThrow();
    h.adminId = s.admin.id;
    expect(await prisma.doctorPayment.count()).toBe(0);
    expect(await prisma.auditLog.count()).toBe(0);

    expect((await recordCollection(null, tahsilatFormu(s.doctor.id, s.havale.id))).durum).toBe("BASARILI");
    const [p] = await prisma.doctorPayment.findMany();
    expect(p.documentNo).toBe(`THS-${takvimYili()}-000001`);
  });

  it("pasif ödeme yöntemi iş hatasıdır: SERT bildirim döner, numara ve kayıt yazılmaz (X-3-3)", async () => {
    await prisma.paymentMethod.update({ where: { id: s.havale.id }, data: { isActive: false } });
    expect(await recordCollection(null, tahsilatFormu(s.doctor.id, s.havale.id))).toEqual({
      durum: "ENGELLENDI",
      kademe: "SERT",
      bildirimler: [{ kademe: "SERT", kural_kodu: "ODEME_YONTEMI_BULUNAMADI", parametreler: {}, alan: "paymentMethodId" }],
    });
    expect(await prisma.doctorPayment.count()).toBe(0);
    expect(await prisma.documentCounter.count()).toBe(0);
  });

  it("BAYI carisinin tahsilatı aynı yoldan numaralanır (X-8 §(7))", async () => {
    const bayi = await prisma.doctor.create({ data: { ...yeniDoktorVerisi("Bayi A.Ş."), accountClass: "BAYI" } });
    await recordCollection(null, tahsilatFormu(s.doctor.id, s.havale.id));
    expect((await recordCollection(null, tahsilatFormu(bayi.id, s.havale.id))).durum).toBe("BASARILI");

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
    const sonuc = await recordCollection(null, tahsilatFormu(s.doctor.id, s.havale.id, "5000,50"));
    expect(sonuc.durum).toBe("BASARILI");

    const [p] = await prisma.doctorPayment.findMany({ where: { doctorId: s.doctor.id } });
    expect(p.amount.toFixed(2)).toBe("5000.50");
    expect(p.documentNo).toBe(`THS-${takvimYili()}-000001`);
    expect(p.paymentMethodId).toBe(s.havale.id);
    expect(p.status).toBe("AKTIF");
    expect(p.recordedBy).toBe(h.adminId);
    expect(p.referenceNo).toBe("DEKONT-001");
  });

  it("komisyon oranı yöntemden kopyalanır ve tutarı donar (A-11)", async () => {
    await recordCollection(null, tahsilatFormu(s.doctor.id, s.pos.id, "1000"));
    const p = await prisma.doctorPayment.findFirstOrThrow();
    expect(p.commissionRate.toFixed(2)).toBe("2.50");
    expect(p.commissionAmount.toFixed(2)).toBe("25.00");

    // Yöntemin oranı sonradan değişse de kayıt değişmez.
    await prisma.paymentMethod.update({ where: { id: s.pos.id }, data: { commissionRate: "3" } });
    const sonra = await prisma.doctorPayment.findFirstOrThrow();
    expect(sonra.commissionRate.toFixed(2)).toBe("2.50");
  });

  it("denetim kaydı yazar (RULE-13)", async () => {
    await recordCollection(null, tahsilatFormu(s.doctor.id, s.havale.id));
    const payment = await prisma.doctorPayment.findFirstOrThrow();
    const logs = await prisma.auditLog.findMany({ where: { action: AUDIT_ACTIONS.COLLECTION_CREATE } });

    expect(logs).toHaveLength(1);
    expect(logs[0].entityType).toBe("DoctorPayment");
    expect(logs[0].entityId).toBe(payment.id);
    expect(logs[0].actorId).toBe(h.adminId);
    expect(logs[0].afterData).toContain('"amount":"5000"'); // Decimal log'a ham metin yazılır
  });

  it("iptal, tahsilatı IPTAL işaretler (FR-29 — kayıt silinmez)", async () => {
    await recordCollection(null, tahsilatFormu(s.doctor.id, s.havale.id));
    const payment = await prisma.doctorPayment.findFirstOrThrow();

    const fd = new FormData();
    fd.set("paymentId", payment.id);
    fd.set("reason", "Dekont hatalı");
    const sonuc = await cancelCollection(null, fd);
    expect(sonuc.durum).toBe("BASARILI");

    const iptal = await prisma.doctorPayment.findUniqueOrThrow({ where: { id: payment.id } });
    expect(iptal.status).toBe("IPTAL");
    expect(iptal.cancelledBy).toBe(h.adminId);
    expect(iptal.cancelReason).toBe("Dekont hatalı");
    expect(
      await prisma.auditLog.count({ where: { action: AUDIT_ACTIONS.COLLECTION_CANCEL } })
    ).toBe(1);
  });

  it("gerekçesiz iptal GEREKCE_ZORUNLU döner, hiçbir şey yazılmaz (X-18-5, A-11-3)", async () => {
    await recordCollection(null, tahsilatFormu(s.doctor.id, s.havale.id));
    const payment = await prisma.doctorPayment.findFirstOrThrow();
    const fd = new FormData();
    fd.set("paymentId", payment.id);
    fd.set("reason", "   ");
    const sonuc = await cancelCollection(null, fd);
    expect(sonuc.bildirimler[0]).toMatchObject({ kural_kodu: "GEREKCE_ZORUNLU", alan: "reason" });
    expect((await prisma.doctorPayment.findUniqueOrThrow({ where: { id: payment.id } })).status).toBe("AKTIF");
    expect(await prisma.auditLog.count({ where: { action: AUDIT_ACTIONS.COLLECTION_CANCEL } })).toBe(0);
  });

  it("geçersiz tutarı reddeder ve hiçbir şey yazmaz", async () => {
    for (const amount of ["0", "-5", "1.234", "abc"]) {
      const sonuc = await recordCollection(null, tahsilatFormu(s.doctor.id, s.havale.id, amount));
      expect(sonuc.durum).toBe("ENGELLENDI");
    }
    expect(await prisma.doctorPayment.count()).toBe(0);
    expect(await prisma.auditLog.count()).toBe(0);
  });

  it("ödeme yöntemi seçilmeden tahsilat yazılmaz (A-11: zorunlu)", async () => {
    const fd = tahsilatFormu(s.doctor.id, "");
    expect((await recordCollection(null, fd)).durum).toBe("ENGELLENDI");
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
    const sonuc = await changeDueDate(null, vadeFormu("2029-12-31"));
    expect(sonuc.durum).toBe("BASARILI");

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
    expect((await changeDueDate(null, vadeFormu("2027-01-01", ""))).durum).toBe("ENGELLENDI");
    expect(await prisma.dueDateChange.count()).toBe(0);
  });

  it("alacak hareketinin vadesi değişmez", async () => {
    const alacak = await prisma.ledgerEntry.create({
      data: { doctorId: s.doctor.id, type: "TAHSILAT", direction: "ALACAK", amount: "1", documentNo: "THS", createdById: s.admin.id },
    });
    ledgerEntryId = alacak.id;
    expect((await changeDueDate(null, vadeFormu("2027-01-01"))).durum).toBe("ENGELLENDI");
  });
});

describe("nakit tevsik uyarısı — BILGI, kayıt engellenmez (A-15-1)", () => {
  let s: Awaited<ReturnType<typeof seed>>;
  const kodlar = (r: { bildirimler: { kural_kodu: string }[] }) => r.bildirimler.map((b) => b.kural_kodu);

  beforeEach(async () => {
    s = await seed();
  });

  it("limit kapalıysa (null) uyarı yoktur", async () => {
    expect(await recordCollection(null, tahsilatFormu(s.doctor.id, s.nakit.id, "50000"))).toEqual({
      durum: "BASARILI",
      kademe: null,
      bildirimler: [],
    });
  });

  it("aynı cari + aynı gün nakit toplamı limiti aşınca aşan işlem dâhil uyarır; kayıt yazılır", async () => {
    h.tevsikLimiti = "30000";
    expect(await recordCollection(null, tahsilatFormu(s.doctor.id, s.nakit.id, "20000"))).toMatchObject({
      durum: "BASARILI",
    });
    expect(await recordCollection(null, tahsilatFormu(s.doctor.id, s.nakit.id, "15000"))).toEqual({
      durum: "BASARILI_UYARILI",
      kademe: "BILGI",
      bildirimler: [
        { kademe: "BILGI", kural_kodu: "NAKIT_TEVSIK_LIMITI", parametreler: { toplam: "35000.00", limit: "30000.00" } },
      ],
    });
    expect(await prisma.doctorPayment.count()).toBe(2);
    expect(await prisma.approvalBlock.count()).toBe(0); // OnayBlogu üretilmez
  });

  it("limite eşit toplam aşım değildir", async () => {
    h.tevsikLimiti = "30000";
    await recordCollection(null, tahsilatFormu(s.doctor.id, s.nakit.id, "10000"));
    expect(kodlar(await recordCollection(null, tahsilatFormu(s.doctor.id, s.nakit.id, "20000")))).toEqual([]);
  });

  it("yalnız nakit, aynı cari, aynı gün ve iptal edilmemiş tahsilat sayılır", async () => {
    h.tevsikLimiti = "30000";
    const baska = await prisma.doctor.create({ data: yeniDoktorVerisi("Dr. Başka") });
    await recordCollection(null, tahsilatFormu(s.doctor.id, s.havale.id, "25000")); // havale
    await recordCollection(null, tahsilatFormu(baska.id, s.nakit.id, "25000")); // başka cari
    await recordCollection(null, tahsilatFormu(s.doctor.id, s.nakit.id, "25000", "2026-09-25")); // başka gün
    await recordCollection(null, tahsilatFormu(s.doctor.id, s.nakit.id, "25000"));
    const iptal = await prisma.doctorPayment.findFirstOrThrow({
      where: { doctorId: s.doctor.id, paymentMethodId: s.nakit.id, paidAt: { gte: new Date("2026-09-26") } },
    });
    const fd = new FormData();
    fd.set("paymentId", iptal.id);
    fd.set("reason", "Dekont hatalı");
    await cancelCollection(null, fd);

    expect(kodlar(await recordCollection(null, tahsilatFormu(s.doctor.id, s.nakit.id, "25000")))).toEqual([]);
    expect(kodlar(await recordCollection(null, tahsilatFormu(s.doctor.id, s.nakit.id, "5001")))).toEqual([
      "NAKIT_TEVSIK_LIMITI",
    ]);
  });

  it("gün İstanbul takvim günüdür: 23:30 ile 00:30 ayrı günlerdir (E-1 §(3))", async () => {
    const yaz = (paidAt: string) =>
      prisma.doctorPayment.create({
        data: {
          documentNo: `THS-T-${paidAt}`,
          doctorId: s.doctor.id,
          amount: "20000",
          paymentMethodId: s.nakit.id,
          commissionRate: "0",
          commissionAmount: "0",
          paidAt: new Date(paidAt),
          recordedBy: h.adminId,
        },
      });
    await yaz("2026-09-26T20:30:00Z"); // İstanbul 26.09 23:30
    await yaz("2026-09-26T21:30:00Z"); // İstanbul 27.09 00:30 — UTC'de hâlâ 26.09
    const uyari = (an: string) =>
      prisma.$transaction((tx) =>
        nakitTevsikUyarisi(tx, { doctorId: s.doctor.id, an: new Date(an), yon: "ALACAK" }, "30000")
      );
    expect(await uyari("2026-09-26T20:30:00Z")).toBeNull();
    expect(await uyari("2026-09-26T21:30:00Z")).toBeNull();
  });
});

describe("tahsilat ekranında vade uyarısı (X-6-1)", () => {
  it("borçlu carinin vadesi geçmiş hareketi varsa tahsilat sonucu BILGI taşır; tutar yok", async () => {
    const s = await seed();
    await prisma.ledgerEntry.create({
      data: {
        doctorId: s.doctor.id,
        type: "SEVKIYAT",
        direction: "BORC",
        amount: "10000",
        dueDate: new Date("2020-01-31T00:00:00Z"),
        documentNo: "T",
        createdById: h.adminId,
      },
    });
    expect(await recordCollection(null, tahsilatFormu(s.doctor.id, s.havale.id, "1000"))).toEqual({
      durum: "BASARILI_UYARILI",
      kademe: "BILGI",
      bildirimler: [{ kademe: "BILGI", kural_kodu: "VADESI_GECMIS_HAREKET", parametreler: { enEskiVade: "2020-01-31" } }],
    });
  });
});

describe("tahsilat cari hareketi ve iptal ters kaydı (A-11-1, X-11-1)", () => {
  let s: Awaited<ReturnType<typeof seed>>;
  beforeEach(async () => {
    s = await seed();
  });
  const iptalFormu = (paymentId: string) => {
    const fd = new FormData();
    fd.set("paymentId", paymentId);
    fd.set("reason", "Dekont hatalı");
    return fd;
  };

  it("tahsilat aynı numarayla ALACAK cari hareketi yazar; komisyon cariye dokunmaz, bakiye düşer", async () => {
    await recordCollection(null, tahsilatFormu(s.doctor.id, s.pos.id, "1000"));
    const p = await prisma.doctorPayment.findFirstOrThrow();
    expect(p.commissionAmount.toFixed(2)).toBe("25.00");
    const [h] = await prisma.ledgerEntry.findMany();
    expect([h.type, h.direction, h.amount.toFixed(2), h.documentNo, h.paymentId, h.dueDate]).toEqual([
      "TAHSILAT",
      "ALACAK",
      "1000.00",
      p.documentNo,
      p.id,
      null,
    ]);
    expect((await hesaplaDoktorBakiye(s.doctor.id)).bakiye.toFixed(2)).toBe("-1000.00");
  });

  it("iptal hareketi silmez, TERS_KAYIT ile çevirir; bakiye geri döner; ikinci iptal reddedilir", async () => {
    await recordCollection(null, tahsilatFormu(s.doctor.id, s.havale.id, "1000"));
    const p = await prisma.doctorPayment.findFirstOrThrow();
    await cancelCollection(null, iptalFormu(p.id));

    const hareketler = await prisma.ledgerEntry.findMany({ orderBy: { createdAt: "asc" } });
    expect(hareketler.map((h) => [h.type, h.direction, h.amount.toFixed(2), h.documentNo])).toEqual([
      ["TAHSILAT", "ALACAK", "1000.00", p.documentNo],
      ["TERS_KAYIT", "BORC", "1000.00", p.documentNo],
    ]);
    expect(hareketler[1].reversedEntryId).toBe(hareketler[0].id);
    expect((await hesaplaDoktorBakiye(s.doctor.id)).bakiye.toFixed(2)).toBe("0.00");
    expect((await cancelCollection(null, iptalFormu(p.id))).bildirimler[0].kural_kodu).toBe("TAHSILAT_ZATEN_IPTAL");
  });

  it("eşzamanlı iki iptalden yalnız biri ters kayıt yazar", async () => {
    await recordCollection(null, tahsilatFormu(s.doctor.id, s.havale.id, "1000"));
    const p = await prisma.doctorPayment.findFirstOrThrow();
    const sonuclar = await Promise.all([cancelCollection(null, iptalFormu(p.id)), cancelCollection(null, iptalFormu(p.id))]);
    expect(sonuclar.map((r) => r.durum).sort()).toEqual(["BASARILI", "ENGELLENDI"]);
    expect(await prisma.ledgerEntry.count({ where: { type: "TERS_KAYIT" } })).toBe(1);
  });
});
