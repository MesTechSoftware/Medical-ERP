import type { Prisma } from "@/generated/prisma/client";
import type { Role } from "@/generated/prisma/enums";

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
  | { allowed: false; kuralKodu: "DOKTOR_PASIF" | "DOKTOR_SAHIPSIZ" | "DOKTOR_KAPSAM_DISI" };

/**
 * Bir satıcının, verilen doktora sipariş açıp açamayacağını belirler.
 * Saf fonksiyon: DB'ye dokunmaz, böylece kural birim testle korunur.
 */
export function canSellerOrderForDoctor(
  sellerId: string,
  doctor: { ownerSellerId: string | null; status: "AKTIF" | "PASIF" }
): OwnershipCheck {
  if (doctor.status !== "AKTIF") {
    return { allowed: false, kuralKodu: "DOKTOR_PASIF" };
  }
  if (doctor.ownerSellerId === null) {
    // FR-08: sahipsiz havuz.
    return { allowed: false, kuralKodu: "DOKTOR_SAHIPSIZ" };
  }
  if (doctor.ownerSellerId !== sellerId) {
    // RULE-02 / FR-04 — bildirim bilerek yalın: başka satıcının portföyü sızdırılmaz.
    return { allowed: false, kuralKodu: "DOKTOR_KAPSAM_DISI" };
  }
  return { allowed: true };
}

/**
 * `kapsamliDoktorlariGetir(kullanici)` — doktor okumasının kapsamı (D-2 §(3), X-13 §(1)).
 * Tek çağrı noktası listesinin 11. maddesi. Süzme **sorgudadır**: fonksiyon Prisma
 * `where` parçası döner, çağıran kendi süzgeciyle `AND` içinde birleştirir.
 *
 * - `SATICI` yalnız sahibi olduğu `DOKTOR` carilerini görür; `BAYI` göremez (X-8 §(3)).
 * - `YONETICI` ve `OPERASYON` bütün carileri görür.
 */
export function kapsamliDoktorlariGetir(kullanici: { id: string; role: Role }): Prisma.DoctorWhereInput {
  return kullanici.role === "SATICI" ? { ownerSellerId: kullanici.id, accountClass: "DOKTOR" } : {};
}
