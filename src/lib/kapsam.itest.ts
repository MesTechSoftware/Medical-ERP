import { beforeEach, describe, expect, it } from "vitest";

import type { Role } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { kapsamliDoktorlariGetir } from "@/lib/doctor";
import { degistirDoktorSahibi } from "@/lib/sahiplik";
import { yeniDoktorVerisi } from "../../test/integration/referans";

// `kapsamliDoktorlariGetir(kullanici)` — KABUL_KRITERLERI X-13-1.

const kullanicilar: Record<"yonetici" | "operasyon" | "saticiA" | "saticiB", { id: string; role: Role }> = {
  yonetici: { id: "", role: "YONETICI" },
  operasyon: { id: "", role: "OPERASYON" },
  saticiA: { id: "", role: "SATICI" },
  saticiB: { id: "", role: "SATICI" },
};
const ad: Record<string, string> = {};

async function doktor(fullName: string, sahip: string | null, accountClass: "DOKTOR" | "BAYI" = "DOKTOR") {
  const d = await prisma.doctor.create({ data: { ...yeniDoktorVerisi(fullName), accountClass } });
  if (sahip) {
    await prisma.$transaction((tx) =>
      degistirDoktorSahibi([d.id], sahip, { metin: "test", yapanId: kullanicilar.yonetici.id }, tx)
    );
  }
  ad[d.id] = fullName;
}

const gorulen = async (k: { id: string; role: Role }) =>
  (await prisma.doctor.findMany({ where: kapsamliDoktorlariGetir(k), select: { id: true } }))
    .map((d) => ad[d.id])
    .sort();

beforeEach(async () => {
  for (const [anahtar, k] of Object.entries(kullanicilar)) {
    const u = await prisma.user.create({
      data: { name: anahtar, email: `${anahtar}@medikal.local`, passwordHash: "x", role: k.role },
    });
    k.id = u.id;
  }
  await doktor("A'nın", kullanicilar.saticiA.id);
  await doktor("B'nin", kullanicilar.saticiB.id);
  await doktor("Sahipsiz", null);
  await doktor("Bayi", null, "BAYI");
});

describe("kapsamliDoktorlariGetir (X-13-1)", () => {
  it("SATICI yalnız sahibi olduğu DOKTOR carilerini görür", async () => {
    expect(await gorulen(kullanicilar.saticiA)).toEqual(["A'nın"]);
    expect(await gorulen(kullanicilar.saticiB)).toEqual(["B'nin"]);
  });

  it.each(["yonetici", "operasyon"] as const)("%s bütün carileri görür — sahipsiz ve BAYI dahil", async (k) => {
    expect(await gorulen(kullanicilar[k])).toEqual(["A'nın", "B'nin", "Bayi", "Sahipsiz"]);
  });

  it("devirden sonra kapsam yeni sahibe geçer", async () => {
    const [d] = await prisma.doctor.findMany({ where: { fullName: "A'nın" } });
    await prisma.$transaction((tx) =>
      degistirDoktorSahibi([d.id], kullanicilar.saticiB.id, { metin: "devir", yapanId: kullanicilar.yonetici.id }, tx)
    );
    expect(await gorulen(kullanicilar.saticiA)).toEqual([]);
    expect(await gorulen(kullanicilar.saticiB)).toEqual(["A'nın", "B'nin"]);
  });

  it("başka süzgeçle birleştirilir; kapsam dışındaki cari id ile de bulunmaz", async () => {
    const [b] = await prisma.doctor.findMany({ where: { fullName: "B'nin" } });
    const bul = (k: { id: string; role: Role }) =>
      prisma.doctor.findFirst({ where: { AND: [kapsamliDoktorlariGetir(k), { id: b.id }] } });
    expect(await bul(kullanicilar.saticiA)).toBeNull();
    expect((await bul(kullanicilar.saticiB))?.id).toBe(b.id);
  });
});
