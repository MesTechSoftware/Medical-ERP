"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { homeFor } from "@/lib/roles";
import { requireAdmin, requireSeller, requireSession, requireStaff } from "@/lib/session";
import { gizliSutunCerezi, guvenliDonus } from "@/lib/liste/sutunlar";
import { SUTUN_LISTELERI, sutunluListeMi, type SutunluListe } from "@/lib/liste/sutun-listeleri";

/** Tercihi kaydetme yetkisi: listeyi görebilen rol (sayfanın kendi guard'ı). */
const YETKI: Record<SutunluListe, () => Promise<unknown>> = {
  "/approvals": requireAdmin,
  "/audit-logs": requireAdmin,
  "/collections": requireStaff,
  "/doctors": requireStaff,
  "/imports": requireAdmin,
  "/orders": requireStaff,
  "/price-lists": requireAdmin,
  "/products": requireStaff,
  "/reports": requireAdmin,
  "/shipping": requireStaff,
  "/stock": requireStaff,
  "/users": requireStaff,
  "/my-doctors": requireSeller,
  "/my-orders": requireSeller,
};

/**
 * Liste ekranlarının sütun tercihi (spec Ü-18 §3.4): görünür bırakılmayan sütunlar ekranın çerezine,
 * ekranın yoluna yazılır; sayfa sunucuda okur. İş kaydı değildir, denetim kaydına yazılmaz. "Varsayılana
 * dön" çerezi siler. Yetki ekranın kendi guard'ıdır; bilinmeyen liste kullanıcının ana sayfasına düşer.
 */
export async function sutunlariKaydet(formData: FormData): Promise<void> {
  const liste = String(formData.get("liste") ?? "");
  if (!sutunluListeMi(liste)) {
    const session = await requireSession();
    redirect(homeFor(session.user.role));
  }
  await YETKI[liste]();
  const kayit = SUTUN_LISTELERI[liste];
  const jar = await cookies();
  if (formData.get("islem") === "varsayilan") {
    jar.delete({ name: kayit.cerez, path: liste });
  } else {
    const gorunur = new Set(formData.getAll("gorunur").map(String));
    const gizli = kayit.sutunlar.map((s) => s.anahtar).filter((a) => !gorunur.has(a));
    jar.set(kayit.cerez, gizliSutunCerezi(kayit.sutunlar, gizli), {
      path: liste,
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      httpOnly: true,
    });
  }
  redirect(guvenliDonus(liste, String(formData.get("donus") ?? "")));
}
