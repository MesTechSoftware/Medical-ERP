// Entegrasyon testleri ÜÇÜNCÜ veritabanına karşı koşar: medikal_itest.
//
// Neden ayrı: dev veritabanı (medikal_dev) geliştiricinin verisini taşır,
// e2e veritabanı (medikal_test) ise her Playwright koşusunda `migrate reset`
// ile sıfırlanır (playwright.config.ts) — ikisi de paylaşılamaz.
//
// Yerel kurulum: `npm run db:up`. Container İLK kez oluşuyorsa veritabanı
// docker/init-test-db.sql ile otomatik açılır; var olan bir kurulumda elle:
//   docker exec medikal_postgres psql -U medikal -d medikal_dev \
//     -c 'CREATE DATABASE medikal_itest OWNER medikal;'
export const ITEST_DATABASE_URL =
  process.env.ITEST_DATABASE_URL ??
  "postgresql://medikal:medikal_dev@localhost:5432/medikal_itest?schema=public";
