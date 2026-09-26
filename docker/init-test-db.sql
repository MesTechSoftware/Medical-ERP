-- Test veritabanları: uygulama verisine (medikal_dev) dokunmasınlar.
-- Sadece ilk container oluşturulurken (boş volume) çalışır; var olan bir
-- kurulumda eksik veritabanı elle açılır (bkz. test/integration/database-url.ts).

-- Playwright e2e suite'i — her koşuda `migrate reset` ile sıfırlanır.
CREATE DATABASE medikal_test OWNER medikal;

-- vitest entegrasyon şeridi (F-00) — şema bir kez uygulanır, izolasyon
-- test başına TRUNCATE ile sağlanır.
CREATE DATABASE medikal_itest OWNER medikal;
