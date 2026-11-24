import { describe, expect, it } from "vitest";

import { demoParola } from "@/lib/demo-parola";

// E-2: demo parolaları ortamdan; yoksa yerel varsayılan; ortamdan gelen parola yazdırılmaz (ortamdan bayrağı).

describe("demo parolaları (E-2)", () => {
  it("ortam boşsa yerel varsayılan ve ortamdan=false", () => {
    expect(demoParola("admin", {})).toEqual({ parola: "admin123", ortamdan: false });
    expect(demoParola("satici", { DEMO_SATICI_PAROLA: "  " })).toEqual({ parola: "satici123", ortamdan: false });
    expect(demoParola("operasyon", {})).toEqual({ parola: "operasyon123", ortamdan: false });
  });

  it("ortam değişkeni verilmişse o kullanılır ve ortamdan=true", () => {
    expect(demoParola("admin", { DEMO_ADMIN_PAROLA: "Gizli-9x" })).toEqual({ parola: "Gizli-9x", ortamdan: true });
  });
});
