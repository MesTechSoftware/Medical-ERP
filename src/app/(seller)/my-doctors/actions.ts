"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSeller } from "@/lib/session";
import { tryNormalizePhone, formatPhone } from "@/lib/phone";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";
import { degistirDoktorSahibi } from "@/lib/sahiplik";
import { kapsamliDoktorlariGetir } from "@/lib/doctor";
import { benzersizIhlali } from "@/lib/hata";

export type DoctorFormState = { error?: string };

function parseDoctorForm(formData: FormData) {
  const fullName = (formData.get("fullName") as string)?.trim();
  const clinic = (formData.get("clinic") as string)?.trim();
  const region = (formData.get("region") as string)?.trim();
  const rawPhone = (formData.get("phone") as string)?.trim();

  // FR-01: ad-soyad + klinik + bölge + telefon zorunlu (D-04).
  if (!fullName) return { error: "Doktor adı zorunludur." as const };
  if (!clinic) return { error: "Klinik/kurum zorunludur." as const };
  if (!region) return { error: "Bölge zorunludur." as const };

  // 🔴 FR-09: telefon kanonik biçime indirgenir; benzersizlik bunun üzerinden.
  const phoneNormalized = tryNormalizePhone(rawPhone ?? "");
  if (!phoneNormalized) {
    return {
      error:
        "Geçerli bir telefon numarası giriniz (örn. 0532 123 45 67)." as const,
    };
  }

  return {
    data: {
      fullName,
      clinic,
      region,
      phoneNormalized,
      title: ((formData.get("title") as string) || "").trim() || null,
      specialty: ((formData.get("specialty") as string) || "").trim() || null,
      city: ((formData.get("city") as string) || "").trim() || null,
      email: ((formData.get("email") as string) || "").trim() || null,
    },
  };
}

/**
 * FR-03: satıcı doktor açar, sahiplik otomatik kendisine atanır (X-17 §(7)).
 * Satıcının açtığı cari daima `DOKTOR`'dur; `BAYI` açma yetkisi 1B madde 3'tedir (X-8 §(3)).
 */
export async function createDoctor(
  _prev: DoctorFormState,
  formData: FormData
): Promise<DoctorFormState> {
  const session = await requireSeller();
  const sellerId = session.user.id;

  const parsed = parseDoctorForm(formData);
  if (parsed.error) return { error: parsed.error };

  // Mükerrer kontrolü: kanonik telefon zaten varsa kaydı REDDET (FR-09).
  const existing = await prisma.doctor.findUnique({
    where: { phoneNormalized: parsed.data.phoneNormalized },
    select: { id: true, ownerSellerId: true },
  });
  if (existing) {
    // Başka satıcının portföyündeyse kimliğini sızdırma.
    return {
      error:
        existing.ownerSellerId === sellerId
          ? `Bu telefon numarası (${formatPhone(parsed.data.phoneNormalized)}) zaten kendi portföyünüzde kayıtlı.`
          : `Bu telefon numarası (${formatPhone(parsed.data.phoneNormalized)}) sistemde zaten kayıtlı. Yöneticinize başvurun.`,
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const created = await tx.doctor.create({
        data: { ...parsed.data, accountClass: "DOKTOR" },
      });
      // Sahiplik yalnız tek noktadan yazılır; açılıştaki atama da iz satırıdır (X-17 §(1)/(3)).
      const sonuc = await degistirDoktorSahibi(
        [created.id],
        sellerId,
        { metin: "İlk kayıt", yapanId: sellerId },
        tx
      );
      // Oturumdaki satıcı aktiftir; HATA burada beklenmez — teknik hatadır.
      if (sonuc.durum === "HATA") throw new Error(sonuc.kuralKodu);
      await createAuditLog(
        {
          actorId: sellerId,
          action: AUDIT_ACTIONS.DOCTOR_CREATE,
          entityType: "Doctor",
          entityId: created.id,
          after: await tx.doctor.findUniqueOrThrow({ where: { id: created.id } }),
        },
        tx
      );
    });
  } catch (e) {
    // Yarış durumu: aynı anda iki istek aynı telefonu yazmaya çalıştıysa
    // UNIQUE kısıtı devreye girer — sessizce mükerrer oluşmaz. Gerisi teknik hatadır (X-3 §(4)).
    if (benzersizIhlali(e)) return { error: "Bu telefon numarası sistemde zaten kayıtlı." };
    throw e;
  }

  revalidatePath("/my-doctors");
  redirect("/my-doctors");
}

/** Satıcı yalnızca KENDİ doktorunu düzenleyebilir (FR-05). */
export async function updateDoctor(
  id: string,
  _prev: DoctorFormState,
  formData: FormData
): Promise<DoctorFormState> {
  const session = await requireSeller();
  const sellerId = session.user.id;

  const parsed = parseDoctorForm(formData);
  if (parsed.error) return { error: parsed.error };

  // Kapsam dışındaki cari bulunmamış gibi davranır (X-13 §(1), X-3 §(8)).
  const before = await prisma.doctor.findFirst({
    where: { AND: [kapsamliDoktorlariGetir(session.user), { id }] },
  });
  if (!before) {
    return { error: "Bu doktor sizin portföyünüzde değil." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.doctor.update({ where: { id }, data: parsed.data });
      await createAuditLog(
        {
          actorId: sellerId,
          action: AUDIT_ACTIONS.DOCTOR_UPDATE,
          entityType: "Doctor",
          entityId: id,
          before,
          after: updated,
        },
        tx
      );
    });
  } catch (e) {
    if (benzersizIhlali(e)) return { error: "Bu telefon numarası başka bir doktorda kayıtlı." };
    throw e;
  }

  revalidatePath("/my-doctors");
  redirect("/my-doctors");
}
