#!/bin/sh
# Container başlangıcı (Coolify / docker-compose.demo.yml ortak). Önce bekleyen migration'lar
# uygulanır; başarısız olursa `set -e` container'ı hata koduyla düşürür — uygulama sessizce,
# eksik şemayla ayağa kalkmaz. Başarılıysa Next, `exec` ile PID 1 olur (SIGTERM doğrudan ona gider).
set -e

echo "[entrypoint] prisma migrate deploy"
node_modules/.bin/prisma migrate deploy

echo "[entrypoint] next start 0.0.0.0:3000"
exec node_modules/.bin/next start -H 0.0.0.0 -p 3000
