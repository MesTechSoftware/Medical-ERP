/**
 * Doktor sahipliği kuralları — TEK KAYNAK.
 *
 * RULE-02: Bir doktora aynı anda yalnızca bir satıcı sahiptir.
 * FR-04: Satıcı, sahibi olmadığı doktora sipariş oluşturamaz (sunucu tarafı).
 * FR-08: Satıcı pasifleşince doktorları sahipsiz havuza düşer; yeniden
 *        atanana kadar o doktora sipariş girilemez.
 */

/** Sipariş girilebilirlik sonucu; engelliyse kullanıcıya gösterilecek sebep. */
export type OwnershipCheck =
  | { allowed: true }
  | { allowed: false; reason: string };

/**
 * Bir satıcının, verilen doktora sipariş açıp açamayacağını belirler.
 * Saf fonksiyon: DB'ye dokunmaz, böylece kural birim testle korunur.
 */
export function canSellerOrderForDoctor(
  sellerId: string,
  doctor: { ownerSellerId: string | null; status: "ACTIVE" | "PASSIVE" }
): OwnershipCheck {
  if (doctor.status !== "ACTIVE") {
    return { allowed: false, reason: "Doktor kaydı pasif durumda." };
  }
  if (doctor.ownerSellerId === null) {
    // FR-08: sahipsiz havuz.
    return {
      allowed: false,
      reason:
        "Bu doktorun sorumlu satıcısı yok. Yönetici bir satıcıya atayana kadar sipariş girilemez.",
    };
  }
  if (doctor.ownerSellerId !== sellerId) {
    // RULE-02 / FR-04 — mesaj bilerek yalın: başka satıcının portföyü sızdırılmaz.
    return { allowed: false, reason: "Bu doktor sizin portföyünüzde değil." };
  }
  return { allowed: true };
}

/**
 * Satıcının göreceği doktorları sınırlayan Prisma `where` parçası (FR-05).
 * Admin tümünü görür; satıcı yalnızca kendi portföyünü.
 */
export function doctorScopeFor(user: {
  id: string;
  role: string;
}): { ownerSellerId?: string } {
  return user.role === "ADMIN" ? {} : { ownerSellerId: user.id };
}
