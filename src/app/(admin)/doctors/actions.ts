"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { cariAc, cariDuzelt } from "@/lib/cari";
import { tersKayitYaz, vadeFarkiYaz } from "@/lib/cari-hareket";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";
import { amountSchema } from "@/lib/validation";
import { benzersizIhlali, IsHatasi } from "@/lib/hata";
import { requireAdmin } from "@/lib/session";
import { degistirDoktorSahibi } from "@/lib/sahiplik";
import { basarili, engel, sert, sonucOlustur, type IslemSonucu } from "@/lib/sonuc";

/**
 * FR-06 / X-13 §(5): yönetici doktorları başka satıcıya devreder; gerekçe zorunlu, iz tutulur.
 * FR-07: geçmiş siparişler ESKİ satıcıda kalır — `Order.sellerId`'ye dokunulmaz.
 * Toplu devir (X-17 §(4)): cari listesinden çoklu seçim, gerekçe bir kez. Sahiplik, izi ve
 * denetim kaydı `degistirDoktorSahibi()` ile aynı transaction'da yazılır (X-17 §(1)/(3)).
 */
export async function transferDoctor(
  _prev: unknown,
  formData: FormData
): Promise<IslemSonucu> {
  const session = await requireAdmin();

  const doctorIds = formData.getAll("doctorId").map((v) => String(v).trim()).filter(Boolean);
  const newSellerId = (formData.get("sellerId") as string)?.trim();
  const reason = ((formData.get("reason") as string) || "").trim();

  if (doctorIds.length === 0) return engel("DEVIR_DOKTOR_SECILMEDI");
  if (!reason) return engel("GEREKCE_ZORUNLU", {}, "reason");

  // Boş seçim = sahipsiz bırak (X-17 §(5)).
  const targetSellerId = newSellerId || null;

  const sonuc = await prisma.$transaction((tx) =>
    degistirDoktorSahibi(doctorIds, targetSellerId, { metin: reason, yapanId: session.user.id }, tx)
  );
  if (sonuc.durum === "HATA") return engel(sonuc.kuralKodu, {}, "sellerId");
  if (sonuc.degisen === 0) return engel("DEVIR_DEGISIKLIK_YOK");

  revalidatePath("/doctors");
  return basarili({ degisen: sonuc.degisen });
}

const CARI_ALANLARI = [
  "fullName", "title", "specialty", "clinic", "region", "city", "email", "phone", "priceListId",
  "paymentTermDays", "creditLimit", "partyType", "taxId", "invoiceTitle", "taxOffice", "invoiceAddress",
  "invoiceDistrict", "invoiceCity", "accountingCode",
] as const;

function cariFormu(formData: FormData) {
  return Object.fromEntries(CARI_ALANLARI.map((a) => [a, String(formData.get(a) ?? "")])) as Record<
    (typeof CARI_ALANLARI)[number],
    string
  >;
}

/**
 * Cari açma (X-8 §(5), X-16 §(1)): yalnız `YONETICI`; `BAYI` de buradan açılır. Hesap sınıfı seçilmeden
 * kayıt yapılmaz (X-16 §(8)). Kural tek tanımdadır: `cariAc()` (`src/lib/cari.ts`).
 */
export async function createCari(_prev: unknown, formData: FormData): Promise<IslemSonucu> {
  const session = await requireAdmin();
  const sinif = String(formData.get("accountClass") ?? "");
  let id: string;
  try {
    ({ id } = await prisma.$transaction((tx) =>
      cariAc(
        tx,
        {
          ...cariFormu(formData),
          partyType: formData.get("partyType") === "GERCEK_KISI" ? "GERCEK_KISI" : "TUZEL_KISI",
          accountClass: sinif === "DOKTOR" || sinif === "BAYI" ? sinif : undefined,
          sorumluSaticiId: String(formData.get("ownerSellerId") ?? ""),
        },
        session.user.id
      )
    ));
  } catch (e) {
    if (e instanceof IsHatasi) return e.sonuc;
    if (benzersizIhlali(e)) return engel("TELEFON_KAYITLI", { telefon: String(formData.get("phone") ?? ""), portfoyunuzde: 0 }, "phone");
    throw e;
  }
  revalidatePath("/doctors");
  redirect(`/doctors/${id}`);
}

