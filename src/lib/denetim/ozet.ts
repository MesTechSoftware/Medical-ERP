import { SABLONLAR, veriOku } from "@/lib/aktivite-sablonlari";
import type { Yaprak } from "@/lib/denetim/fark";
import type { AuditAction } from "@/lib/denetim/olaylar";
import { formatDateTime, formatGun } from "@/lib/format";
import { ROLE_LABEL } from "@/lib/roles";

/**
 * Denetim ekranının metinleri (KARARLAR X-18 §(9)): liste satırının kısa özeti, fark satırının alan
 * adı ve değeri. Saf modül.
 */

type Fiil = string | ((veri: Record<string, unknown>) => string);

/** Özet fiili: akış şablonları ve akışa girmeyen oturum/parola olayları. Eksik olay derleme hatasıdır. */
export const OZET_FIILLERI: Record<AuditAction, Fiil> = {
  ...SABLONLAR,
  AUTH_LOGIN_SUCCESS: "giriş yaptı",
  AUTH_LOGIN_FAILURE: "başarısız giriş denemesi",
  AUTH_LOGOUT: "çıkış yaptı",
  PASSWORD_CHANGE: "parolasını değiştirdi",
  USER_PASSWORD_RESET: "kullanıcı parolasını sıfırladı",
};

const buyukHarfle = (metin: string) => metin.charAt(0).toLocaleUpperCase("tr-TR") + metin.slice(1);

/** "{Fiil} · {nesne}"; aktör ayrı kolondadır. Başarısız girişte nesne denenen e-postadır. */
export function kisaOzet(k: { action: string; afterData: string | null; entityId: string | null }, nesne: string | null): string {
  if (!Object.hasOwn(OZET_FIILLERI, k.action)) return k.action;
  const fiil = OZET_FIILLERI[k.action as AuditAction];
  const metin = typeof fiil === "string" ? fiil : fiil(veriOku(k.afterData));
  const n = nesne ?? (k.action === "AUTH_LOGIN_FAILURE" ? k.entityId : null);
  return `${buyukHarfle(metin)}${n ? ` · ${n}` : ""}`;
}

/** Denetim payload'larında geçen alanlar; bilinmeyen alan ham adıyla görünür. */
const ALAN_ETIKETLERI: Record<string, string> = {
  id: "Kayıt no",
  accountClass: "Hesap sınıfı",
  accountingCode: "Muhasebe kodu",
  aciklama: "Açıklama",
  amount: "Tutar",
  batchNo: "Parti no",
  city: "Şehir",
  clinic: "Klinik",
  code: "Kod",
  commissionRate: "Prim oranı",
  createdAt: "Oluşturulma",
  creditLimit: "Kredi limiti",
  doctorId: "Doktor",
  doctorName: "Doktor adı",
  documentNo: "Belge no",
  dosya: "Dosya",
  dueDate: "Vade tarihi",
  email: "E-posta",
  fark: "Fark",
  fullName: "Ad soyad",
  iade: "İade belgesi",
  importBatchId: "İçe aktarım partisi",
  invoiceAddress: "Fatura adresi",
  invoiceCity: "Fatura ili",
  invoiceDistrict: "Fatura ilçesi",
  invoiceTitle: "Fatura unvanı",
  isActive: "Aktif",
  itemCount: "Kalem sayısı",
  itemId: "Fiyat satırı",
  kalemler: "Kalem",
  kayit: "Kayıt sayısı",
  konumId: "Konum",
  listPrice: "Liste fiyatı",
  minQuantity: "Asgari adet",
  miktar: "Miktar",
  mustChangePassword: "Parola değiştirmeli",
  name: "Ad",
  newStock: "Yeni stok",
  note: "Not",
  onayaGonderildi: "Onaya gönderildi",
  ownerSellerId: "Sorumlu satıcı",
  partyType: "Cari tipi",
  passwordHash: "Parola özeti",
  paymentTermDays: "Vade (gün)",
  phone: "Telefon",
  phoneNormalized: "Telefon (normalize)",
  priceListId: "Fiyat listesi",
  productId: "Ürün",
  quantity: "Miktar",
  region: "Bölge",
  role: "Rol",
  saticiId: "Satıcı",
  sebepId: "Sebep",
  sevkiyat: "Sevkiyat belgesi",
  specialty: "Uzmanlık",
  status: "Durum",
  tamamlandi: "Tamamlandı",
  taxId: "VKN / TCKN",
  taxOffice: "Vergi dairesi",
  taxRateId: "KDV oranı",
  tersKayitId: "Ters kayıt",
  title: "Unvan",
  tur: "Tür",
  urunId: "Ürün",
};

/** `kalemler[0].fark` → "Kalem 1 · Fark". */
export function alanEtiketi(yol: string): string {
  const parcalar: string[] = [];
  for (const parca of yol.match(/[^.[\]]+|\[\d+\]/g) ?? []) {
    const indeks = parca.match(/^\[(\d+)\]$/);
    if (indeks && parcalar.length > 0) parcalar[parcalar.length - 1] += ` ${parseInt(indeks[1], 10) + 1}`;
    else parcalar.push(indeks ? String(parseInt(indeks[1], 10) + 1) : (ALAN_ETIKETLERI[parca] ?? parca));
  }
  return parcalar.length > 0 ? parcalar.join(" · ") : yol;
}

/** Takvim günü kolonları: UTC gece yarısıdır, dönüştürülmeden okunur (E-1 §(1)). */
const GUN_ALANLARI = new Set(["dueDate", "validFrom", "validTo", "shippedOn"]);
const KOD_ALANLARI = new Set(["status", "role", "accountClass", "partyType"]);
const KOD_ETIKETLERI: Record<string, string> = {
  BEKLIYOR: "Bekliyor",
  HAZIRLANIYOR: "Hazırlanıyor",
  KARGOLANDI: "Kargolandı",
  TESLIM_EDILDI: "Teslim edildi",
  IPTAL: "İptal",
  AKTIF: "Aktif",
  PASIF: "Pasif",
  DOKTOR: "Doktor",
  BAYI: "Bayi",
  TUZEL_KISI: "Tüzel kişi",
  GERCEK_KISI: "Gerçek kişi",
  ...ROLE_LABEL,
};
const AN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;

export function degerMetni(yol: string, deger: Yaprak): string {
  if (deger === null) return "boş";
  if (typeof deger === "boolean") return deger ? "Evet" : "Hayır";
  if (typeof deger === "number") return String(deger);
  const alan = (yol.match(/[^.[\]]+/g) ?? [yol]).at(-1) ?? yol;
  if (AN.test(deger)) return GUN_ALANLARI.has(alan) ? formatGun(new Date(deger)) : formatDateTime(new Date(deger));
  if (KOD_ALANLARI.has(alan)) return KOD_ETIKETLERI[deger] ?? deger;
  return deger;
}

const VARLIK_ETIKETLERI: Record<string, string> = {
  Auth: "Oturum",
  Doctor: "Cari",
  DoctorPayment: "Tahsilat",
  ImportBatch: "İçe aktarım partisi",
  LedgerEntry: "Cari hareket",
  Order: "Sipariş",
  PriceList: "Fiyat listesi",
  Product: "Ürün",
  StockAdjustment: "Stok düzeltme",
  User: "Kullanıcı",
};

/** Kaydın varlık türünün okunur adı; bilinmeyen tür ham adıyla görünür. */
export function varlikEtiketi(entityType: string): string {
  return VARLIK_ETIKETLERI[entityType] ?? entityType;
}
