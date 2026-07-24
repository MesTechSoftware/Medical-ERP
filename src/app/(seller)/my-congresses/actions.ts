"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSeller } from "@/lib/session";
import { formatTRY } from "@/lib/money";
import { canSellerOrderForDoctor } from "@/lib/doctor";
import { reserveBalance } from "@/lib/congress-service";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";

export type RegistrationState = { error?: string; ok?: string };

/**
 * FR-53: Satıcı KENDİ doktorunu bir pakete kaydeder.
 *   bakiye kontrolü → TALEP (bakiye REZERVE edilir) → admin onayı.
 *
 * FR-54 / D-12: bakiye yetmezse kayıt SERT ŞEKİLDE reddedilir; eksik tutar
 * gösterilir. Sistem üzerinden fark ödemesi YAPILAMAZ.
 * RULE-09: rezervasyon gerçek tüketimdir — aynı bakiye ikinci pakete gitmez.
 */
export async function requestRegistration(
  _prev: RegistrationState,
  formData: FormData
): Promise<RegistrationState> {
  const session = await requireSeller();
  const sellerId = session.user.id;

  const packageId = (formData.get("packageId") as string)?.trim();
  const doctorId = (formData.get("doctorId") as string)?.trim();
  if (!packageId || !doctorId) return { error: "Doktor ve paket seçiniz." };

  const [pkg, doctor] = await Promise.all([
    prisma.congressPackage.findUnique({
      where: { id: packageId },
      include: { congress: true },
    }),
    prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { id: true, ownerSellerId: true, status: true },
    }),
  ]);
  if (!pkg) return { error: "Paket bulunamadı." };
  if (!doctor) return { error: "Doktor bulunamadı." };

  // FR-05/RULE-02: satıcı yalnızca KENDİ doktorunu kaydedebilir.
  const ownership = canSellerOrderForDoctor(sellerId, doctor);
  if (!ownership.allowed) return { error: ownership.reason };

  if (pkg.congress.status !== "YAYINDA") {
    return { error: "Bu kongre kayıtlara açık değil." };
  }
  if (
    pkg.congress.registrationDeadline &&
    pkg.congress.registrationDeadline < new Date()
  ) {
    return { error: "Kongre son kayıt tarihi geçmiş." };
  }

  // Aynı doktoru aynı pakete iki kez kaydetme.
  const duplicate = await prisma.congressRegistration.findFirst({
    where: { packageId, doctorId, status: { in: ["TALEP", "ONAYLANDI"] } },
  });
  if (duplicate) return { error: "Bu doktor bu pakete zaten kayıtlı." };

  // FR-55: kontenjan — rezerve edilmiş TALEP'ler de kontenjandan düşer.
  if (pkg.quota !== null) {
    const taken = await prisma.congressRegistration.count({
      where: { packageId, status: { in: ["TALEP", "ONAYLANDI"] } },
    });
    if (taken >= pkg.quota) return { error: "Paket kontenjanı dolu." };
  }

  let shortfall = 0n;
  let registrationId = "";
  try {
    registrationId = await prisma.$transaction(async (tx) => {
      const reg = await tx.congressRegistration.create({
        data: {
          packageId,
          doctorId,
          sellerId,
          reservedAmount: pkg.value,
          status: "TALEP",
        },
      });

      const result = await reserveBalance(
        tx,
        doctorId,
        pkg.value,
        reg.id,
        sellerId
      );
      if (!result.ok) {
        shortfall = result.shortfall;
        // Rezervasyon başarısız: transaction'ı geri al (kayıt da oluşmasın).
        throw new Error("INSUFFICIENT_BALANCE");
      }
      return reg.id;
    });
  } catch (e) {
    if (shortfall > 0n) {
      // FR-54 / D-12: sert red + eksik tutar bilgisi.
      return {
        error:
          `Doktorun kongre bakiyesi yetersiz. Eksik tutar: ${formatTRY(shortfall)}. ` +
          `Sistem üzerinden fark ödemesi yapılamaz; doktorun ayrıca iletişime geçmesi gerekir.`,
      };
    }
    return {
      error: e instanceof Error ? e.message : "Kayıt talebi oluşturulamadı.",
    };
  }

  await createAuditLog({
    actorId: sellerId,
    action: AUDIT_ACTIONS.CONGRESS_REGISTRATION_REQUEST,
    entityType: "CongressRegistration",
    entityId: registrationId,
    after: { packageId, doctorId, reservedAmount: pkg.value },
  });

  revalidatePath("/my-congresses");
  return { ok: "Kayıt talebi oluşturuldu; bakiye rezerve edildi." };
}
