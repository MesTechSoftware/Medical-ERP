"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSeller } from "@/lib/session";
import { tryNormalizePhone, formatPhone } from "@/lib/phone";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";

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

/** FR-03: satıcı doktor açar, sahiplik otomatik kendisine atanır. */
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

  let doctor;
  try {
    doctor = await prisma.$transaction(async (tx) => {
      const created = await tx.doctor.create({
        data: { ...parsed.data, ownerSellerId: sellerId },
      });
      // Devir geçmişinin ilk halkası (FR-06 raporlaması buna dayanır).
      await tx.doctorAssignment.create({
        data: {
          doctorId: created.id,
          sellerId,
          assignedBy: sellerId,
          reason: "İlk kayıt",
        },
      });
      return created;
    });
  } catch {
    // Yarış durumu: aynı anda iki istek aynı telefonu yazmaya çalıştıysa
    // UNIQUE kısıtı devreye girer — sessizce mükerrer oluşmaz.
    return { error: "Bu telefon numarası sistemde zaten kayıtlı." };
  }

  await createAuditLog({
    actorId: sellerId,
    action: AUDIT_ACTIONS.DOCTOR_CREATE,
    entityType: "Doctor",
    entityId: doctor.id,
    after: doctor,
  });

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

  const before = await prisma.doctor.findUnique({ where: { id } });
  if (!before || before.ownerSellerId !== sellerId) {
    return { error: "Bu doktor sizin portföyünüzde değil." };
  }

  let updated;
  try {
    updated = await prisma.doctor.update({ where: { id }, data: parsed.data });
  } catch {
    return { error: "Bu telefon numarası başka bir doktorda kayıtlı." };
  }

  await createAuditLog({
    actorId: sellerId,
    action: AUDIT_ACTIONS.DOCTOR_UPDATE,
    entityType: "Doctor",
    entityId: id,
    before,
    after: updated,
  });

  revalidatePath("/my-doctors");
  redirect("/my-doctors");
}
