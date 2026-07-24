import { prisma } from "@/lib/db";

/**
 * Admin tarafından belirlenen sistem parametreleri (D-20).
 *
 * Anahtar/değer tablosunda tutulur: yeni parametre eklemek şema değişikliği
 * gerektirmez. Değerler string saklanır, burada tiplenir.
 */

export const SETTING_KEYS = {
  /** Yeni siparişlerde varsayılan vade (gün). */
  DEFAULT_DUE_DAYS: "DEFAULT_DUE_DAYS",
  /** Vadenin sipariş tarihinden itibaren uzatılabileceği ÜST SINIR (gün). */
  MAX_DUE_DAYS: "MAX_DUE_DAYS",
} as const;

export const SETTING_DEFAULTS: Record<string, number> = {
  [SETTING_KEYS.DEFAULT_DUE_DAYS]: 30,
  [SETTING_KEYS.MAX_DUE_DAYS]: 180,
};

async function getNumber(key: string): Promise<number> {
  const row = await prisma.systemSetting.findUnique({ where: { key } });
  const parsed = row ? Number(row.value) : NaN;
  return Number.isFinite(parsed) ? parsed : SETTING_DEFAULTS[key];
}

export async function getDueSettings(): Promise<{
  defaultDueDays: number;
  maxDueDays: number;
}> {
  const [defaultDueDays, maxDueDays] = await Promise.all([
    getNumber(SETTING_KEYS.DEFAULT_DUE_DAYS),
    getNumber(SETTING_KEYS.MAX_DUE_DAYS),
  ]);
  return { defaultDueDays, maxDueDays };
}

export async function setSetting(
  key: string,
  value: string,
  updatedBy: string
): Promise<void> {
  await prisma.systemSetting.upsert({
    where: { key },
    create: { key, value, updatedBy },
    update: { value, updatedBy },
  });
}

/** Gün ekleyerek vade tarihi üretir (saat bileşenini korur). */
export function addDays(from: Date, days: number): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
}
