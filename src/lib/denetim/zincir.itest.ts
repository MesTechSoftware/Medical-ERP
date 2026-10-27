import { describe, expect, it } from "vitest";

import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { zinciriDogrula } from "@/lib/denetim/dogrulama";
import { muhurHesapla } from "@/lib/denetim/zincir";
import { eszamanlilikHatasi } from "@/lib/kullanici";

// X-18-1 değişmezlik · X-18-2 zincir (ADR-011, ADR-012). Mühür commit anında veritabanında yazılır.

const yaz = (entityId: string, ek: { gerekce?: string } = {}) =>
  prisma.$transaction((tx) =>
    createAuditLog({ action: AUDIT_ACTIONS.AUTH_LOGIN_FAILURE, entityType: "Auth", entityId, ...ek }, tx)
  );

const zincir = () =>
  prisma.auditLogSeal.findMany({ orderBy: { chainIndex: "asc" }, select: { logId: true, chainIndex: true, prevHash: true, hash: true } });

/** Bakım yolu (ADR-011 §11): tetikleyiciler yalnız bu transaction'da kapalıdır. */
const bakimda = (...cumleler: [string, ...unknown[]][]) =>
  prisma.$transaction([
    prisma.$executeRawUnsafe("SET LOCAL session_replication_role = replica"),
    ...cumleler.map(([sql, ...p]) => prisma.$executeRawUnsafe(sql, ...p)),
  ]);

