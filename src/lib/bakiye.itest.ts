import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { hesaplaDoktorBakiye } from "@/lib/doctor-cari";
import { yeniDoktorVerisi } from "../../test/integration/referans";

// `hesaplaDoktorBakiye(doktor, tarih?)` — KABUL_KRITERLERI K-2-1…K-2-3.

type Tip = "SEVKIYAT" | "IADE" | "TAHSILAT" | "ACILIS" | "VADE_FARKI" | "TERS_KAYIT";

let doktorId = "";
let yapanId = "";

const hareket = (type: Tip, direction: "BORC" | "ALACAK", amount: string, createdAt?: Date) =>
  prisma.ledgerEntry.create({
    data: { doctorId: doktorId, type, direction, amount, documentNo: "T", createdById: yapanId, ...(createdAt ? { createdAt } : {}) },
  });

beforeEach(async () => {
  const u = await prisma.user.create({ data: { name: "Y", email: "y@medikal.local", passwordHash: "x", role: "YONETICI" } });
  const d = await prisma.doctor.create({ data: yeniDoktorVerisi() });
  yapanId = u.id;
  doktorId = d.id;
});

describe("hesaplaDoktorBakiye — bütün tipler (K-2-1)", () => {
  it("açılış, vade farkı ve ters kayıt dahil her hareket bakiyeye girer", async () => {
    await hareket("ACILIS", "BORC", "1000.00");
    await hareket("SEVKIYAT", "BORC", "500.00");
    await hareket("VADE_FARKI", "BORC", "25.50");
    await hareket("IADE", "ALACAK", "100.00");
    await hareket("TAHSILAT", "ALACAK", "300.00");
    await hareket("TERS_KAYIT", "ALACAK", "500.00"); // sevkiyatın ters kaydı

    const b = await hesaplaDoktorBakiye(doktorId);
    expect(b.toplamBorc.toFixed(2)).toBe("1525.50");
    expect(b.toplamAlacak.toFixed(2)).toBe("900.00");
    expect(b.bakiye.toFixed(2)).toBe("625.50");
    expect(b.yon).toBe("BORC");
  });

  it("hareket yoksa bakiye sıfır ve kapalıdır", async () => {
    const b = await hesaplaDoktorBakiye(doktorId);
    expect(b.bakiye.toFixed(2)).toBe("0.00");
    expect(b.yon).toBe("KAPALI");
  });
});

describe("hesaplaDoktorBakiye — avans (K-2-2)", () => {
  it("alacak borçtan büyükse bakiye negatif, yön ALACAK", async () => {
    await hareket("SEVKIYAT", "BORC", "1000");
    await hareket("TAHSILAT", "ALACAK", "1250");
    const b = await hesaplaDoktorBakiye(doktorId);
    expect(b.bakiye.toFixed(2)).toBe("-250.00");
    expect(b.yon).toBe("ALACAK");
    expect(b.bakiye.abs().toFixed(2)).toBe("250.00");
  });

  it("borç ve alacak eşitse yön KAPALI", async () => {
    await hareket("SEVKIYAT", "BORC", "400");
    await hareket("TAHSILAT", "ALACAK", "400");
    expect((await hesaplaDoktorBakiye(doktorId)).yon).toBe("KAPALI");
  });
});

describe("hesaplaDoktorBakiye — tarih itibarıyla (K-2-3)", () => {
  // 31 Ağustos 2026 = İstanbul (UTC+3) günü [30.08 21:00Z, 31.08 21:00Z).
  const otuzBirAgustos = new Date("2026-08-31T00:00:00Z"); // `date` kolonu biçimi (bugun())

  it("o günün son dakikası dahil, ertesi günün ilk dakikası hariç", async () => {
    await hareket("SEVKIYAT", "BORC", "100", new Date("2026-08-30T12:00:00Z")); // 30.08
    await hareket("SEVKIYAT", "BORC", "20", new Date("2026-08-31T20:59:00Z")); // 31.08 23:59 İstanbul
    await hareket("SEVKIYAT", "BORC", "3", new Date("2026-08-31T21:01:00Z")); // 01.09 00:01 İstanbul

    expect((await hesaplaDoktorBakiye(doktorId, otuzBirAgustos)).bakiye.toFixed(2)).toBe("120.00");
    expect((await hesaplaDoktorBakiye(doktorId)).bakiye.toFixed(2)).toBe("123.00");
  });

  it("tarihten önce hareket yoksa sıfırdır", async () => {
    await hareket("SEVKIYAT", "BORC", "100", new Date("2026-09-05T09:00:00Z"));
    expect((await hesaplaDoktorBakiye(doktorId, otuzBirAgustos)).yon).toBe("KAPALI");
  });

  it("transaction istemcisiyle de okur", async () => {
    await hareket("SEVKIYAT", "BORC", "75");
    const b = await prisma.$transaction((tx) => hesaplaDoktorBakiye(doktorId, undefined, tx));
    expect(b.bakiye.toFixed(2)).toBe("75.00");
  });
});
