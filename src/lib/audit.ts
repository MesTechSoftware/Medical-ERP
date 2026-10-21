import Decimal from "decimal.js";
import type { Prisma } from "@/generated/prisma/client";
import { formatla } from "@/lib/money";

/**
 * Denetim kaydı (audit log) yardımcıları.
 *
 * Tasarım kararları:
 * - **İşle aynı transaction'da (X-3 §(4)):** kayıt, kaydettiği işin transaction'ında yazılır;
 *   yazılamazsa iş de geri alınır ve hata yutulmaz. Kullanıcıya "tamamlandı" denen her iş
 *   denetim kaydıyla birlikte vardır; "tamamlanamadı" denen işin kalıntısı yoktur.
 * - **Merkezî sanitize:** hassas alanlar (şifre/token) action bazında değil,
 *   burada tek noktada temizlenir. Yeni action eklendiğinde sızma riski sıfır.
 */

export const AUDIT_ACTIONS = {
  PRODUCT_CREATE: "PRODUCT_CREATE",
  PRODUCT_UPDATE: "PRODUCT_UPDATE",
  PRICE_LIST_CREATE: "PRICE_LIST_CREATE",
  PRICE_LIST_ITEM_SET: "PRICE_LIST_ITEM_SET",
  PRICE_LIST_ITEM_DELETE: "PRICE_LIST_ITEM_DELETE",
  STOCK_ENTRY: "STOCK_ENTRY",
  IMPORT_CREATE: "IMPORT_CREATE",
  IMPORT_REVERT: "IMPORT_REVERT",
  STOCK_ADJUSTMENT: "STOCK_ADJUSTMENT",
  ORDER_CREATE: "ORDER_CREATE",
  ORDER_CANCEL: "ORDER_CANCEL",
  ORDER_STATUS_CHANGE: "ORDER_STATUS_CHANGE",
  RETURN_CREATE: "RETURN_CREATE",
  DOCTOR_CREATE: "DOCTOR_CREATE",
  DOCTOR_UPDATE: "DOCTOR_UPDATE",
  DOCTOR_TRANSFER: "DOCTOR_TRANSFER",
  COLLECTION_CREATE: "COLLECTION_CREATE",
  COLLECTION_CANCEL: "COLLECTION_CANCEL",
  DUE_DATE_CHANGE: "DUE_DATE_CHANGE",
  LATE_FEE_CREATE: "LATE_FEE_CREATE",
  LEDGER_REVERSAL: "LEDGER_REVERSAL",
  AUTH_LOGIN_SUCCESS: "AUTH_LOGIN_SUCCESS",
  AUTH_LOGIN_FAILURE: "AUTH_LOGIN_FAILURE",
  AUTH_LOGOUT: "AUTH_LOGOUT",
  USER_CREATE: "USER_CREATE",
  USER_UPDATE: "USER_UPDATE",
  USER_PASSWORD_RESET: "USER_PASSWORD_RESET",
  PASSWORD_CHANGE: "PASSWORD_CHANGE",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

/** Audit ekranında gösterilecek okunur etiketler. */
export const AUDIT_ACTION_LABELS: Record<string, string> = {
  PRODUCT_CREATE: "Ürün oluşturma",
  PRODUCT_UPDATE: "Ürün güncelleme",
  PRICE_LIST_CREATE: "Fiyat listesi oluşturma",
  PRICE_LIST_ITEM_SET: "Fiyat listesi satırı",
  PRICE_LIST_ITEM_DELETE: "Fiyat listesi satırı silme",
  STOCK_ENTRY: "Stok girişi",
  IMPORT_CREATE: "İçe aktarım",
  IMPORT_REVERT: "İçe aktarım geri alma",
  STOCK_ADJUSTMENT: "Stok düzeltme",
  ORDER_CREATE: "Sipariş oluşturma",
  ORDER_CANCEL: "Sipariş iptali",
  ORDER_STATUS_CHANGE: "Sipariş durum değişikliği",
  RETURN_CREATE: "İade kaydı",
  DOCTOR_CREATE: "Doktor oluşturma",
  DOCTOR_UPDATE: "Doktor güncelleme",
  DOCTOR_TRANSFER: "Doktor devri",
  COLLECTION_CREATE: "Tahsilat kaydı",
  COLLECTION_CANCEL: "Tahsilat iptali",
  DUE_DATE_CHANGE: "Vade değişikliği",
  LATE_FEE_CREATE: "Vade farkı kaydı",
  LEDGER_REVERSAL: "Cari hareket ters kaydı",
  AUTH_LOGIN_SUCCESS: "Giriş başarılı",
  AUTH_LOGIN_FAILURE: "Giriş başarısız",
  AUTH_LOGOUT: "Çıkış",
  USER_CREATE: "Kullanıcı açma",
  USER_UPDATE: "Kullanıcı güncelleme",
  USER_PASSWORD_RESET: "Parola sıfırlama",
  PASSWORD_CHANGE: "Parola değişikliği",
};

// Log'a asla yazılmayacak alanlar (iç içe nesnelerde de temizlenir).
// §C-j: vergi kimliği ve fatura seti (A-13) CM ile birlikte eklendi — değişiklik
// loglanır (A-13 §(7)) ama değerin kendisi log'a yazılmaz.
const SENSITIVE_KEYS = new Set([
  "passwordHash",
  "password",
  "token",
  "tokenHash",
  "accessToken",
  "refreshToken",
  "secret",
  "taxId",
  "invoiceTitle",
  "taxOffice",
  "invoiceAddress",
  "invoiceDistrict",
  "invoiceCity",
]);

/** Nesneden hassas alanları özyinelemeli olarak çıkarır. */
export function sanitizeAuditData(data: unknown): unknown {
  if (data instanceof Date) return data.toISOString();
  // Parasal alanlar Decimal (X-5); log'a ham metin olarak tek çıkıştan yazılır.
  if (Decimal.isDecimal(data)) return formatla(data, "ham");
  if (typeof data === "bigint") return data.toString();
  if (Array.isArray(data)) return data.map(sanitizeAuditData);
  if (data && typeof data === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (SENSITIVE_KEYS.has(key)) continue;
      out[key] = sanitizeAuditData(value);
    }
    return out;
  }
  return data;
}

function serialize(data: unknown): string | null {
  if (data === undefined || data === null) return null;
  return JSON.stringify(sanitizeAuditData(data));
}

type AuditInput = {
  actorId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
};

/**
 * Denetim kaydı oluşturur. `db` iş transaction'ıdır; tek yazımlık olaylar (giriş denemesi)
 * için `prisma` verilir. Hata yutulmaz (X-3 §(4)).
 */
export async function createAuditLog(input: AuditInput, db: Prisma.TransactionClient): Promise<void> {
  const data = {
    actorId: input.actorId ?? null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    beforeData: serialize(input.before),
    afterData: serialize(input.after),
  };
  await db.auditLog.create({ data });
}
