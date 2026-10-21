import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db";
import { hesaplaDoktorBakiye } from "@/lib/doctor-cari";
import { sayilanBelgeler } from "@/lib/sayilan-belgeler";
import { takvimYili } from "@/lib/zaman";
import { referansVeri, yeniDoktorVerisi } from "../../../../test/integration/referans";

// A-7-2 · X-11-2 — elle vade farkı ve açılış/vade farkı ters kaydı (yalnız yönetici).
const h = vi.hoisted(() => ({ adminId: "" }));
vi.mock("@/lib/session", () => ({ requireAdmin: async () => ({ user: { id: h.adminId, role: "YONETICI" } }) }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("next/navigation", () => ({ redirect: () => {} }));
const { addVadeFarki, reverseLedgerEntry } = await import("./actions");

let doktorId = "";
beforeEach(async () => {
  await referansVeri();
  const y = await prisma.user.create({ data: { name: "Y", email: "y@medikal.local", passwordHash: "x", role: "YONETICI" } });
  h.adminId = y.id;
  doktorId = (await prisma.doctor.create({ data: yeniDoktorVerisi() })).id;
});
const form = (v: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, x] of Object.entries(v)) fd.set(k, x);
  return fd;
};
const kodlar = (r: { bildirimler: { kural_kodu: string; alan?: string }[] }) => r.bildirimler.map((b) => [b.kural_kodu, b.alan]);

describe("vade farkı elle (A-7-2)", () => {
  it("VDF numarasıyla VADE_FARKI · BORC yazar, vade taşır, gerekçe denetim kaydında; satış sayılmaz", async () => {
    const r = await addVadeFarki(doktorId, null, form({ amount: "150,25", dueDate: "2026-11-30", reason: "Gecikme" }));
    expect(r).toMatchObject({ durum: "BASARILI", parametreler: { documentNo: `VDF-${takvimYili()}-000001` } });
    const [x] = await prisma.ledgerEntry.findMany();
    expect([x.type, x.direction, x.amount.toFixed(2), x.dueDate?.toISOString().slice(0, 10), x.documentNo]).toEqual([
      "VADE_FARKI", "BORC", "150.25", "2026-11-30", `VDF-${takvimYili()}-000001`,
    ]);
    expect((await hesaplaDoktorBakiye(doktorId)).bakiye.toFixed(2)).toBe("150.25");
    expect(await prisma.ledgerEntry.count({ where: sayilanBelgeler.cariHareket })).toBe(0);
    const log = await prisma.auditLog.findFirstOrThrow({ where: { action: "LATE_FEE_CREATE" } });
    expect(String(log.afterData)).toContain("Gecikme");
  });

  it("tutar, vade ve gerekçe alan altında doğrulanır; hiçbir şey ve numara yazılmaz", async () => {
    const r = await addVadeFarki(doktorId, null, form({ amount: "0", dueDate: "2026-02-30", reason: " " }));
    expect(kodlar(r)).toEqual([
      ["GECERSIZ_TUTAR", "amount"],
      ["GECERSIZ_TARIH", "dueDate"],
      ["GEREKCE_ZORUNLU", "reason"],
    ]);
    expect([await prisma.ledgerEntry.count(), await prisma.documentCounter.count()]).toEqual([0, 0]);
  });
});

describe("açılış ve vade farkı ters kaydı (X-11-2)", () => {
  it("VDF ve ACL TERS_KAYIT ile çevrilir, bakiye geri döner; ikinci çevirme ve diğer tipler reddedilir", async () => {
    await addVadeFarki(doktorId, null, form({ amount: "100", dueDate: "2026-11-30", reason: "x" }));
    const vdf = await prisma.ledgerEntry.findFirstOrThrow();
    const acl = await prisma.ledgerEntry.create({
      data: { doctorId: doktorId, type: "ACILIS", direction: "ALACAK", amount: "40", documentNo: "ACL-T", createdById: h.adminId },
    });
    expect((await hesaplaDoktorBakiye(doktorId)).bakiye.toFixed(2)).toBe("60.00");

    expect(kodlar(await reverseLedgerEntry(vdf.id, null, form({ reason: "" })))).toEqual([["GEREKCE_ZORUNLU", "reason"]]);
    expect((await reverseLedgerEntry(vdf.id, null, form({ reason: "Yanlış tutar" }))).durum).toBe("BASARILI");
    expect((await reverseLedgerEntry(acl.id, null, form({ reason: "Açılış hatası" }))).durum).toBe("BASARILI");
    expect((await hesaplaDoktorBakiye(doktorId)).bakiye.toFixed(2)).toBe("0.00");
    const ters = await prisma.ledgerEntry.findMany({ where: { type: "TERS_KAYIT" }, orderBy: { createdAt: "asc" } });
    expect(ters.map((t) => [t.direction, t.amount.toFixed(2), t.reversedEntryId, t.dueDate])).toEqual([
      ["ALACAK", "100.00", vdf.id, null],
      ["BORC", "40.00", acl.id, null],
    ]);

    expect(kodlar(await reverseLedgerEntry(vdf.id, null, form({ reason: "tekrar" })))).toEqual([["TERS_KAYIT_VAR", undefined]]);
    expect(kodlar(await reverseLedgerEntry(ters[0].id, null, form({ reason: "x" })))).toEqual([["TERS_KAYIT_UYGUN_DEGIL", undefined]]);
  });
});
