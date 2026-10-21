/**
 * Gün hücresi → `date` kolonu (UTC gece yarısı, E-1 §(1)). `YYYY-AA-GG` metni ya da Excel'in gün seri
 * numarası (1899-12-30 tabanlı) kabul edilir; geçersizse `null`.
 */
export function gunHucresi(deger: string): Date | null {
  const v = deger.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const d = new Date(`${v}T00:00:00Z`);
    return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v ? null : d;
  }
  if (/^\d{5}$/.test(v)) return new Date(Date.UTC(1899, 11, 30 + parseInt(v, 10)));
  return null;
}
