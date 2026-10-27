import "dotenv/config";

import { prisma } from "../src/lib/db";
import { zinciriDogrula } from "../src/lib/denetim/dogrulama";

/**
 * Denetim zincirinin doğrulaması (KARARLAR X-18 §(2), ADR-011 §5).
 *
 * Kullanım: `npm run denetim:dogrula` — `.env` varsa okunur, ortamdaki `DATABASE_URL` önceliklidir.
 * Çıkış kodu 0 = zincir sağlam, 1 = sorun var. Son özet dışarıda saklanırsa (çapa) zincirin sonradan
 * baştan hesaplandığını da yakalar.
 */
async function main(): Promise<boolean> {
  const r = await zinciriDogrula();
  console.log(`Kayıt: ${r.kayitSayisi} · mühür: ${r.sonIndeks}`);
  console.log(`Son özet: ${r.sonHash ?? "(zincir boş)"}`);
  for (const s of r.sorunlar) console.log(`SORUN ${s.tur} · zincir #${s.chainIndex} · kayıt ${s.logId}`);
  for (const id of r.muhursuz) console.log(`SORUN MUHURSUZ · kayıt ${id}`);
  const sorun = r.sorunlar.length + r.muhursuz.length;
  console.log(sorun === 0 ? "Zincir sağlam." : `Zincir BOZUK: ${sorun} sorun.`);
  return sorun === 0;
}

main()
  .then((saglam) => {
    process.exitCode = saglam ? 0 : 1;
  })
  .catch((e: unknown) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
