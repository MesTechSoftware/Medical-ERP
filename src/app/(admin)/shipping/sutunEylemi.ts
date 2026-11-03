"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/session";
import { gizliSutunCerezi, guvenliDonus } from "@/lib/liste/sutunlar";
import { SUTUNLAR, SUTUN_CEREZI, SUTUN_YOLU } from "@/lib/kargo-listesi/sutunlar";

/**
 * Sevkiyat listesinin sütun tercihi (spec Ü-24 §3.5): görünür bırakılmayan sütunlar çereze yazılır; sayfa
 * sunucuda okur. İş kaydı değildir, denetim kaydına yazılmaz. "Varsayılana dön" çerezi siler.
 */
export async function sutunlariKaydet(formData: FormData): Promise<void> {
  await requireStaff();
  const donus = String(formData.get("donus") ?? "");
  const jar = await cookies();
  if (formData.get("islem") === "varsayilan") {
    jar.delete({ name: SUTUN_CEREZI, path: SUTUN_YOLU });
  } else {
    const gorunur = new Set(formData.getAll("gorunur").map(String));
    const gizli = SUTUNLAR.map((s) => s.anahtar).filter((a) => !gorunur.has(a));
    jar.set(SUTUN_CEREZI, gizliSutunCerezi(SUTUNLAR, gizli), {
      path: SUTUN_YOLU,
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      httpOnly: true,
    });
  }
  redirect(guvenliDonus(SUTUN_YOLU, donus));
}
