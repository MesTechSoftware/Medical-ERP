import type { Prisma } from "@/generated/prisma/client";
import { istekBaglami } from "@/lib/denetim/baglam";
import { alanFarklari } from "@/lib/denetim/fark";
import { maskele } from "@/lib/denetim/maske";
import { islemSinifi, type AuditAction } from "@/lib/denetim/olaylar";

/**
 * Denetim kaydı (audit log) yazıcısı.
 *
 * Tasarım kararları:
 * - **İşle aynı transaction'da (X-3 §(4)):** kayıt, kaydettiği işin transaction'ında yazılır;
 *   yazılamazsa iş de geri alınır ve hata yutulmaz. Kullanıcıya "tamamlandı" denen her iş
 *   denetim kaydıyla birlikte vardır; "tamamlanamadı" denen işin kalıntısı yoktur.
 * - **Değişmez ve mühürlü (X-18 §(1)/(2)):** kayıt bir kez yazılır; mührü commit anında veritabanı
 *   kurar (ADR-011). Bu dosya kaydı güncellemez, silmez.
 * - **Merkezî maskeleme (X-18 §(6)):** hassas alanların değeri action bazında değil, burada tek
 *   noktada `***` olur; alan bazlı değişiklik listesi maskelemeden önce kurulur.
 */

// Saf olay tablosu `denetim/olaylar.ts`'tedir; yazarlar onu buradan alır.
export { AUDIT_ACTIONS, AUDIT_ACTION_LABELS, type AuditAction } from "@/lib/denetim/olaylar";

function yaz(data: unknown): string | null {
  if (data === undefined || data === null) return null;
  return JSON.stringify(maskele(data));
}

type AuditInput = {
  actorId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  /** Yalnız gerekçe soran akışlar verir (X-18 §(5)); önceki/sonraki hâlde tekrarlanmaz. */
  gerekce?: string | null;
  /** Girişte oturum kayıtla aynı transaction'da açılır; numarası bağlamdan değil buradan gelir. */
  oturumId?: string;
};

/**
 * Denetim kaydı oluşturur. `db` iş transaction'ıdır; tek yazımlık olaylar (giriş denemesi)
 * için `prisma` verilir. Hata yutulmaz (X-3 §(4)).
 */
export async function createAuditLog(input: AuditInput, db: Prisma.TransactionClient): Promise<void> {
  const baglam = await istekBaglami();
  const sinif = islemSinifi(input.action, input.before);
  const aktor = input.actorId
    ? await db.user.findUnique({ where: { id: input.actorId }, select: { role: true } })
    : null;
  await db.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      actorRole: aktor?.role ?? null,
      action: input.action,
      actionType: sinif.tur,
      module: sinif.modul,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      beforeData: yaz(input.before),
      afterData: yaz(input.after),
      changes: JSON.stringify(alanFarklari(input.before, input.after)),
      reason: input.gerekce?.trim() || null,
      ipAddress: baglam.ipAddress,
      sessionId: input.oturumId ?? baglam.sessionId,
      requestMethod: baglam.requestMethod,
      endpoint: baglam.endpoint,
    },
  });
}
