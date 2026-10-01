/** Gün ekleyerek vade tarihi üretir (saat bileşenini korur). */
export function addDays(from: Date, days: number): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
}