/** Cari düzeltme (X-16 §(9), A-13 §(7)): yalnız `YONETICI`; hesap sınıfı ve sahip burada değişmez. */
export async function updateCari(id: string, _prev: unknown, formData: FormData): Promise<IslemSonucu> {
  const session = await requireAdmin();
  try {
    await prisma.$transaction((tx) =>
      cariDuzelt(
        tx,
        id,
        { ...cariFormu(formData), partyType: formData.get("partyType") === "GERCEK_KISI" ? "GERCEK_KISI" : "TUZEL_KISI" },
        session.user.id
      )
    );
  } catch (e) {
    if (e instanceof IsHatasi) return e.sonuc;
    if (benzersizIhlali(e)) return engel("TELEFON_KAYITLI", { telefon: String(formData.get("phone") ?? ""), portfoyunuzde: 0 }, "phone");
    throw e;
  }
  revalidatePath("/doctors");
  revalidatePath(`/doctors/${id}`);
  redirect(`/doctors/${id}`);
}

/** `YYYY-AA-GG` → `date` kolonu (UTC gece yarısı, E-1 §(1)); geçersizse `null`. */
function gunOku(metin: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(metin)) return null;
  const d = new Date(`${metin}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== metin ? null : d;
}

/**
 * Vade farkı (A-7): yalnız elle, yalnız `YONETICI`; tutar (KDV kırılımsız), vade ve gerekçe zorunlu.
 * Hareket `VDF` numarasıyla `cari-hareket.ts`'ten yazılır; gerekçe denetim kaydındadır.
 */
export async function addVadeFarki(doctorId: string, _prev: unknown, formData: FormData): Promise<IslemSonucu> {
  const session = await requireAdmin();
  const tutar = amountSchema.safeParse(String(formData.get("amount") ?? ""));
  const vade = gunOku(String(formData.get("dueDate") ?? "").trim());
  const gerekce = String(formData.get("reason") ?? "").trim();
  const hatalar = [
    ...(tutar.success ? [] : [sert("GECERSIZ_TUTAR", {}, "amount")]),
    ...(vade ? [] : [sert("GECERSIZ_TARIH", {}, "dueDate")]),
    ...(gerekce ? [] : [sert("GEREKCE_ZORUNLU", {}, "reason")]),
  ];
  if (!tutar.success || !vade || !gerekce) return sonucOlustur(hatalar);
  const doktor = await prisma.doctor.findUnique({ where: { id: doctorId }, select: { id: true } });
  if (!doktor) return engel("DOKTOR_KAPSAM_DISI");

  const h = await prisma.$transaction(async (tx) => {
    const h = await vadeFarkiYaz(tx, { doctorId, tutar: tutar.data, vade, yapanId: session.user.id });
    await createAuditLog(
      {
        actorId: session.user.id,
        action: AUDIT_ACTIONS.LATE_FEE_CREATE,
        entityType: "LedgerEntry",
        entityId: h.id,
        after: { documentNo: h.documentNo, doctorId, amount: tutar.data, dueDate: vade, reason: gerekce },
      },
      tx
    );
    return h;
  });
  revalidatePath(`/doctors/${doctorId}`);
  return basarili({ documentNo: h.documentNo });
}

/**
 * Elle ters kayıt (X-11 §(5), X-16 §(10)): yalnız `ACILIS` ve `VADE_FARKI` — kaynaksız hareketlerin tek
 * düzeltme yolu. Diğer tipler kendi belgesiyle düzeltilir. Bir satır bir kez çevrilir (DB `UNIQUE`).
 */
export async function reverseLedgerEntry(entryId: string, _prev: unknown, formData: FormData): Promise<IslemSonucu> {
  const session = await requireAdmin();
  const gerekce = String(formData.get("reason") ?? "").trim();
  if (!gerekce) return engel("GEREKCE_ZORUNLU", {}, "reason");
  const h = await prisma.ledgerEntry.findUnique({ where: { id: entryId }, include: { reversal: { select: { id: true } } } });
  if (!h) return engel("CARI_HAREKET_BULUNAMADI");
  if (h.type !== "ACILIS" && h.type !== "VADE_FARKI") return engel("TERS_KAYIT_UYGUN_DEGIL");
  if (h.reversal) return engel("TERS_KAYIT_VAR");
  try {
    await prisma.$transaction(async (tx) => {
      const ters = await tersKayitYaz(tx, entryId, session.user.id);
      await createAuditLog(
        {
          actorId: session.user.id,
          action: AUDIT_ACTIONS.LEDGER_REVERSAL,
          entityType: "LedgerEntry",
          entityId: entryId,
          after: { tersKayitId: ters.id, documentNo: h.documentNo, reason: gerekce },
        },
        tx
      );
    });
  } catch (e) {
    if (benzersizIhlali(e)) return engel("TERS_KAYIT_VAR");
    throw e;
  }
  revalidatePath(`/doctors/${h.doctorId}`);
  return basarili();
}
