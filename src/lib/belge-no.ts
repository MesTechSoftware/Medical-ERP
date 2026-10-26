import type { Prisma } from "@/generated/prisma/client";
import { policy } from "@/lib/policy";
import { simdi, takvimYili } from "@/lib/zaman";

export type BelgeOneki = (typeof policy.belge.onekleri)[number];

/**
 * `uretBelgeNo()` — belge numarasının TEK kaynağı (A-14). Tek çağrı noktası listesinin
 * 9. maddesi. Şema `documentNo`'yu NOT NULL istediği için `CM`'de yazılır.
 *
 * - Biçim `{ÖNEK}-{YIL}-{SIRA}`, sıra 6 hane sıfır dolgulu (A-14 §(1)).
 * - Sayaç `DocumentCounter` satırıdır; satır kilidi altında ve belgeyi yazan
 *   transaction'ın İÇİNDE artırılır (A-14 §(3)). `MAX(belge_no)+1` yasaktır.
 *   `INSERT … ON CONFLICT DO UPDATE` satırı kilitleyerek artırır; eşzamanlı ikinci
 *   transaction ilki bitene kadar bekler.
 * - Yıl, kayıt anının İstanbul takvim yılıdır (A-14 §(5), E-1 §(3)). Kayıt anı varsayılan olarak
 *   şimdidir; demo geçmiş seed'i geçmişe kaydırdığı belgenin anını verir (tasarım 2-7b).
 * - Numara oluşumda doğar; iptalde kalır, yeniden kullanılmaz (A-14 §(6)).
 */
export async function uretBelgeNo(onek: BelgeOneki, tx: Prisma.TransactionClient, an: Date = simdi()): Promise<string> {
  const yil = takvimYili(an);
  const [satir] = await tx.$queryRaw<{ lastValue: number }[]>`
    INSERT INTO "DocumentCounter" ("prefix", "year", "lastValue")
    VALUES (${onek}, ${yil}, 1)
    ON CONFLICT ("prefix", "year")
    DO UPDATE SET "lastValue" = "DocumentCounter"."lastValue" + 1
    RETURNING "lastValue"`;
  return `${onek}-${yil}-${String(satir.lastValue).padStart(6, "0")}`;
}
