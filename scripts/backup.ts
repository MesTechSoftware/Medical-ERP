/**
 * SQLite veritabanı yedekleme + gömülü bütünlük doğrulaması.
 *
 * Çalıştır: `npm run backup`
 *
 * Neden düz dosya kopyası değil: veritabanı WAL modundayken `fs.copyFile` bozuk
 * (yarım yazılmış) bir yedek üretebilir. better-sqlite3'ün `db.backup()` API'si
 * tutarlı bir online snapshot alır (uygulama çalışırken bile güvenli).
 *
 * "Test edilmemiş yedek, yedek değildir": yedek alındıktan hemen sonra aynı
 * çalıştırma içinde geri okunup bütünlüğü doğrulanır. Sorun varsa non-zero exit.
 */
import "dotenv/config";
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

/** "file:./dev.db" biçimindeki DATABASE_URL'i mutlak dosya yoluna çevirir. */
function resolveDbPath(url: string | undefined): string {
  if (!url) throw new Error("DATABASE_URL tanımlı değil.");
  if (!url.startsWith("file:")) {
    throw new Error(`Yalnızca SQLite (file:) destekleniyor, gelen: ${url}`);
  }
  const relative = url.slice("file:".length);
  return resolve(process.cwd(), relative);
}

/** Dosya adı için "YYYY-MM-DD-HH-mm" damgası (yerel saat). */
function timestamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(
    d.getHours()
  )}-${p(d.getMinutes())}`;
}

async function main() {
  const sourcePath = resolveDbPath(process.env.DATABASE_URL);
  const backupsDir = resolve(process.cwd(), "backups");
  mkdirSync(backupsDir, { recursive: true });
  const destPath = resolve(backupsDir, `backup-${timestamp()}.db`);

  // 1) Tutarlı online yedek (WAL-safe).
  const source = new Database(sourcePath);
  try {
    await source.backup(destPath);
  } finally {
    source.close();
  }

  // 2) Gömülü doğrulama: yedeği salt-okunur aç, bütünlük + ucuz sayım sorgusu.
  const backup = new Database(destPath, { readonly: true });
  try {
    const integrity = backup.pragma("integrity_check", { simple: true });
    if (integrity !== "ok") {
      throw new Error(`Bütünlük kontrolü başarısız: ${String(integrity)}`);
    }
    const { n } = backup.prepare('SELECT count(*) AS n FROM "User"').get() as {
      n: number;
    };
    console.log(`✓ Yedek alındı ve doğrulandı: ${destPath}`);
    console.log(`  integrity_check: ok · kullanıcı sayısı: ${n}`);
  } finally {
    backup.close();
  }
}

main().catch((err) => {
  console.error(
    "✗ Yedekleme başarısız:",
    err instanceof Error ? err.message : err
  );
  process.exit(1);
});
