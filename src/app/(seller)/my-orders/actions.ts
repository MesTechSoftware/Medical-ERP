"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSeller } from "@/lib/session";
import { canSellerOrderForDoctor, kapsamliDoktorlariGetir } from "@/lib/doctor";
import { IsHatasi } from "@/lib/hata";
import { siparisAc, siparisSatirlariniOku } from "@/lib/siparis-giris";
import { engel, type IslemSonucu } from "@/lib/sonuc";


export async function createOrder(
  _prev: unknown,
  formData: FormData
): Promise<IslemSonucu> {
  const session = await requireSeller();
  const sellerId = session.user.id;

  const doctorId = (formData.get("doctorId") as string)?.trim();
  if (!doctorId) return engel("ALAN_ZORUNLU", {}, "doctorId");

  // 🔴 FR-04 / RULE-02: sahiplik SUNUCU TARAFINDA doğrulanır. Arayüzde yalnızca
  // kendi doktorları listelenir ama ham istek de aynı kapıdan geçmek zorunda.
  // Kapsam dışındaki cari bulunmamış gibi davranır; varlığı ima edilmez (X-13 §(1), X-3 §(8)).
  const doctor = await prisma.doctor.findFirst({
    where: { AND: [kapsamliDoktorlariGetir(session.user), { id: doctorId }] },
    select: { id: true, fullName: true, ownerSellerId: true, status: true, paymentTermDays: true },
  });
  if (!doctor) return engel("DOKTOR_KAPSAM_DISI", {}, "doctorId");

  const ownership = canSellerOrderForDoctor(sellerId, doctor);
  if (!ownership.allowed) return engel(ownership.kuralKodu, {}, "doctorId");

  const okunan = siparisSatirlariniOku(formData.get("items") as string | null);
  if ("hata" in okunan) return okunan.hata;

  try {
    await prisma.$transaction((tx) =>
      siparisAc(tx, {
        doktorId: doctorId,
        satirlar: okunan.satirlar,
        gerekce: ((formData.get("gerekce") as string) || "").trim() || null,
        yapan: { id: sellerId, rol: session.user.role },
      })
    );
  } catch (e) {
    // Yalnız iş hatası sonuca döner; teknik hata hata sınırına düşer (X-3 §(2)/(4), X-4 §(2)).
    if (e instanceof IsHatasi) return e.sonuc;
    throw e;
  }

  revalidatePath("/my-orders");
  revalidatePath("/products");
  revalidatePath("/stock");
  redirect("/my-orders");
}
