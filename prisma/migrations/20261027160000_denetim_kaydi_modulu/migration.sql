-- Tasarım 3 D1 — KARARLAR X-18 (denetim kaydı modülü) · ADR-011 (zincir) · ADR-012 (kilit sırası).
-- Sıra: (1) kolonlar boş açılır → (2) eski satırlar doldurulur (yazım sırası, sınıf) → (3) kısıtlar
-- ve indeksler → (4) mühür tablosu, kanonik biçim ve zincir → (5) eski satırların zinciri kurulur →
-- (6) değişmezlik tetikleyicileri en son açılır (önceki adımlar eski satırları günceller).

-- CreateEnum
CREATE TYPE "AuditActionType" AS ENUM ('EKLEME', 'GUNCELLEME', 'SILME', 'OTURUM');

-- CreateEnum
CREATE TYPE "AuditModule" AS ENUM ('SATIS', 'STOK', 'FINANS', 'CARI', 'URUN_FIYAT', 'ICE_AKTARIM', 'KULLANICI');

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_actorId_fkey";

-- DropIndex
DROP INDEX "AuditLog_actorId_idx";

-- AlterTable — (1) yeni kolonlar boş açılır; zorunlu olanlar (2)'den sonra NOT NULL olur.
ALTER TABLE "AuditLog" ADD COLUMN     "actionType" "AuditActionType",
ADD COLUMN     "actorRole" "Role",
ADD COLUMN     "changes" TEXT,
ADD COLUMN     "endpoint" TEXT,
ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "module" "AuditModule",
ADD COLUMN     "reason" TEXT,
ADD COLUMN     "requestMethod" TEXT,
ADD COLUMN     "seq" INTEGER,
ADD COLUMN     "sessionId" TEXT,
ALTER COLUMN "createdAt" SET DEFAULT clock_timestamp();

-- (2a) Yazım sırası (ADR-011 §6): eski satırlar (createdAt, id) sırasıyla numaralanır.
CREATE SEQUENCE "AuditLog_seq_seq" AS INTEGER OWNED BY "AuditLog"."seq";
UPDATE "AuditLog" AS a
SET "seq" = s.sira
FROM (SELECT "id", row_number() OVER (ORDER BY "createdAt", "id") AS sira FROM "AuditLog") AS s
WHERE a."id" = s."id";
SELECT setval('"AuditLog_seq_seq"', COALESCE((SELECT max("seq") FROM "AuditLog"), 0) + 1, false);
ALTER TABLE "AuditLog" ALTER COLUMN "seq" SET DEFAULT nextval('"AuditLog_seq_seq"'),
ALTER COLUMN "seq" SET NOT NULL;

