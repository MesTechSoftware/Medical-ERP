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
