/**
 * Sütun seçicili liste ekranlarının tek kaydı (spec Ü-18 §3.4): anahtar ekranın yoludur — tercih çerezi o
 * yola yazılır, kaydettikten sonra yalnız o yola dönülür. Yeni sütunlu ekran buraya bir satır, sütun
 * yetkisi aynı satırdadır. Saf modül.
 */

import type { SutunTanimi } from "@/lib/liste/sutunlar";
import * as denetim from "@/lib/denetim/sutunlar";
import * as doktor from "@/lib/doktor-listesi/sutunlar";
import * as fiyatListesi from "@/lib/fiyat-listesi-listesi/sutunlar";
import * as iceAktarim from "@/lib/ice-aktarim-listesi/sutunlar";
import * as kargo from "@/lib/kargo-listesi/sutunlar";
import * as kullanici from "@/lib/kullanici-listesi/sutunlar";
import * as onay from "@/lib/onay-listesi/sutunlar";
import * as rapor from "@/lib/rapor-listesi/sutunlar";
import * as siparis from "@/lib/siparis-listesi/sutunlar";
import * as stok from "@/lib/stok-listesi/sutunlar";
import * as tahsilat from "@/lib/tahsilat-listesi/sutunlar";
import * as urun from "@/lib/urun-listesi/sutunlar";

/** Tercihi kaydetme yetkisi: listeyi görebilen roller — sayfanın guard'ıyla aynı (`requireAdmin`/`requireStaff`/`requireSeller`). */
export type SutunYetkisi = "yonetici" | "personel" | "satici";

export type SutunListesi = { sutunlar: readonly SutunTanimi<string>[]; cerez: string; yetki: SutunYetkisi };

export const SUTUN_LISTELERI = {
  "/approvals": { sutunlar: onay.SUTUNLAR, cerez: onay.SUTUN_CEREZI, yetki: "yonetici" },
  "/audit-logs": { sutunlar: denetim.SUTUNLAR, cerez: denetim.SUTUN_CEREZI, yetki: "yonetici" },
  "/collections": { sutunlar: tahsilat.SUTUNLAR, cerez: tahsilat.SUTUN_CEREZI, yetki: "personel" },
  "/doctors": { sutunlar: doktor.SUTUNLAR, cerez: doktor.SUTUN_CEREZI, yetki: "personel" },
  "/imports": { sutunlar: iceAktarim.SUTUNLAR, cerez: iceAktarim.SUTUN_CEREZI, yetki: "yonetici" },
  "/orders": { sutunlar: siparis.SUTUNLAR, cerez: siparis.SUTUN_CEREZI, yetki: "personel" },
  "/price-lists": { sutunlar: fiyatListesi.SUTUNLAR, cerez: fiyatListesi.SUTUN_CEREZI, yetki: "yonetici" },
  "/products": { sutunlar: urun.SUTUNLAR, cerez: urun.SUTUN_CEREZI, yetki: "personel" },
  "/reports": { sutunlar: rapor.SUTUNLAR, cerez: rapor.SUTUN_CEREZI, yetki: "yonetici" },
  "/shipping": { sutunlar: kargo.SUTUNLAR, cerez: kargo.SUTUN_CEREZI, yetki: "personel" },
  "/stock": { sutunlar: stok.SUTUNLAR, cerez: stok.SUTUN_CEREZI, yetki: "personel" },
  "/users": { sutunlar: kullanici.SUTUNLAR, cerez: kullanici.SUTUN_CEREZI, yetki: "personel" },
  "/my-doctors": { sutunlar: doktor.SATICI_SUTUNLARI, cerez: doktor.SATICI_SUTUN_CEREZI, yetki: "satici" },
  "/my-orders": { sutunlar: siparis.SATICI_SUTUNLARI, cerez: siparis.SATICI_SUTUN_CEREZI, yetki: "satici" },
} as const satisfies Record<string, SutunListesi>;

export type SutunluListe = keyof typeof SUTUN_LISTELERI;
export type SutunAnahtari<L extends SutunluListe> = (typeof SUTUN_LISTELERI)[L]["sutunlar"][number]["anahtar"];

export function sutunluListeMi(yol: string): yol is SutunluListe {
  return Object.hasOwn(SUTUN_LISTELERI, yol);
}
