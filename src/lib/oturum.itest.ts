import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import {
  SON_GORULME_ESIGI_MS,
  kullaniciOturumlariniSonlandir,
  oturumDogrula,
  oturumIptal,
  oturumOlustur,
  tokenHash,
} from "@/lib/oturum";

// E-2 — oturum tablosu (ADR-003). KABUL_KRITERLERI E-2-1, E-2-2, E-2-3.
const SAAT = 3_600_000;
const t0 = new Date("2026-10-19T06:00:00Z");
const sonra = (ms: number) => new Date(t0.getTime() + ms);

describe("oturum (E-2)", () => {
  let ali = "";
  let veli = "";

  beforeEach(async () => {
    const kullanici = (name: string, email: string) =>
      prisma.user.create({ data: { name, email, passwordHash: "x", role: "SATICI" } });
    ali = (await kullanici("Ali", "ali@m.local")).id;
    veli = (await kullanici("Veli", "veli@m.local")).id;
  });

  it("DB'de token değil yalnız SHA-256 hash'i durur (E-2-1)", async () => {
    const token = await oturumOlustur(ali, t0);
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/); // 32 bayt base64url

    const [satir] = await prisma.session.findMany();
    expect(satir.tokenHash).toBe(tokenHash(token));
    expect(JSON.stringify(satir)).not.toContain(token);
  });

  it("her giriş ayrı token üretir", async () => {
    const a = await oturumOlustur(ali, t0);
    const b = await oturumOlustur(ali, t0);
    expect(a).not.toBe(b);
  });

  it("geçerli token kullanıcıyı döner; bilinmeyen token null (E-2-1)", async () => {
    const token = await oturumOlustur(ali, t0);
    expect(await oturumDogrula(token, sonra(1000))).toEqual({
      id: ali,
      name: "Ali",
      email: "ali@m.local",
      role: "SATICI",
    });
    expect(await oturumDogrula("uydurma", sonra(1000))).toBeNull();
  });

  it("rol her istekte okunur: değişen rol bir sonraki doğrulamada görünür (E-2-1)", async () => {
    const token = await oturumOlustur(ali, t0);
    await prisma.user.update({ where: { id: ali }, data: { role: "OPERASYON" } });
    expect((await oturumDogrula(token, sonra(1000)))?.role).toBe("OPERASYON");
  });

  it("pasif kullanıcının oturumu geçersizdir (E-2-1)", async () => {
    const token = await oturumOlustur(ali, t0);
    await prisma.user.update({ where: { id: ali }, data: { isActive: false } });
    expect(await oturumDogrula(token, sonra(1000))).toBeNull();
  });

  it("hareketsizlik 4 saatte, mutlak süre 12 saatte doldurur (E-2-2)", async () => {
    const token = await oturumOlustur(ali, t0);
    expect(await oturumDogrula(token, sonra(4 * SAAT))).toBeNull();

    // Kayar: her 3 saatte görülen oturum 12. saate kadar yaşar, 12. saatte biter.
    const kayan = await oturumOlustur(veli, t0);
    for (const saat of [3, 6, 9]) expect(await oturumDogrula(kayan, sonra(saat * SAAT))).not.toBeNull();
    expect(await oturumDogrula(kayan, sonra(12 * SAAT - 1))).not.toBeNull();
    expect(await oturumDogrula(kayan, sonra(12 * SAAT))).toBeNull();
  });

  it("son görülme 5 dakikadan eskiyse yazılır, değilse yazılmaz (E-2-2)", async () => {
    const token = await oturumOlustur(ali, t0);
    const sonGorulme = async () => (await prisma.session.findFirstOrThrow()).lastSeenAt.getTime();

    await oturumDogrula(token, sonra(SON_GORULME_ESIGI_MS - 1));
    expect(await sonGorulme()).toBe(t0.getTime());

    await oturumDogrula(token, sonra(SON_GORULME_ESIGI_MS));
    expect(await sonGorulme()).toBe(sonra(SON_GORULME_ESIGI_MS).getTime());
  });

  it("çıkış yalnız o oturumu iptal eder; satır silinmez (E-2-3)", async () => {
    const birinci = await oturumOlustur(ali, t0);
    const ikinci = await oturumOlustur(ali, t0);
    await oturumIptal(birinci, sonra(1000));

    expect(await oturumDogrula(birinci, sonra(2000))).toBeNull();
    expect(await oturumDogrula(ikinci, sonra(2000))).not.toBeNull();
    expect(await prisma.session.count()).toBe(2);
    expect((await prisma.session.findUniqueOrThrow({ where: { tokenHash: tokenHash(birinci) } })).revokedAt).toEqual(
      sonra(1000)
    );
  });

  it("pasifleştirme kullanıcının bütün oturumlarını iptal eder, başkasınınkine dokunmaz (E-2-3)", async () => {
    const a1 = await oturumOlustur(ali, t0);
    const a2 = await oturumOlustur(ali, t0);
    const v = await oturumOlustur(veli, t0);

    const sayi = await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: ali }, data: { isActive: false } });
      return kullaniciOturumlariniSonlandir(tx, ali, sonra(1000));
    });
    expect(sayi).toBe(2);

    // Yeniden aktifleştirme eski oturumları geri getirmez.
    await prisma.user.update({ where: { id: ali }, data: { isActive: true } });
    expect(await oturumDogrula(a1, sonra(2000))).toBeNull();
    expect(await oturumDogrula(a2, sonra(2000))).toBeNull();
    expect(await oturumDogrula(v, sonra(2000))).not.toBeNull();
    expect(await prisma.session.count()).toBe(3);
  });

  it("transaction geri alınırsa oturumlar iptal edilmez (E-2-3)", async () => {
    const token = await oturumOlustur(ali, t0);
    await expect(
      prisma.$transaction(async (tx) => {
        await kullaniciOturumlariniSonlandir(tx, ali, sonra(1000));
        throw new Error("geri al");
      })
    ).rejects.toThrow("geri al");
    expect(await oturumDogrula(token, sonra(2000))).not.toBeNull();
  });
});
