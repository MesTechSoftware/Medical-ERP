import { afterEach, describe, expect, it, vi } from "vitest";

import { uretBelgeNo } from "@/lib/belge-no";
import { prisma } from "@/lib/db";

// `uretBelgeNo()` yıl sınırı — KABUL_KRITERLERI A-14-4. Biçim, kilit ve geri alma
// (A-14-1…3) `kisitlar.itest.ts`'tedir.

const an = (iso: string) => vi.setSystemTime(new Date(iso));
const no = () => prisma.$transaction((tx) => uretBelgeNo("SIP", tx));

afterEach(() => {
  vi.useRealTimers();
});

describe("uretBelgeNo — yıl (A-14-4)", () => {
  it("yıl İstanbul takvim yılıdır; yeni yılda sayaç 1'den başlar", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    an("2026-12-31T20:59:00Z"); // İstanbul 31.12.2026 23:59
    expect(await no()).toBe("SIP-2026-000001");
    expect(await no()).toBe("SIP-2026-000002");

    an("2026-12-31T21:01:00Z"); // İstanbul 01.01.2027 00:01 — UTC'de hâlâ 2026
    expect(await no()).toBe("SIP-2027-000001");

    an("2027-03-01T09:00:00Z");
    expect(await no()).toBe("SIP-2027-000002");
  });

  it("kayıt anı verilirse yıl o anın İstanbul yılıdır; o yılın sayacı ayrı ilerler", async () => {
    const gecmis = new Date("2025-12-31T21:30:00Z"); // İstanbul 01.01.2026 00:30
    const onceki = new Date("2025-06-15T09:00:00Z");
    expect(await prisma.$transaction((tx) => uretBelgeNo("THS", tx, onceki))).toBe("THS-2025-000001");
    expect(await prisma.$transaction((tx) => uretBelgeNo("THS", tx, gecmis))).toBe("THS-2026-000001");
    expect(await prisma.$transaction((tx) => uretBelgeNo("THS", tx, onceki))).toBe("THS-2025-000002");
  });
});
