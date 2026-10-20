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
