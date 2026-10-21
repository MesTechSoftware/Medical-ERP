import type { Prisma } from "@/generated/prisma/client";
import type { ImportDataType } from "@/generated/prisma/enums";
import type { Bildirim, KuralKodu } from "@/lib/sonuc";

/**
 * İçe aktarım tanımı — ADR-006 §1. Her veri türünün TEK tanımı: kolonlar (şablon ve başlık eşlemesi),
 * çözümleyiciler + elle giriş şemasıyla denetim, özet, yazıcı, geri alıcı ve küme kuralları.
 * Kural tanımda yazılmaz; elle giriş akışının fonksiyonundan gelir (X-16 §(1)).
 */

export type Kolon = {
  /** Şablon başlığı — eşleme bununla yapılır (ADR-006 §4). */
  baslik: string;
  /** Denetimin bildirim `alan`ı (elle giriş formunun alan adı). */
  alan: string;
  /** Kolon dosyada bulunmak zorunda mı (X-16 §(3)). */
  zorunlu: boolean;
  aciklama: string;
  ornek: string;
  /** Kapalı katalog — şablonda açılır liste. */
  izinli?: readonly string[];
  /** Kuralın kaynağı karar. */
  kaynak: string;
};

export type Satir = { no: number; deger: Record<string, string | null> };

export type OzetSatiri = { etiket: string; deger: string | number; bilgi?: boolean };

export type Denetim<T> = {
  /** Satır hataları — `parametreler.satir` Excel satır numarasını taşır. */
  hatalar: Bildirim[];
  yazilacak: T[];
  ozet: OzetSatiri[];
};

export type KumeKurali = {
  /** Anahtar ifadesi — ör. "normalize telefon". */
  anahtar: string;
  kapsam: "veritabani+parti";
  kuralKodu: KuralKodu;
  /** Bağlı olduğu veritabanı kısıtı (küme kuralı kapsama testi). */
  kisit: string;
};

export type IceAktarimTanimi<T> = {
  tur: ImportDataType;
  /** Hedef tablo (şema kapsama testi). */
  tablo: string;
  kolonlar: readonly Kolon[];
  /** NOT NULL ve varsayılansız olup tanımda bulunmayan, sistemin doldurduğu kolonlar. */
  sistemDoldurur: readonly string[];
  kumeKurallari: readonly KumeKurali[];
  /** İçe aktarımın erişemediği kısıtlar (ör. ekranla değişmeyen alanlar). */
  importtanErisilemez: readonly string[];
  denetle(db: Prisma.TransactionClient, satirlar: readonly Satir[]): Promise<Denetim<T>>;
  yaz(tx: Prisma.TransactionClient, yazilacak: readonly T[], parti: { id: string; no: string; yapanId: string }): Promise<void>;
  /** Geri alma (X-12 §(3), X-16 §(10)); tanımsızsa tür geri alınmaz. `null` → geri alındı. */
  geriAl?(tx: Prisma.TransactionClient, partiId: string): Promise<KuralKodu | null>;
};

/** Satır bildirimini satır numarası ve kolon başlığıyla işaretler. */
export function satirBildirimi(b: Bildirim, satir: number, kolonlar: readonly Kolon[]): Bildirim {
  const kolon = kolonlar.find((k) => k.alan === b.alan)?.baslik;
  return { kademe: b.kademe, kural_kodu: b.kural_kodu, parametreler: { ...b.parametreler, satir, ...(kolon ? { kolon } : {}) } };
}
