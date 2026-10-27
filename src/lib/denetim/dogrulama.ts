import { prisma } from "@/lib/db";
import { zinciriDenetle, type KanonikKayit, type MuhurSatiri, type ZincirDurumu, type ZincirSorunu } from "@/lib/denetim/zincir";

/**
 * Bütün zincirin doğrulaması (KARARLAR X-18 §(2), ADR-011 §5): mühürler `chainIndex` sırasıyla
 * partiler hâlinde okunur ve uygulamada yeniden hesaplanır. `npm run denetim:dogrula` bunu çağırır.
 */

export type ZincirRaporu = {
  kayitSayisi: number;
  sonIndeks: number;
  /** Zincirin son özeti — dışarıda saklanırsa sonradan yeniden hesaplanan zinciri yakalar (çapa). */
  sonHash: string | null;
  sorunlar: ZincirSorunu[];
  /** Mührü olmayan kayıtlar: tetikleyiciler kapalıyken (bakım yolu) eklenmiş satır. */
  muhursuz: string[];
};

export async function zinciriDogrula(partiBoyu = 1000): Promise<ZincirRaporu> {
  const sorunlar: ZincirSorunu[] = [];
  let durum: ZincirDurumu = { sonIndeks: 0, sonHash: null };
  for (;;) {
    const muhurler = await prisma.auditLogSeal.findMany({
      where: { chainIndex: { gt: durum.sonIndeks } },
      orderBy: { chainIndex: "asc" },
      take: partiBoyu,
    });
    if (muhurler.length === 0) break;
    // Kayıt ayrı okunur: bakım yolunda silinmiş kaydın mührü kalabilir (ilişki zorunlu olsa da).
    const kayitlar = new Map<string, KanonikKayit>(
      (await prisma.auditLog.findMany({ where: { id: { in: muhurler.map((m) => m.logId) } } })).map((k) => [k.id, k])
    );
    const satirlar: MuhurSatiri[] = muhurler.map((m) => ({ ...m, kayit: kayitlar.get(m.logId) ?? null }));
    const parti = zinciriDenetle(satirlar, durum);
    sorunlar.push(...parti.sorunlar);
    durum = parti.durum;
  }
  const muhursuz = await prisma.auditLog.findMany({ where: { seal: null }, select: { id: true }, orderBy: { seq: "asc" } });
  return {
    kayitSayisi: await prisma.auditLog.count(),
    sonIndeks: durum.sonIndeks,
    sonHash: durum.sonHash,
    sorunlar,
    muhursuz: muhursuz.map((k) => k.id),
  };
}
