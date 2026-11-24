/**
 * Demo hesap parolaları (KARARLAR E-2). Ortam değişkeni verilmişse o kullanılır; yoksa YALNIZ yerel ve
 * demo için bilinen varsayılan. Seed ve e2e aynı değişkenleri aynı varsayılanla okur; ortamdan gelen
 * parola hiçbir yere yazdırılmaz. Canlı demo sunucusunda varsayılanlar bırakılmaz (README "Demo ortamı").
 */
export const DEMO_PAROLA_ORTAM = {
  admin: "DEMO_ADMIN_PAROLA",
  satici: "DEMO_SATICI_PAROLA",
  operasyon: "DEMO_OPERASYON_PAROLA",
} as const;

export const DEMO_PAROLA_VARSAYILAN = {
  admin: "admin123",
  satici: "satici123",
  operasyon: "operasyon123",
} as const;

export type DemoRol = keyof typeof DEMO_PAROLA_ORTAM;

export function demoParola(rol: DemoRol, ortam: Record<string, string | undefined> = process.env): { parola: string; ortamdan: boolean } {
  const verilen = ortam[DEMO_PAROLA_ORTAM[rol]]?.trim();
  return verilen ? { parola: verilen, ortamdan: true } : { parola: DEMO_PAROLA_VARSAYILAN[rol], ortamdan: false };
}
