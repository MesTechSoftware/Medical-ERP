import type { AuditActionType, AuditModule } from "@/generated/prisma/enums";

/**
 * Denetim olayları ve sınıfları (KARARLAR X-18 §(3)). Saf modüldür: birim testi ve istemci
 * bileşenleri buradan okur; yazıcı (`audit.ts`) yeniden dışa aktarır.
 */

export const AUDIT_ACTIONS = {
  PRODUCT_CREATE: "PRODUCT_CREATE",
  PRODUCT_UPDATE: "PRODUCT_UPDATE",
  PRODUCT_DELETE: "PRODUCT_DELETE",
  PRICE_LIST_CREATE: "PRICE_LIST_CREATE",
  PRICE_LIST_ITEM_SET: "PRICE_LIST_ITEM_SET",
  PRICE_LIST_ITEM_DELETE: "PRICE_LIST_ITEM_DELETE",
  STOCK_ENTRY: "STOCK_ENTRY",
  IMPORT_CREATE: "IMPORT_CREATE",
  IMPORT_REVERT: "IMPORT_REVERT",
  STOCK_ADJUSTMENT: "STOCK_ADJUSTMENT",
  CONSIGNMENT_CREATE: "CONSIGNMENT_CREATE",
  STOCK_TRANSFER_CREATE: "STOCK_TRANSFER_CREATE",
  APPROVAL_DECIDE: "APPROVAL_DECIDE",
  ORDER_CREATE: "ORDER_CREATE",
  ORDER_CANCEL: "ORDER_CANCEL",
  ORDER_REMAINDER_CLOSE: "ORDER_REMAINDER_CLOSE",
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
  PRODUCT_DELETE: "Ürün silme",
  PRICE_LIST_CREATE: "Fiyat listesi oluşturma",
  PRICE_LIST_ITEM_SET: "Fiyat listesi satırı",
  PRICE_LIST_ITEM_DELETE: "Fiyat listesi satırı silme",
  STOCK_ENTRY: "Stok girişi",
  IMPORT_CREATE: "İçe aktarım",
  IMPORT_REVERT: "İçe aktarım geri alma",
  STOCK_ADJUSTMENT: "Stok düzeltme",
  CONSIGNMENT_CREATE: "Konsinye çıkış",
  STOCK_TRANSFER_CREATE: "Stok transferi",
  APPROVAL_DECIDE: "Onay kararı",
  ORDER_CREATE: "Sipariş oluşturma",
  ORDER_CANCEL: "Sipariş iptali",
  ORDER_REMAINDER_CLOSE: "Sipariş kalanını kapatma",
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
} satisfies Record<AuditAction, string>;

export type IslemSinifi = { tur: AuditActionType; modul: AuditModule };

export const ISLEM_TURU_ETIKETI: Record<AuditActionType, string> = {
  EKLEME: "Ekleme",
  GUNCELLEME: "Güncelleme",
  SILME: "Silme",
  OTURUM: "Oturum",
};

export const MODUL_ETIKETI: Record<AuditModule, string> = {
  SATIS: "Satış",
  STOK: "Stok",
  FINANS: "Finans",
  CARI: "Cari",
  URUN_FIYAT: "Ürün ve fiyat",
  ICE_AKTARIM: "İçe aktarım",
  KULLANICI: "Kullanıcı ve oturum",
};

/**
 * Olay → işlem türü ve modül; tek tablo. İptal ve ters kayıt Silme değildir (C-3 §(1): sistemde
 * `DELETE` yok); Silme yalnız gerçekten silen akışlardadır. Eski satırlar migration'daki `CASE` ile
 * doldurulur; iki tablonun eşitliği `degismezlik.test.ts`'tedir.
 */
export const ISLEM_SINIFI: Record<AuditAction, IslemSinifi> = {
  ORDER_CREATE: { tur: "EKLEME", modul: "SATIS" },
  ORDER_CANCEL: { tur: "GUNCELLEME", modul: "SATIS" },
  ORDER_REMAINDER_CLOSE: { tur: "GUNCELLEME", modul: "SATIS" },
  ORDER_STATUS_CHANGE: { tur: "GUNCELLEME", modul: "SATIS" },
  RETURN_CREATE: { tur: "EKLEME", modul: "SATIS" },
  STOCK_ENTRY: { tur: "EKLEME", modul: "STOK" },
  STOCK_ADJUSTMENT: { tur: "EKLEME", modul: "STOK" },
  CONSIGNMENT_CREATE: { tur: "EKLEME", modul: "STOK" },
  STOCK_TRANSFER_CREATE: { tur: "EKLEME", modul: "STOK" },
  APPROVAL_DECIDE: { tur: "GUNCELLEME", modul: "SATIS" },
  COLLECTION_CREATE: { tur: "EKLEME", modul: "FINANS" },
  COLLECTION_CANCEL: { tur: "GUNCELLEME", modul: "FINANS" },
  DUE_DATE_CHANGE: { tur: "GUNCELLEME", modul: "FINANS" },
  LATE_FEE_CREATE: { tur: "EKLEME", modul: "FINANS" },
  LEDGER_REVERSAL: { tur: "EKLEME", modul: "FINANS" },
  DOCTOR_CREATE: { tur: "EKLEME", modul: "CARI" },
  DOCTOR_UPDATE: { tur: "GUNCELLEME", modul: "CARI" },
  DOCTOR_TRANSFER: { tur: "GUNCELLEME", modul: "CARI" },
  PRODUCT_CREATE: { tur: "EKLEME", modul: "URUN_FIYAT" },
  PRODUCT_UPDATE: { tur: "GUNCELLEME", modul: "URUN_FIYAT" },
  PRODUCT_DELETE: { tur: "SILME", modul: "URUN_FIYAT" },
  PRICE_LIST_CREATE: { tur: "EKLEME", modul: "URUN_FIYAT" },
  PRICE_LIST_ITEM_SET: { tur: "GUNCELLEME", modul: "URUN_FIYAT" },
  PRICE_LIST_ITEM_DELETE: { tur: "SILME", modul: "URUN_FIYAT" },
  IMPORT_CREATE: { tur: "EKLEME", modul: "ICE_AKTARIM" },
  IMPORT_REVERT: { tur: "SILME", modul: "ICE_AKTARIM" },
  USER_CREATE: { tur: "EKLEME", modul: "KULLANICI" },
  USER_UPDATE: { tur: "GUNCELLEME", modul: "KULLANICI" },
  USER_PASSWORD_RESET: { tur: "GUNCELLEME", modul: "KULLANICI" },
  PASSWORD_CHANGE: { tur: "GUNCELLEME", modul: "KULLANICI" },
  AUTH_LOGIN_SUCCESS: { tur: "OTURUM", modul: "KULLANICI" },
  AUTH_LOGIN_FAILURE: { tur: "OTURUM", modul: "KULLANICI" },
  AUTH_LOGOUT: { tur: "OTURUM", modul: "KULLANICI" },
};

/** Kaydın sınıfı. Fiyat satırı tek olaydır: önceki değer yoksa ilk giriştir (Ekleme). */
export function islemSinifi(action: AuditAction, once: unknown): IslemSinifi {
  const sinif = ISLEM_SINIFI[action];
  if (action === AUDIT_ACTIONS.PRICE_LIST_ITEM_SET && (once === undefined || once === null)) {
    return { ...sinif, tur: "EKLEME" };
  }
  return sinif;
}
