import { afterEach, describe, expect, it, vi } from "vitest";

import { VARSAYILAN_MARKA, logoYolu, marka } from "@/lib/marka";

// E-2: marka sunucu ortamından okunur; boşsa nötr varsayılan; logo yolu isteğe bağlıdır.

afterEach(() => vi.unstubAllEnvs());

describe("marka yapılandırması (E-2)", () => {
  it("APP_BRAND yoksa ya da boşsa nötr varsayılan", () => {
    vi.stubEnv("APP_BRAND", "");
    expect(marka()).toBe(VARSAYILAN_MARKA);
    vi.stubEnv("APP_BRAND", "   ");
    expect(marka()).toBe(VARSAYILAN_MARKA);
  });

  it("APP_BRAND her çağrıda okunur (derlemede donmaz)", () => {
    vi.stubEnv("APP_BRAND", "Örnek Klinik");
    expect(marka()).toBe("Örnek Klinik");
    vi.stubEnv("APP_BRAND", "Başka Ad");
    expect(marka()).toBe("Başka Ad");
  });

  it("logo yolu yoksa null; verilmişse kırpılmış değer", () => {
    vi.stubEnv("APP_LOGO", "");
    vi.stubEnv("APP_LOGO_MARK", " /isaret.png ");
    expect(logoYolu("tam")).toBeNull();
    expect(logoYolu("isaret")).toBe("/isaret.png");
  });
});
