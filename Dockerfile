# Demo imajı — uygulama, migration ve demo seed'i aynı imajdan çalışır (docker-compose.demo.yml).
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
RUN npm ci

COPY --chown=node:node . .
# Derleme sayfa modüllerini yükler; db.ts adres yoksa fırlatır (fail-fast). Bağlanılmaz —
# adres yalnız bu adımda geçerlidir, çalışma anındaki adres compose'tan gelir.
RUN npx prisma generate \
    && DATABASE_URL="postgresql://derleme:derleme@localhost:5432/derleme" npm run build

EXPOSE 3000
# npm PID 1 olursa SIGTERM'i iletmez; Next doğrudan çalışır.
CMD ["node_modules/.bin/next", "start"]
