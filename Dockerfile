# Demo imajı — uygulama, migration ve demo seed'i aynı imajdan çalışır
# (docker-compose.demo.yml ve Coolify "Dockerfile" build pack'i).
# Geliştirme bağımlılıkları bilinçli olarak imajdadır: seed betikleri `tsx` ister. Canlı imajı değildir.
FROM node:24.17.0-bookworm-slim

ENV TZ=UTC \
    NEXT_TELEMETRY_DISABLED=1

# Prisma'nın migration motoru OpenSSL ister; slim imajda yok.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir /app && chown node:node /app
WORKDIR /app
USER node

COPY --chown=node:node package.json package-lock.json ./
# --include=dev: platform build ortamına NODE_ENV=production geçirirse bile tsx/prisma CLI kurulsun.
RUN npm ci --include=dev

COPY --chown=node:node . .
# Windows'ta CRLF'li çıkmış olabilir; sh betiği CRLF ile çalışmaz.
RUN sed -i 's/\r$//' docker/entrypoint.sh && chmod +x docker/entrypoint.sh
# Derleme sayfa modüllerini yükler; db.ts adres yoksa fırlatır (fail-fast). Bağlanılmaz —
# adres yalnız bu adımda geçerlidir, çalışma anındaki adres platformdan gelir.
RUN npx prisma generate \
    && DATABASE_URL="postgresql://derleme:derleme@localhost:5432/derleme" npm run build

EXPOSE 3000

# /login herkese açık ve yalnız marka okur (veritabanına dokunmaz): 200 dönerse Next ayaktadır.
# Slim imajda curl yok; Node'un fetch'i yeter. Migration süresi için start-period geniş.
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD ["node", "-e", "fetch('http://127.0.0.1:3000/login').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

# CMD (ENTRYPOINT değil): docker-compose.demo.yml'deki `migrate` servisi komutu ezip yalnız
# `prisma migrate deploy` çalıştırabilsin. Betik migration'dan sonra Next'i PID 1 olarak başlatır.
CMD ["docker/entrypoint.sh"]
