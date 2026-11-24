import type { Role } from "@/generated/prisma/enums";
import type { AuditAction } from "@/lib/audit";

type Fiil = string | ((veri: Record<string, unknown>) => string);

/**
 * Aktivite akışı şablonları (brief §3.6): olay türü → fiil. Cümle "{aktör} {fiil} · {nesne}"; nesne
 * belge numarası ya da ürün/liste adıdır; tek istisna devirdir ("Dr. A → Satıcı B", `aktivite.ts`). Başka kişi adı,
 * ham alan, JSON ve kimlik yazılmaz. Şablonu olmayan olay akışta görünmez: her olay ya burada ya `AKIS_DISI`'ndadır
 * (`aktivite.test.ts` tarar).
 */
export const SABLONLAR = {
  ORDER_CREATE: "yeni sipariş oluşturdu",
  ORDER_CANCEL: "siparişi iptal etti",
  ORDER_REMAINDER_CLOSE: "sipariş kalanını kapattı",
  ORDER_STATUS_CHANGE: (v) =>
    v.sevkiyat
      ? v.tamamlandi
        ? "siparişi kargoladı"
        : "kısmi sevkiyat yaptı"
      : v.status === "HAZIRLANIYOR"
        ? "siparişi hazırlığa aldı"
        : v.status === "TESLIM_EDILDI"
          ? "siparişi teslim edildi olarak işaretledi"
          : "sipariş durumunu değiştirdi",
  RETURN_CREATE: "iade kaydetti",
  COLLECTION_CREATE: "tahsilat kaydetti",
  COLLECTION_CANCEL: "tahsilatı iptal etti",
  DUE_DATE_CHANGE: "vade değiştirdi",
  LATE_FEE_CREATE: "vade farkı kaydetti",
  LEDGER_REVERSAL: "ters kayıt yaptı",
  STOCK_ENTRY: "stok girişi yaptı",
  STOCK_ADJUSTMENT: "stok düzeltmesi yaptı",
  CONSIGNMENT_CREATE: "konsinye çıkış yaptı",
  STOCK_TRANSFER_CREATE: "stok transferi yaptı",
  APPROVAL_DECIDE: (v) => (v.karar === "RED" ? "onay talebini reddetti" : "onay talebini onayladı"),
  PRODUCT_CREATE: "yeni ürün ekledi",
  PRODUCT_UPDATE: "ürünü güncelledi",
  PRODUCT_DELETE: "ürünü sildi",
  PRICE_LIST_CREATE: "fiyat listesi oluşturdu",
  PRICE_LIST_ITEM_SET: "fiyat listesine fiyat girdi",
  PRICE_LIST_ITEM_DELETE: "fiyat listesinden satır sildi",
  IMPORT_CREATE: "içe aktarım yaptı",
  IMPORT_REVERT: "içe aktarımı geri aldı",
  DOCTOR_CREATE: "yeni cari açtı",
  DOCTOR_UPDATE: "cari bilgilerini güncelledi",
  DOCTOR_TRANSFER: "doktor devretti",
  USER_CREATE: "kullanıcı hesabı açtı",
  USER_UPDATE: "kullanıcı hesabını güncelledi",
} satisfies Partial<Record<AuditAction, Fiil>>;

/** Akışa girmeyen olaylar: oturum ve parola olayları operasyon hareketi değildir. */
export const AKIS_DISI = [
  "AUTH_LOGIN_SUCCESS",
  "AUTH_LOGIN_FAILURE",
  "AUTH_LOGOUT",
  "PASSWORD_CHANGE",
  "USER_PASSWORD_RESET",
] as const satisfies readonly AuditAction[];

type SablonluOlay = keyof typeof SABLONLAR;

/** Rol → akışta görünen olaylar; rol süzgecinin tek tablosu. Denetim kaydı yöneticinindir (KARARLAR D-2). */
export const AKIS_GORUNURLUGU: Record<Role, readonly SablonluOlay[]> = {
  YONETICI: Object.keys(SABLONLAR) as SablonluOlay[],
  OPERASYON: [],
  SATICI: [],
};

export function veriOku(json: string | null): Record<string, unknown> {
  try {
    const v: unknown = JSON.parse(json ?? "null");
    return v !== null && typeof v === "object" ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/** Denetim kaydının akış cümlesi; şablonsuz olayda `null` (gösterilmez). Bozuk veri genel fiile düşer. */
export function aktiviteCumlesi(k: {
  action: string;
  afterData: string | null;
  aktor: string | null;
  nesne: string | null;
}): string | null {
  if (!Object.hasOwn(SABLONLAR, k.action)) return null;
  const fiil: Fiil = SABLONLAR[k.action as SablonluOlay];
  const metin = typeof fiil === "string" ? fiil : fiil(veriOku(k.afterData));
  return `${k.aktor ?? "Sistem"} ${metin}${k.nesne ? ` · ${k.nesne}` : ""}`;
}
