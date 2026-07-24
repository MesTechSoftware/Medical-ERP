/**
 * FR-52: Süresi dolan kongre kazanımları için `EXPIRE` hareketi yazar.
 *
 * Çalıştır: `npm run job:expire`
 * Üretimde gecelik cron ile çağrılmalıdır (örn. 03:00).
 *
 * Neden ayrı bir job: bakiye okuma anında zaten tembel (lazy) doğrulanıyor —
 * süresi dolmuş lot hiçbir hesaba katılmıyor. Ama defterde `EXPIRE` satırı
 * olmadan doktorun hareket geçmişi "bakiye nereye gitti?" sorusunu
 * cevaplayamaz. §11 uyumluluk gereği bu denetim izi zorunludur.
 */
import "dotenv/config";
import { expireLots } from "../src/lib/congress-service";
import { prisma } from "../src/lib/db";

async function main() {
  const count = await expireLots();
  console.log(
    count === 0
      ? "Süresi dolan kazanım yok."
      : `${count} kazanım için EXPIRE hareketi yazıldı.`
  );
}

main()
  .catch((err) => {
    console.error("✗ Expiry job başarısız:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