describe("zincir — commit anında mühür (X-18-2)", () => {
  it("ilk mühür önceki özetsizdir; veritabanının özeti uygulamanınkiyle aynıdır", async () => {
    await yaz("ali@m.local", { gerekce: "Çağrı merkezi ışığı" }); // çok baytlı karakter
    const [log] = await prisma.auditLog.findMany();
    const [muhur] = await zincir();
    expect(muhur).toEqual({ logId: log.id, chainIndex: 1, prevHash: null, hash: muhurHesapla(null, log) });
  });

  it("sonraki mühür öncekine bağlanır", async () => {
    await yaz("a@m.local");
    await yaz("b@m.local");
    const [m1, m2] = await zincir();
    expect(m2.chainIndex).toBe(2);
    expect(m2.prevHash).toBe(m1.hash);
    const log2 = await prisma.auditLog.findUniqueOrThrow({ where: { id: m2.logId } });
    expect(m2.hash).toBe(muhurHesapla(m1.hash, log2));
  });

  it("geri alınan transaction ne kayıt ne mühür bırakır", async () => {
    await expect(
      prisma.$transaction(async (tx) => {
        await createAuditLog({ action: AUDIT_ACTIONS.AUTH_LOGIN_FAILURE, entityType: "Auth", entityId: "x@m.local" }, tx);
        throw new Error("iş hatası");
      })
    ).rejects.toThrow("iş hatası");
    expect(await prisma.auditLog.count()).toBe(0);
    expect(await prisma.auditLogSeal.count()).toBe(0);
  });

  it("eşzamanlı commit'ler zinciri bozmaz: boşluksuz ve bağlı (ADR-012 §4)", async () => {
    // Her transaction ayrı bağlantıda kaydını yazar, bekler ve commit eder; commit'ler üst üste biner.
    await Promise.all(
      Array.from({ length: 8 }, (_, i) =>
        prisma.$transaction(async (tx) => {
          await createAuditLog({ action: AUDIT_ACTIONS.AUTH_LOGIN_FAILURE, entityType: "Auth", entityId: `k${i}@m.local` }, tx);
          await tx.$executeRaw`SELECT pg_sleep(${(i % 3) * 0.02})`;
        })
      )
    );
    const z = await zincir();
    expect(z.map((m) => m.chainIndex)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    const rapor = await zinciriDogrula();
    expect(rapor.sorunlar).toEqual([]);
    expect(rapor.muhursuz).toEqual([]);
  });

  it("SERIALIZABLE transaction son mührü göremezse serileştirme hatasıyla geri alınır; zincir bozulmaz", async () => {
    await yaz("ilk@m.local");
    const hata = await prisma
      .$transaction(
        async (tx) => {
          await tx.auditLogSeal.count(); // anlık görüntü burada alınır
          await yaz("araya-giren@m.local"); // başka bağlantı, commit eder
          await createAuditLog({ action: AUDIT_ACTIONS.AUTH_LOGIN_FAILURE, entityType: "Auth", entityId: "gec@m.local" }, tx);
        },
        { isolationLevel: "Serializable" }
      )
      .then(
        () => null,
        (e: unknown) => e
      );
    expect(eszamanlilikHatasi(hata)).toBe(true);
    expect((await zincir()).map((m) => m.chainIndex)).toEqual([1, 2]);
    expect(await prisma.auditLog.count({ where: { entityId: "gec@m.local" } })).toBe(0);
    expect((await zinciriDogrula()).sorunlar).toEqual([]);
  });
});

describe("değişmezlik (X-18-1)", () => {
  it("kayıt ve mühür güncellenemez, silinemez, boşaltılamaz", async () => {
    await yaz("a@m.local");
    const [log] = await prisma.auditLog.findMany();
    const red = /Denetim kaydı değiştirilemez ve silinemez/;
    await expect(prisma.auditLog.update({ where: { id: log.id }, data: { reason: "sonradan" } })).rejects.toThrow(red);
    await expect(prisma.auditLog.deleteMany()).rejects.toThrow(red);
    await expect(prisma.$executeRawUnsafe('TRUNCATE "AuditLog" CASCADE')).rejects.toThrow(red);
    await expect(prisma.auditLogSeal.updateMany({ data: { hash: "0" } })).rejects.toThrow(red);
    await expect(prisma.auditLogSeal.deleteMany()).rejects.toThrow(red);
    await expect(prisma.$executeRawUnsafe('TRUNCATE "AuditLogSeal"')).rejects.toThrow(red);
    // Başka tablonun CASCADE boşaltması da denetim kaydına dokunamaz.
    await expect(prisma.$executeRawUnsafe('TRUNCATE "User" CASCADE')).rejects.toThrow(red);
    expect(await prisma.auditLog.count()).toBe(1);
  });
});

describe("doğrulama — kurcalama adıyla görünür (X-18-2)", () => {
  async function ucKayit() {
    for (const e of ["a@m.local", "b@m.local", "c@m.local"]) await yaz(e);
    return zincir();
  }

  it("sağlam zincir temizdir; son özet ve sayılar raporda", async () => {
    const z = await ucKayit();
    expect(await zinciriDogrula()).toEqual({ kayitSayisi: 3, sonIndeks: 3, sonHash: z[2].hash, sorunlar: [], muhursuz: [] });
  });

  it("içeriği değiştirilen kaydı bildirir", async () => {
    const z = await ucKayit();
    await bakimda(['UPDATE "AuditLog" SET "entityId" = $1 WHERE "id" = $2', "sahte@m.local", z[1].logId]);
    expect((await zinciriDogrula()).sorunlar).toEqual([{ chainIndex: 2, logId: z[1].logId, tur: "ICERIK_UYUSMUYOR" }]);
  });

  it("mührüyle birlikte silinen kayıt boşluk ve kopuk bağ bırakır", async () => {
    const z = await ucKayit();
    await bakimda(['DELETE FROM "AuditLogSeal" WHERE "logId" = $1', z[1].logId], ['DELETE FROM "AuditLog" WHERE "id" = $1', z[1].logId]);
    expect((await zinciriDogrula()).sorunlar).toEqual([
      { chainIndex: 3, logId: z[2].logId, tur: "ZINCIR_BOSLUGU" },
      { chainIndex: 3, logId: z[2].logId, tur: "BAG_KOPUK" },
    ]);
  });

  it("mührü kalıp silinen kaydı ve mühürsüz eklenen kaydı bildirir", async () => {
    const z = await ucKayit();
    await bakimda(
      ['DELETE FROM "AuditLog" WHERE "id" = $1', z[0].logId],
      [
        `INSERT INTO "AuditLog" ("id", "action", "actionType", "module", "entityType") VALUES ('elle-eklenen', 'AUTH_LOGOUT', 'OTURUM', 'KULLANICI', 'Auth')`,
      ]
    );
    const rapor = await zinciriDogrula();
    expect(rapor.sorunlar).toEqual([{ chainIndex: 1, logId: z[0].logId, tur: "KAYIT_YOK" }]);
    expect(rapor.muhursuz).toEqual(["elle-eklenen"]);
  });
});
