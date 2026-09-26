import { describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";

// F-00 ALTYAPI testi — iş kuralı sınamaz, altyapının kendisini sınar:
// şema uygulandı mı, veritabanı yazılabilir mi, testler birbirinden izole mi.
// İş kuralı entegrasyon testleri C2'den itibaren gelir.
describe("entegrasyon altyapısı", () => {
  it("şema uygulanmıştır ve veritabanı yazılabilir", async () => {
    await prisma.user.create({
      data: {
        name: "Altyapı Testi",
        email: "altyapi@medikal.local",
        passwordHash: "test",
      },
    });

    expect(await prisma.user.count()).toBe(1);
  });

  it("her testten önce TRUNCATE atılır — önceki testin verisi görünmez", async () => {
    expect(await prisma.user.count()).toBe(0);
  });
});
