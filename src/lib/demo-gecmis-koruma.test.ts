import { describe, expect, it } from "vitest";

import { korumaHatasi } from "../../prisma/demo-gecmis-koruma";

// Demo geçmiş seed'inin ortam korumaları (tasarım 2-7b): canlıda değil, bilinçli bayrakla ve izinli
// veritabanı sunucusunda çalışır. Veritabanı düzeyindeki korumalar demo-gecmis.itest.ts'te.

const URL = "postgresql://kullanici:gizli-parola@localhost:5432/medikal_dev?schema=public";
const tamam = { DEMO_GECMIS: "evet", DEMO_GECMIS_HOST: "localhost" };

describe("korumaHatasi — demo geçmiş seed'inin ortam korumaları", () => {
  it("bütün koşullar sağlanınca çalışır", () => {
    expect(korumaHatasi(tamam, URL)).toBeNull();
  });

  it("canlıda çalışmaz", () => {
    expect(korumaHatasi({ ...tamam, NODE_ENV: "production" }, URL)).toMatch(/canlıda/);
  });

  it("bayrak yoksa ya da tam 'evet' değilse çalışmaz", () => {
    expect(korumaHatasi({ ...tamam, DEMO_GECMIS: undefined }, URL)).toMatch(/DEMO_GECMIS=evet/);
    expect(korumaHatasi({ ...tamam, DEMO_GECMIS: "1" }, URL)).toMatch(/DEMO_GECMIS=evet/);
  });

  it("sunucu izin listesinde değilse çalışmaz; liste virgülle ayrılır, boşluk kırpılır", () => {
    expect(korumaHatasi({ ...tamam, DEMO_GECMIS_HOST: "db, demo-db " }, "postgresql://u:p@demo-db:5432/x")).toBeNull();
    expect(korumaHatasi({ ...tamam, DEMO_GECMIS_HOST: "demo-db" }, URL)).toMatch(/\(localhost\) DEMO_GECMIS_HOST izin listesinde değil/);
    expect(korumaHatasi({ ...tamam, DEMO_GECMIS_HOST: " , " }, URL)).toMatch(/DEMO_GECMIS_HOST tanımlı değil/);
  });

  it("bağlantı adresinin tamamı mesaja yazılmaz: parola ve kullanıcı sızmaz", () => {
    const mesaj = korumaHatasi({ ...tamam, DEMO_GECMIS_HOST: "baska" }, URL) ?? "";
    expect(mesaj).not.toContain("gizli-parola");
    expect(mesaj).not.toContain("kullanici");
  });

  it("DATABASE_URL yoksa ya da çözümlenemezse çalışmaz", () => {
    expect(korumaHatasi(tamam, undefined)).toMatch(/DATABASE_URL tanımlı değil/);
    expect(korumaHatasi(tamam, "bozuk adres")).toMatch(/çözümlenemedi/);
  });
});
