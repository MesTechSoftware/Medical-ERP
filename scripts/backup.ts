/**
 * PostgreSQL veritabanı yedekleme + gömülü bütünlük doğrulaması.
 *
 * Çalıştır: `npm run backup`
 *
 * Neden `pg_dump -Fc`: custom-format arşiv sıkıştırılmıştır, seçmeli geri
 * yükleme yapılabilir ve PostgreSQL'in MVCC'si sayesinde uygulama çalışırken
 * bile TUTARLI bir snapshot alınır (kilit gerekmez).
 *
 * "Test edilmemiş yedek, yedek değildir": yedek alındıktan hemen sonra aynı
 * çalıştırma içinde `pg_restore --list` ile arşiv okunur; TOC bozuksa veya
 * beklenen tablolar yoksa non-zero exit.
 *
 * `pg_dump`/`pg_restore` PostgreSQL İSTEMCİ araçlarıdır ve betiği çalıştıran
 * makinede bulunmalıdır. Yerel geliştirmede Postgres container içinde koştuğu
 * için host'ta kurulu olmayabilir; bu durumda araçlar container üzerinden
 * çalıştırılır. Üretimde (managed Postgres) host'taki araçlar kullanılır.
 */
import "dotenv/config";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const CONTAINER = process.env.PG_CONTAINER ?? "medikal_postgres";

/** Host'ta verilen komut var mı? */
function hasOnHost(cmd: string): boolean {
  try {
    execFileSync("which", [cmd], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/** Container ayakta ve içinde pg araçları var mı? */
function hasInContainer(cmd: string): boolean {
  try {
    execFileSync("docker", ["exec", CONTAINER, "which", cmd], {
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

/** Dosya adı için "YYYY-MM-DD-HH-mm" damgası (yerel saat). */
function timestamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(
    d.getHours()
  )}-${p(d.getMinutes())}`;
}

function main() {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) throw new Error("DATABASE_URL tanımlı değil.");
  if (!rawUrl.startsWith("postgres")) {
    throw new Error(`Yalnızca PostgreSQL destekleniyor, gelen: ${rawUrl}`);
  }

  // Prisma'ya özel `schema` sorgu parametresini ayıkla: libpq (pg_dump) onu
  // tanımıyor ve "invalid URI query parameter" hatası veriyor.
  const parsed = new URL(rawUrl);
  parsed.searchParams.delete("schema");
  const url = parsed.toString();

  const backupsDir = resolve(process.cwd(), "backups");
  mkdirSync(backupsDir, { recursive: true });
  const destPath = resolve(backupsDir, `backup-${timestamp()}.dump`);

  // Araçlar host'ta yoksa container üzerinden çalıştır (yerel geliştirme).
  const useContainer = !hasOnHost("pg_dump");
  if (useContainer && !hasInContainer("pg_dump")) {
    throw new Error(
      `pg_dump ne host'ta ne de "${CONTAINER}" container'ında bulundu. ` +
        "PostgreSQL client araçlarını kurun veya PG_CONTAINER ayarlayın."
    );
  }
  console.log(
    useContainer
      ? `pg_dump host'ta yok → "${CONTAINER}" container'ı kullanılıyor.`
      : "pg_dump host'ta bulundu."
  );

  // 1) Tutarlı online yedek (MVCC snapshot). Container modunda arşiv stdout'a
  //    yazılır (container dosya sistemine değil) ve host'ta dosyaya kaydedilir.
  const dumpArgs = ["--format=custom", url];
  if (useContainer) {
    const archive = execFileSync(
      "docker",
      ["exec", CONTAINER, "pg_dump", ...dumpArgs],
      { maxBuffer: 512 * 1024 * 1024 }
    );
    writeFileSync(destPath, archive);
  } else {
    execFileSync("pg_dump", ["--file", destPath, ...dumpArgs], {
      stdio: ["ignore", "ignore", "inherit"],
    });
  }

  // 2) Gömülü doğrulama: arşivin içindekiler listesi okunabiliyor mu ve
  //    beklediğimiz tablo arşivde var mı? (yedeği geri OKUYARAK doğrula)
  const toc = useContainer
    ? execFileSync(
        "sh",
        ["-c", `docker exec -i ${CONTAINER} pg_restore --list < "${destPath}"`],
        { encoding: "utf8" }
      )
    : execFileSync("pg_restore", ["--list", destPath], { encoding: "utf8" });
  if (!/\bTABLE DATA\b.*\bUser\b/.test(toc)) {
    throw new Error(
      'Doğrulama başarısız: arşivde "User" tablo verisi bulunamadı.'
    );
  }

  const tableCount = (toc.match(/\bTABLE DATA\b/g) ?? []).length;
  console.log(`✓ Yedek alındı ve doğrulandı: ${destPath}`);
  console.log(`  pg_restore --list: ok · tablo sayısı: ${tableCount}`);
}

try {
  main();
} catch (err) {
  console.error(
    "✗ Yedekleme başarısız:",
    err instanceof Error ? err.message : err
  );
  process.exit(1);
}