-- (2b) İşlem türü ve modül (X-18 §(3)/(4)). Tablo `src/lib/denetim/olaylar.ts` ISLEM_SINIFI ile
-- aynıdır; eşitliği `degismezlik.test.ts` tarar. Tanınmayan olay boş kalır ve NOT NULL'da durur.
UPDATE "AuditLog" SET
"actionType" = (CASE "action"
  -- tür:başla
  WHEN 'ORDER_CREATE' THEN 'EKLEME'
  WHEN 'ORDER_CANCEL' THEN 'GUNCELLEME'
  WHEN 'ORDER_STATUS_CHANGE' THEN 'GUNCELLEME'
  WHEN 'RETURN_CREATE' THEN 'EKLEME'
  WHEN 'STOCK_ENTRY' THEN 'EKLEME'
  WHEN 'STOCK_ADJUSTMENT' THEN 'EKLEME'
  WHEN 'COLLECTION_CREATE' THEN 'EKLEME'
  WHEN 'COLLECTION_CANCEL' THEN 'GUNCELLEME'
  WHEN 'DUE_DATE_CHANGE' THEN 'GUNCELLEME'
  WHEN 'LATE_FEE_CREATE' THEN 'EKLEME'
  WHEN 'LEDGER_REVERSAL' THEN 'EKLEME'
  WHEN 'DOCTOR_CREATE' THEN 'EKLEME'
  WHEN 'DOCTOR_UPDATE' THEN 'GUNCELLEME'
  WHEN 'DOCTOR_TRANSFER' THEN 'GUNCELLEME'
  WHEN 'PRODUCT_CREATE' THEN 'EKLEME'
  WHEN 'PRODUCT_UPDATE' THEN 'GUNCELLEME'
  WHEN 'PRICE_LIST_CREATE' THEN 'EKLEME'
  WHEN 'PRICE_LIST_ITEM_SET' THEN (CASE WHEN "beforeData" IS NULL THEN 'EKLEME' ELSE 'GUNCELLEME' END)
  WHEN 'PRICE_LIST_ITEM_DELETE' THEN 'SILME'
  WHEN 'IMPORT_CREATE' THEN 'EKLEME'
  WHEN 'IMPORT_REVERT' THEN 'SILME'
  WHEN 'USER_CREATE' THEN 'EKLEME'
  WHEN 'USER_UPDATE' THEN 'GUNCELLEME'
  WHEN 'USER_PASSWORD_RESET' THEN 'GUNCELLEME'
  WHEN 'PASSWORD_CHANGE' THEN 'GUNCELLEME'
  WHEN 'AUTH_LOGIN_SUCCESS' THEN 'OTURUM'
  WHEN 'AUTH_LOGIN_FAILURE' THEN 'OTURUM'
  WHEN 'AUTH_LOGOUT' THEN 'OTURUM'
  -- tür:bitir
END)::"AuditActionType",
"module" = (CASE "action"
  -- modül:başla
  WHEN 'ORDER_CREATE' THEN 'SATIS'
  WHEN 'ORDER_CANCEL' THEN 'SATIS'
  WHEN 'ORDER_STATUS_CHANGE' THEN 'SATIS'
  WHEN 'RETURN_CREATE' THEN 'SATIS'
  WHEN 'STOCK_ENTRY' THEN 'STOK'
  WHEN 'STOCK_ADJUSTMENT' THEN 'STOK'
  WHEN 'COLLECTION_CREATE' THEN 'FINANS'
  WHEN 'COLLECTION_CANCEL' THEN 'FINANS'
  WHEN 'DUE_DATE_CHANGE' THEN 'FINANS'
  WHEN 'LATE_FEE_CREATE' THEN 'FINANS'
  WHEN 'LEDGER_REVERSAL' THEN 'FINANS'
  WHEN 'DOCTOR_CREATE' THEN 'CARI'
  WHEN 'DOCTOR_UPDATE' THEN 'CARI'
  WHEN 'DOCTOR_TRANSFER' THEN 'CARI'
  WHEN 'PRODUCT_CREATE' THEN 'URUN_FIYAT'
  WHEN 'PRODUCT_UPDATE' THEN 'URUN_FIYAT'
  WHEN 'PRICE_LIST_CREATE' THEN 'URUN_FIYAT'
  WHEN 'PRICE_LIST_ITEM_SET' THEN 'URUN_FIYAT'
  WHEN 'PRICE_LIST_ITEM_DELETE' THEN 'URUN_FIYAT'
  WHEN 'IMPORT_CREATE' THEN 'ICE_AKTARIM'
  WHEN 'IMPORT_REVERT' THEN 'ICE_AKTARIM'
  WHEN 'USER_CREATE' THEN 'KULLANICI'
  WHEN 'USER_UPDATE' THEN 'KULLANICI'
  WHEN 'USER_PASSWORD_RESET' THEN 'KULLANICI'
  WHEN 'PASSWORD_CHANGE' THEN 'KULLANICI'
  WHEN 'AUTH_LOGIN_SUCCESS' THEN 'KULLANICI'
  WHEN 'AUTH_LOGIN_FAILURE' THEN 'KULLANICI'
  WHEN 'AUTH_LOGOUT' THEN 'KULLANICI'
  -- modül:bitir
END)::"AuditModule";
ALTER TABLE "AuditLog" ALTER COLUMN "actionType" SET NOT NULL,
ALTER COLUMN "module" SET NOT NULL;

-- (3) CreateIndex
CREATE UNIQUE INDEX "AuditLog_seq_key" ON "AuditLog"("seq");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_seq_idx" ON "AuditLog"("actorId", "seq");

-- CreateIndex
CREATE INDEX "AuditLog_module_seq_idx" ON "AuditLog"("module", "seq");

-- CreateIndex
CREATE INDEX "AuditLog_actionType_seq_idx" ON "AuditLog"("actionType", "seq");

-- CreateIndex
CREATE INDEX "AuditLog_action_seq_idx" ON "AuditLog"("action", "seq");

