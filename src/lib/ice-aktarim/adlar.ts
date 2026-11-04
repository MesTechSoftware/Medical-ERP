import type { ImportDataType } from "@/generated/prisma/enums";

/** Veri tipinin ekran adı — içe aktarım ekranı ve dashboard özeti. Saf modül (süzgeç modülü de okur). */
export const VERI_TIPI_ADI: Record<ImportDataType, string> = {
  CARI: "Cari (doktor ve bayi)",
  URUN: "Ürün",
  FIYAT_LISTESI: "Fiyat listesi",
  ACILIS_BAKIYESI: "Açılış bakiyesi",
  ACILIS_STOGU: "Açılış stoğu",
};
