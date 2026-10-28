"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/session";
import { SUTUNLAR, SUTUN_CEREZI, gizliSutunCerezi, guvenliDonus } from "@/lib/doktor-listesi/sutunlar";

/**
 * Cari listesinin sütun tercihi (spec Ü-18 §3.4): görünür bırakılmayan sütunlar çereze yazılır; sayfa
 * sunucuda okur. İş kaydı değildir, denetim kaydına yazılmaz. "Varsayılana dön" çerezi siler.
 */
export async function sutunlariKaydet(formData: FormData): Promise<void> {
  await requireStaff();
  const donus = String(formData.get("donus") ?? "");
  const jar = await cookies();
  if (formData.get("islem") === "varsayilan") {
    jar.delete({ name: SUTUN_CEREZI, path: "/doctors" });
  } else {
    const gorunur = new Set(formData.getAll("gorunur").map(String));
    const gizli = SUTUNLAR.map((s) => s.anahtar).filter((a) => !gorunur.has(a));
    jar.set(SUTUN_CEREZI, gizliSutunCerezi(gizli), {
      path: "/doctors",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      httpOnly: true,
    });
  }
  redirect(guvenliDonus(donus));
}