-- AddForeignKey — kullanıcı silinmez (E-2); silmek kaydı boşa düşürmek, yani bir UPDATE olurdu.
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- (4) CreateTable — mühür ayrı tablodadır: kayıt satırı hiçbir koşulda UPDATE görmez (ADR-011 §1).
CREATE TABLE "AuditLogSeal" (
    "logId" TEXT NOT NULL,
    "chainIndex" INTEGER NOT NULL,
    "prevHash" TEXT,
    "hash" TEXT NOT NULL,

    CONSTRAINT "AuditLogSeal_pkey" PRIMARY KEY ("logId")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuditLogSeal_chainIndex_key" ON "AuditLogSeal"("chainIndex");

-- AddForeignKey
ALTER TABLE "AuditLogSeal" ADD CONSTRAINT "AuditLogSeal_logId_fkey" FOREIGN KEY ("logId") REFERENCES "AuditLog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Kanonik biçim (ADR-011 §4): alanlar sabit sırayla, her biri "<UTF-8 bayt uzunluğu>:<değer>",
-- boş alan "~". TS ikizi `src/lib/denetim/zincir.ts` — eşitlik `zincir.itest.ts`'te.
CREATE FUNCTION denetim_kanonik(r "AuditLog") RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT string_agg(CASE WHEN v IS NULL THEN '~' ELSE octet_length(v)::text || ':' || v END, '' ORDER BY i)
  FROM unnest(ARRAY[
    r."id",
    r."seq"::text,
    to_char(r."createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    r."actorId",
    r."actorRole"::text,
    r."action",
    r."actionType"::text,
    r."module"::text,
    r."entityType",
    r."entityId",
    r."beforeData",
    r."afterData",
    r."changes",
    r."reason",
    r."ipAddress",
    r."sessionId",
    r."requestMethod",
    r."endpoint"
  ]) WITH ORDINALITY AS t(v, i)
$$;

-- Mühür = SHA-256(önceki mühür ‖ kanonik kayıt).
CREATE FUNCTION denetim_muhur_ozeti(onceki text, r "AuditLog") RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT encode(sha256(convert_to(COALESCE(onceki, '') || denetim_kanonik(r), 'UTF8')), 'hex')
$$;

CREATE FUNCTION denetim_muhur_yaz(r "AuditLog", son "AuditLogSeal") RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO "AuditLogSeal" ("logId", "chainIndex", "prevHash", "hash")
  VALUES (r."id", COALESCE(son."chainIndex", 0) + 1, son."hash", denetim_muhur_ozeti(son."hash", r));
END
$$;

-- Zincir commit anında kurulur (ADR-011 §3). Zincir kilidi yalnız burada ve `denetim_zinciri_kur()`'da
-- alınır; commit anında iş kilitlerinin hepsinden sonra geldiği için döngü kuramaz (ADR-012 §3).
CREATE FUNCTION denetim_muhurle() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  son "AuditLogSeal";
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('denetim_zinciri'));
  SELECT * INTO son FROM "AuditLogSeal" ORDER BY "chainIndex" DESC LIMIT 1;
  IF current_setting('transaction_isolation') = 'read committed' THEN
    -- Son mühür kilitten sonra okundu; kesindir, çakışma olamaz.
    PERFORM denetim_muhur_yaz(NEW, son);
  ELSE
    -- SERIALIZABLE (yönetici pasifleştirme): anlık görüntü transaction başındadır, sonradan commit
    -- edilen mührü göremeyebilir; aynı sıra numarası benzersizlikte çakışır. Zincir bozulmaz; işlem
    -- serileştirme hatasıyla geri alınır ve kullanıcıya "tekrar deneyin" denir (`kullanici.ts`).
    BEGIN
      PERFORM denetim_muhur_yaz(NEW, son);
    EXCEPTION WHEN unique_violation THEN
      RAISE EXCEPTION 'Denetim zinciri eşzamanlı bir kayıtla çakıştı' USING ERRCODE = 'serialization_failure';
    END;
  END IF;
  RETURN NULL;
END
$$;

-- Boş mühür tablosunu yazım sırasıyla (seq) kurar. Bu migration eski satırlar için bir kez çağırır;
-- demo geçmiş seed'i geçmişe kaydırmadan sonra bakım yoluyla çağırır (ADR-011 §11). Mühür tablosu
-- doluyken çağrılırsa benzersizlik ihlaliyle düşer.
CREATE FUNCTION denetim_zinciri_kur() RETURNS integer
LANGUAGE plpgsql AS $$
DECLARE
  r "AuditLog";
  onceki text := NULL;
  ozet text;
  sira integer := 0;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('denetim_zinciri'));
  FOR r IN SELECT * FROM "AuditLog" ORDER BY "seq" LOOP
    sira := sira + 1;
    ozet := denetim_muhur_ozeti(onceki, r);
    INSERT INTO "AuditLogSeal" ("logId", "chainIndex", "prevHash", "hash") VALUES (r."id", sira, onceki, ozet);
    onceki := ozet;
  END LOOP;
  RETURN sira;
END
$$;

-- (5) Eski satırların zinciri.
SELECT denetim_zinciri_kur();

CREATE CONSTRAINT TRIGGER "AuditLog_muhurle"
AFTER INSERT ON "AuditLog"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION denetim_muhurle();

-- (6) Değişmezlik (X-18 §(1)): kayıt ve mührü güncellenmez, silinmez, boşaltılmaz. Tek bakım yolu
-- `session_replication_role = replica`'dır (süper kullanıcı; yalnız test kurulumu ve seed'ler).
CREATE FUNCTION denetim_degismez() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Denetim kaydı değiştirilemez ve silinemez (% %)', TG_OP, TG_TABLE_NAME
    USING ERRCODE = 'restrict_violation';
END
$$;

CREATE TRIGGER "AuditLog_degismez" BEFORE UPDATE OR DELETE ON "AuditLog"
FOR EACH ROW EXECUTE FUNCTION denetim_degismez();

CREATE TRIGGER "AuditLog_bosaltilamaz" BEFORE TRUNCATE ON "AuditLog"
FOR EACH STATEMENT EXECUTE FUNCTION denetim_degismez();

CREATE TRIGGER "AuditLogSeal_degismez" BEFORE UPDATE OR DELETE ON "AuditLogSeal"
FOR EACH ROW EXECUTE FUNCTION denetim_degismez();

CREATE TRIGGER "AuditLogSeal_bosaltilamaz" BEFORE TRUNCATE ON "AuditLogSeal"
FOR EACH STATEMENT EXECUTE FUNCTION denetim_degismez();
