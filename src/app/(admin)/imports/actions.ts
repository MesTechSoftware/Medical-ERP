"use server";

import { revalidatePath } from "next/cache";
import type { ImportDataType } from "@/generated/prisma/enums";
import { requireAdmin } from "@/lib/session";
import { calistirIceAktarim, partiGeriAl, sablonUret, TANIMLAR, type IceAktarimSonucu } from "@/lib/ice-aktarim";
import { type IslemSonucu, basarili, engel, gerekceEngeli } from "@/lib/sonuc";

/**
 * İçe aktarım (D-6, X-16) — yalnız `YONETICI` (X-16 §(6); devreye alma aracı). Dosya istekle gelir,
 * bellekte işlenir, saklanmaz (E-3 §(2)). "Önizle" yazmaz; "Yaz" aynı dosyayı yeniden doğrular.
 */
function tur(formData: FormData): ImportDataType | null {
  const t = String(formData.get("tur") ?? "") as ImportDataType;
  return TANIMLAR[t] ? t : null;
}

export async function iceAktar(_prev: unknown, formData: FormData): Promise<IceAktarimSonucu> {
  const session = await requireAdmin();
  const t = tur(formData);
  if (!t) return engel("ALAN_ZORUNLU", {}, "tur");
  const dosya = formData.get("dosya");
  if (!(dosya instanceof File) || dosya.size === 0) return engel("ICE_AKTARIM_DOSYA_GECERSIZ", { mb: 0 }, "dosya");
  const asama = formData.get("asama") === "yaz" ? "yaz" : "onizle";
  const sonuc = await calistirIceAktarim(t, { ad: dosya.name, icerik: Buffer.from(await dosya.arrayBuffer()) }, asama, session.user.id);
  if (sonuc.partiNo) {
    revalidatePath("/imports");
    revalidatePath("/doctors");
    revalidatePath("/products");
    revalidatePath("/price-lists");
    revalidatePath("/stock");
  }
  return sonuc;
}

/** Şablon tanımdan üretilir (ADR-006 §3); indirme tarayıcıda, sunucuda dosya tutulmaz. */
export async function sablonIndir(t: ImportDataType): Promise<IceAktarimSonucu> {
  await requireAdmin();
  if (!TANIMLAR[t]) return engel("ALAN_ZORUNLU", {}, "tur");
  return {
    ...basarili(),
    dosya: {
      ad: `sablon_${t.toLowerCase()}.xlsx`,
      mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      icerik: sablonUret(t).toString("base64"),
    },
  };
}

export async function partiyiGeriAl(partiId: string, _prev: unknown, formData: FormData): Promise<IslemSonucu> {
  const session = await requireAdmin();
  const gerekce = String(formData.get("reason") ?? "").trim();
  const gerekceSonucu = gerekceEngeli(gerekce, "reason");
  if (gerekceSonucu) return gerekceSonucu;
  const sonuc = await partiGeriAl(partiId, session.user.id, gerekce);
  revalidatePath("/imports");
  revalidatePath("/doctors");
  // Ürün ve fiyat listesi partisinin geri alınması o ekranların kayıtlarını siler (Ü-30).
  revalidatePath("/products");
  revalidatePath("/price-lists");
  revalidatePath("/stock");
  return sonuc;
}
