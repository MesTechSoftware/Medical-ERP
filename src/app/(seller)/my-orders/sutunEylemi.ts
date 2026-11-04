"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireSeller } from "@/lib/session";
import { gizliSutunCerezi, guvenliDonus } from "@/lib/liste/sutunlar";
import { SATICI_SUTUNLARI, SATICI_SUTUN_CEREZI, SATICI_SUTUN_YOLU } from "@/lib/siparis-listesi/sutunlar";

/**
 * Siparişlerim sütun tercihi (spec Ü-31): görünür bırakılmayan sütunlar çereze yazılır; sayfa sunucuda okur.
 * İş kaydı değildir, denetim kaydına yazılmaz. "Varsayılana dön" çerezi siler.
 */
export async function sutunlariKaydet(formData: FormData): Promise<void> {
  await requireSeller();
  const donus = String(formData.get("donus") ?? "");
  const jar = await cookies();
  if (formData.get("islem") === "varsayilan") {
    jar.delete({ name: SATICI_SUTUN_CEREZI, path: SATICI_SUTUN_YOLU });
  } else {
    const gorunur = new Set(formData.getAll("gorunur").map(String));
    const gizli = SATICI_SUTUNLARI.map((s) => s.anahtar).filter((a) => !gorunur.has(a));
    jar.set(SATICI_SUTUN_CEREZI, gizliSutunCerezi(SATICI_SUTUNLARI, gizli), {
      path: SATICI_SUTUN_YOLU,
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      httpOnly: true,
    });
  }
  redirect(guvenliDonus(SATICI_SUTUN_YOLU, donus));
}
