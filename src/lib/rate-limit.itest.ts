import { describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { checkLock, recordFailure, reset } from "@/lib/rate-limit";

// ADR-004: başarısız deneme bir DB yazımı üretmez. `LoginAttempt` tablosu
// CM'e kadar şemada durur ama C7b'den sonra hiçbir kod ona dokunmaz.
describe("giriş sayacı — veritabanına yazmaz (C7b, X-9)", () => {
  it("eşik aşılıp kilitlense bile LoginAttempt boş kalır", async () => {
    const email = "itest-kilit@medikal.local";
    for (let i = 0; i < 5; i++) recordFailure(email);

    expect(checkLock(email).locked).toBe(true);
    expect(await prisma.loginAttempt.count()).toBe(0);

    reset(email);
    expect(checkLock(email).locked).toBe(false);
  });
});
