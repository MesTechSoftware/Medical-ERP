import { describe, expect, it } from "vitest";

import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";

// X-3-3 — denetim kaydı işle aynı transaction'dadır ve hata yutulmaz (X-3 §(4)).
describe("createAuditLog (X-3-3)", () => {
  it("kayıt yazılamazsa hata fırlar ve aynı transaction'daki iş geri alınır", async () => {
    await expect(
      prisma.$transaction(async (tx) => {
        await tx.user.create({ data: { name: "İş", email: "is@m.local", passwordHash: "x", role: "SATICI" } });
        // Olmayan aktör: yabancı anahtar ihlali.
        await createAuditLog(
          { actorId: "olmayan-kullanici", action: AUDIT_ACTIONS.USER_CREATE, entityType: "User", entityId: "x" },
          tx
        );
      })
    ).rejects.toThrow();
    expect(await prisma.user.count()).toBe(0);
    expect(await prisma.auditLog.count()).toBe(0);
  });

  it("transaction commit olursa iş ve kayıt birlikte vardır", async () => {
    await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({ data: { name: "İş", email: "is@m.local", passwordHash: "x", role: "SATICI" } });
      await createAuditLog({ actorId: u.id, action: AUDIT_ACTIONS.USER_CREATE, entityType: "User", entityId: u.id }, tx);
    });
    expect(await prisma.auditLog.count()).toBe(1);
  });
});

// X-18-3/4/5 — kayıt alanları, maskeleme ve gerekçe (KARARLAR X-18 §(3)–(6)).
describe("createAuditLog — kayıt alanları (X-18)", () => {
  const yonetici = () => prisma.user.create({ data: { name: "Yönetici", email: "y@m.local", passwordHash: "x", role: "YONETICI" } });
  const yaz = (girdi: Parameters<typeof createAuditLog>[0]) => prisma.$transaction((tx) => createAuditLog(girdi, tx));
  const tek = () => prisma.auditLog.findFirstOrThrow();

  it("UUIDv7 kimlik, tür, modül ve aktörün o anki rolü; istek dışında bağlam boş (X-18-3)", async () => {
    const u = await yonetici();
    await yaz({
      actorId: u.id,
      action: AUDIT_ACTIONS.DUE_DATE_CHANGE,
      entityType: "LedgerEntry",
      entityId: "ck-hareket",
      before: { dueDate: new Date("2026-11-01T00:00:00.000Z") },
      after: { dueDate: new Date("2026-11-15T00:00:00.000Z") },
    });
    const k = await tek();
    expect(k.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(k).toMatchObject({
      actionType: "GUNCELLEME",
      module: "FINANS",
      actorRole: "YONETICI",
      ipAddress: null,
      sessionId: null,
      requestMethod: null,
      endpoint: null,
    });
    expect(JSON.parse(k.changes!)).toEqual([{ alan: "dueDate", eski: "2026-11-01T00:00:00.000Z", yeni: "2026-11-15T00:00:00.000Z" }]);

    // Rol sonradan değişse de kayıt yazım anının rolünü taşır.
    await prisma.user.update({ where: { id: u.id }, data: { role: "OPERASYON" } });
    expect((await tek()).actorRole).toBe("YONETICI");
  });

  it("aktörsüz ve farksız kayıtta rol boş, değişiklik listesi boş dizi", async () => {
    await yaz({ action: AUDIT_ACTIONS.AUTH_LOGIN_FAILURE, entityType: "Auth", entityId: "kim@m.local" });
    expect(await tek()).toMatchObject({ actorRole: null, changes: "[]", actionType: "OTURUM", module: "KULLANICI" });
  });

  it("fiyat satırı ilk girişte Ekleme, önceki değer varken Güncelleme", async () => {
    await yaz({ action: AUDIT_ACTIONS.PRICE_LIST_ITEM_SET, entityType: "PriceList", entityId: "l1", after: { listPrice: "10.0000" } });
    await yaz({
      action: AUDIT_ACTIONS.PRICE_LIST_ITEM_SET,
      entityType: "PriceList",
      entityId: "l1",
      before: { listPrice: "10.0000" },
      after: { listPrice: "12.0000" },
    });
    const turler = (await prisma.auditLog.findMany({ orderBy: { seq: "asc" } })).map((k) => k.actionType);
    expect(turler).toEqual(["EKLEME", "GUNCELLEME"]);
  });

  it("hassas değer hiçbir kolona yazılmaz; değiştiği görünür (X-18-4)", async () => {
    await yaz({
      action: AUDIT_ACTIONS.DOCTOR_UPDATE,
      entityType: "Doctor",
      entityId: "d1",
      before: { fullName: "Dr. A", taxId: "10000000146", invoiceCity: "İzmir" },
      after: { fullName: "Dr. A", taxId: "12345678901", invoiceCity: "İzmir" },
    });
    const k = await tek();
    expect(JSON.stringify(k)).not.toMatch(/10000000146|12345678901|İzmir/);
    expect(JSON.parse(k.beforeData!)).toEqual({ fullName: "Dr. A", taxId: "***", invoiceCity: "***" });
    expect(JSON.parse(k.changes!)).toEqual([{ alan: "taxId", eski: "***", yeni: "***" }]);
  });

  it("gerekçe kendi alanındadır; boşluktan ibaret gerekçe boş kalır (X-18-5)", async () => {
    await yaz({ action: AUDIT_ACTIONS.IMPORT_REVERT, entityType: "ImportBatch", entityId: "p1", after: { batchNo: "P-1" }, gerekce: "  Yanlış dosya  " });
    await yaz({ action: AUDIT_ACTIONS.IMPORT_REVERT, entityType: "ImportBatch", entityId: "p2", after: { batchNo: "P-2" }, gerekce: "   " });
    const [ilk, ikinci] = await prisma.auditLog.findMany({ orderBy: { seq: "asc" } });
    expect(ilk.reason).toBe("Yanlış dosya");
    expect(ikinci.reason).toBeNull();
  });

  it("verilen oturum numarası kayda yazılır (giriş kaydı açılan oturumu taşır)", async () => {
    await yaz({ action: AUDIT_ACTIONS.AUTH_LOGIN_SUCCESS, entityType: "Auth", entityId: "u1", oturumId: "ck-oturum" });
    expect((await tek()).sessionId).toBe("ck-oturum");
  });
});
