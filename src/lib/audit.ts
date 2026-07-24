import { prisma } from "@/lib/db";

/**
 * Denetim kaydı (audit log) yardımcıları.
 *
 * Tasarım kararları:
 * - **Best-effort:** audit yazımı başarısız olsa bile ana iş bozulmaz (try/catch).
 *   Çağıran taraf `await` eder ama redirect'ten ÖNCE ve iş transaction'ı
 *   COMMIT olduktan SONRA çağırır (audit hatası işi geri almaz).
 * - **Merkezî sanitize:** hassas alanlar (şifre/token) action bazında değil,
 *   burada tek noktada temizlenir. Yeni action eklendiğinde sızma riski sıfır.
 */

export const AUDIT_ACTIONS = {
  PRODUCT_CREATE: "PRODUCT_CREATE",
  PRODUCT_UPDATE: "PRODUCT_UPDATE",
  STOCK_ENTRY: "STOCK_ENTRY",
  ORDER_CREATE: "ORDER_CREATE",
  ORDER_CANCEL: "ORDER_CANCEL",
  ORDER_STATUS_CHANGE: "ORDER_STATUS_CHANGE",
  PAYMENT_CREATE: "PAYMENT_CREATE",
  SELLER_CREATE: "SELLER_CREATE",
  SELLER_UPDATE: "SELLER_UPDATE",
  DOCTOR_CREATE: "DOCTOR_CREATE",
  DOCTOR_UPDATE: "DOCTOR_UPDATE",
  DOCTOR_TRANSFER: "DOCTOR_TRANSFER",
  COLLECTION_CREATE: "COLLECTION_CREATE",
  COLLECTION_CANCEL: "COLLECTION_CANCEL",
  DUE_DATE_CHANGE: "DUE_DATE_CHANGE",
  COMMISSION_PERIOD_CLOSE: "COMMISSION_PERIOD_CLOSE",
  COMMISSION_STATUS_CHANGE: "COMMISSION_STATUS_CHANGE",
  CONGRESS_CREATE: "CONGRESS_CREATE",
  CONGRESS_UPDATE: "CONGRESS_UPDATE",
  CONGRESS_DELETE: "CONGRESS_DELETE",
  CONGRESS_CANCEL: "CONGRESS_CANCEL",
  CONGRESS_PACKAGE_CREATE: "CONGRESS_PACKAGE_CREATE",
  CONGRESS_PACKAGE_UPDATE: "CONGRESS_PACKAGE_UPDATE",
  CONGRESS_PACKAGE_DELETE: "CONGRESS_PACKAGE_DELETE",
  CONGRESS_REGISTRATION_REQUEST: "CONGRESS_REGISTRATION_REQUEST",
  CONGRESS_REGISTRATION_APPROVE: "CONGRESS_REGISTRATION_APPROVE",
  CONGRESS_REGISTRATION_CANCEL: "CONGRESS_REGISTRATION_CANCEL",
  CONGRESS_BALANCE_ADJUST: "CONGRESS_BALANCE_ADJUST",
  DEALER_CREATE: "DEALER_CREATE",
  DEALER_UPDATE: "DEALER_UPDATE",
  DEALER_PRICE_SET: "DEALER_PRICE_SET",
  DEALER_SHIPMENT_REQUEST: "DEALER_SHIPMENT_REQUEST",
  DEALER_SHIPMENT_APPROVE: "DEALER_SHIPMENT_APPROVE",
  DEALER_SHIPMENT_REJECT: "DEALER_SHIPMENT_REJECT",
  DEALER_SHIPMENT_CANCEL: "DEALER_SHIPMENT_CANCEL",
  DEALER_PAYMENT_CREATE: "DEALER_PAYMENT_CREATE",
  AUTH_LOGIN_SUCCESS: "AUTH_LOGIN_SUCCESS",
  AUTH_LOGIN_FAILURE: "AUTH_LOGIN_FAILURE",
  AUTH_LOGOUT: "AUTH_LOGOUT",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

/** Audit ekranında gösterilecek okunur etiketler. */
export const AUDIT_ACTION_LABELS: Record<string, string> = {
  PRODUCT_CREATE: "Ürün oluşturma",
  PRODUCT_UPDATE: "Ürün güncelleme",
  STOCK_ENTRY: "Stok girişi",
  ORDER_CREATE: "Sipariş oluşturma",
  ORDER_CANCEL: "Sipariş iptali",
  ORDER_STATUS_CHANGE: "Sipariş durum değişikliği",
  PAYMENT_CREATE: "Ödeme kaydı",
  SELLER_CREATE: "Satıcı oluşturma",
  SELLER_UPDATE: "Satıcı güncelleme",
  DOCTOR_CREATE: "Doktor oluşturma",
  DOCTOR_UPDATE: "Doktor güncelleme",
  DOCTOR_TRANSFER: "Doktor devri",
  COLLECTION_CREATE: "Tahsilat kaydı",
  COLLECTION_CANCEL: "Tahsilat iptali",
  DUE_DATE_CHANGE: "Vade değişikliği",
  COMMISSION_PERIOD_CLOSE: "Prim dönemi kapanışı",
  COMMISSION_STATUS_CHANGE: "Prim durum değişikliği",
  CONGRESS_CREATE: "Kongre oluşturma",
  CONGRESS_UPDATE: "Kongre güncelleme",
  CONGRESS_DELETE: "Kongre silme",
  CONGRESS_CANCEL: "Kongre iptali",
  CONGRESS_PACKAGE_CREATE: "Kongre paketi ekleme",
  CONGRESS_PACKAGE_UPDATE: "Kongre paketi güncelleme",
  CONGRESS_PACKAGE_DELETE: "Kongre paketi silme",
  CONGRESS_REGISTRATION_REQUEST: "Kongre kayıt talebi",
  CONGRESS_REGISTRATION_APPROVE: "Kongre kaydı onayı",
  CONGRESS_REGISTRATION_CANCEL: "Kongre kaydı iptali",
  CONGRESS_BALANCE_ADJUST: "Kongre bakiyesi düzeltmesi",
  DEALER_CREATE: "Bayi oluşturma",
  DEALER_UPDATE: "Bayi güncelleme",
  DEALER_PRICE_SET: "Bayi fiyatı tanımlama",
  DEALER_SHIPMENT_REQUEST: "Bayi sevkiyat talebi",
  DEALER_SHIPMENT_APPROVE: "Bayi sevkiyat onayı",
  DEALER_SHIPMENT_REJECT: "Bayi sevkiyat reddi",
  DEALER_SHIPMENT_CANCEL: "Bayi sevkiyat iptali",
  DEALER_PAYMENT_CREATE: "Bayi ödemesi",
  AUTH_LOGIN_SUCCESS: "Giriş başarılı",
  AUTH_LOGIN_FAILURE: "Giriş başarısız",
  AUTH_LOGOUT: "Çıkış",
};

// Log'a asla yazılmayacak alanlar (iç içe nesnelerde de temizlenir).
const SENSITIVE_KEYS = new Set([
  "passwordHash",
  "password",
  "token",
  "accessToken",
  "refreshToken",
  "secret",
]);

/** Nesneden hassas alanları özyinelemeli olarak çıkarır. */
export function sanitizeAuditData(data: unknown): unknown {
  if (data instanceof Date) return data.toISOString();
  // Parasal alanlar BigInt kuruş. JSON.stringify BigInt'te TypeError atar ve
  // serialize() bunu yutup null döndüğü için audit kaydı SESSİZCE boşalırdı.
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
  try {
    return JSON.stringify(sanitizeAuditData(data));
  } catch {
    return null;
  }
}

type AuditInput = {
  actorId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
};

/** Denetim kaydı oluşturur. Hata olursa yutar (ana işlemi bozmaz). */
export async function createAuditLog(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        beforeData: serialize(input.before),
        afterData: serialize(input.after),
      },
    });
  } catch (err) {
    console.error("[audit] kayıt oluşturulamadı:", err);
  }
}
