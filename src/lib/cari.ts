import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";
import { IsHatasi } from "@/lib/hata";
import { tryNormalizePhone } from "@/lib/phone";
import { degistirDoktorSahibi } from "@/lib/sahiplik";
import { sert, type Bildirim } from "@/lib/sonuc";
import { creditLimitSchema } from "@/lib/validation";

/**
 * Cari — `YONETICI`'nin cari açma ve düzeltme akışı (X-8, A-13, X-10, X-15, X-17 §(7)). Bu dosyadaki
 * girdi tanımı **tek tanımdır** (X-16 §(1), ADR-006 §1): `CARI` içe aktarımı (1B-7f) aynı şemadan
 * geçer; import'a özgü kural yazılmaz. Ekran ile import'un farkı yalnız çözümleyicilerdir
 * (satıcı e-postası → id, liste kodu → id).
 */

/** A-13 §(3): hane sayısı belirler — 10 VKN, 11 TCKN; kontrol hanesi tutmalı. GİB sorgusu yoktur. */
export function vergiKimligiGecerliMi(deger: string): boolean {
  if (!/^\d{10,11}$/.test(deger)) return false;
  const d = [...deger].map((c) => c.charCodeAt(0) - 48);
  if (d.length === 10) {
    let toplam = 0;
    for (let i = 0; i < 9; i++) {
      const t = (d[i] + 9 - i) % 10;
      let v = (t * 2 ** (9 - i)) % 9;
      if (t !== 0 && v === 0) v = 9;
      toplam += v;
    }
    return (10 - (toplam % 10)) % 10 === d[9];
  }
  if (d[0] === 0) return false;
  const tek = d[0] + d[2] + d[4] + d[6] + d[8];
  const cift = d[1] + d[3] + d[5] + d[7];
  if ((((tek * 7 - cift) % 10) + 10) % 10 !== d[9]) return false;
  return d.slice(0, 10).reduce((a, b) => a + b, 0) % 10 === d[10];
}

const metin = z.string().trim().transform((s) => (s === "" ? null : s));
const istege = metin.nullable().optional().transform((s) => s ?? null);

/** Açılışta ve düzeltmede ortak alanlar (hesap sınıfı ve sahip açılışa özgüdür). */
const ORTAK = {
  fullName: z.string().trim(),
  title: istege,
  specialty: istege,
  clinic: istege,
  region: istege,
  city: istege,
  email: istege,
  phone: z.string(),
  priceListId: istege,
  paymentTermDays: istege,
  creditLimit: istege,
  partyType: z.enum(["TUZEL_KISI", "GERCEK_KISI"]),
  taxId: istege,
  invoiceTitle: istege,
  taxOffice: istege,
  invoiceAddress: istege,
  invoiceDistrict: istege,
  invoiceCity: istege,
  accountingCode: istege,
};

export const CARI_ACMA_SEMASI = z.object({
  // X-16 §(8): seçili gelmez, varsayılanı yoktur.
  accountClass: z.enum(["DOKTOR", "BAYI"]).optional(),
  /** Sorumlu satıcı; yazımı `degistirDoktorSahibi()`'dir (X-17 §(1)). */
  sorumluSaticiId: istege,
  ...ORTAK,
});
export const CARI_DUZELTME_SEMASI = z.object(ORTAK);

export type CariAcmaGirdisi = z.input<typeof CARI_ACMA_SEMASI>;
export type CariDuzeltmeGirdisi = z.input<typeof CARI_DUZELTME_SEMASI>;

type Ortak = z.output<typeof CARI_DUZELTME_SEMASI>;

/**
 * Satır kuralları: zorunluluklar (X-15 §(3) klinik/bölge `DOKTOR`'da), telefon (X-15 §(2)), vergi
 * kimliği (A-13 §(3)), e-posta, vade ve kredi limiti. Bildirimler alanına bağlıdır, hepsi birlikte döner.
 */
function ortakDenetle(v: Ortak, sinif: "DOKTOR" | "BAYI" | undefined, hatalar: Bildirim[]) {
  if (!v.fullName) hatalar.push(sert("ALAN_ZORUNLU", {}, "fullName"));
  if (sinif === "DOKTOR") {
    if (!v.clinic) hatalar.push(sert("ALAN_ZORUNLU", {}, "clinic"));
    if (!v.region) hatalar.push(sert("ALAN_ZORUNLU", {}, "region"));
  }
  const telefon = tryNormalizePhone(v.phone.trim());
  if (!telefon) hatalar.push(sert("GECERSIZ_TELEFON", {}, "phone"));
  if (v.taxId && !vergiKimligiGecerliMi(v.taxId)) hatalar.push(sert("VERGI_KIMLIGI_GECERSIZ", {}, "taxId"));
  if (v.email && !z.string().email().safeParse(v.email).success) hatalar.push(sert("GECERSIZ_EPOSTA", {}, "email"));
  const vade = v.paymentTermDays === null ? null : /^\d{1,4}$/.test(v.paymentTermDays) ? parseInt(v.paymentTermDays, 10) : NaN;
  if (Number.isNaN(vade)) hatalar.push(sert("GECERSIZ_MIKTAR", {}, "paymentTermDays"));
  const limit = v.creditLimit === null ? null : creditLimitSchema.safeParse(v.creditLimit);
  if (limit && !limit.success) hatalar.push(sert("GECERSIZ_TUTAR", {}, "creditLimit"));
  return {
    telefon,
    veri: {
      fullName: v.fullName,
      title: v.title,
      specialty: v.specialty,
      clinic: v.clinic,
      region: v.region,
      city: v.city,
      email: v.email,
      priceListId: v.priceListId,
      paymentTermDays: vade,
      creditLimit: limit?.success ? limit.data : null,
      partyType: v.partyType,
      taxId: v.taxId,
      invoiceTitle: v.invoiceTitle,
      taxOffice: v.taxOffice,
      invoiceAddress: v.invoiceAddress,
      invoiceDistrict: v.invoiceDistrict,
      invoiceCity: v.invoiceCity,
      accountingCode: v.accountingCode,
    },
  };
}

async function listeVarMi(tx: Prisma.TransactionClient, id: string | null, hatalar: Bildirim[]) {
  if (id && !(await tx.priceList.findUnique({ where: { id }, select: { id: true } }))) {
    hatalar.push(sert("FIYAT_LISTESI_BULUNAMADI", {}, "priceListId"));
  }
}

/** Değişen alan adları — A-13 §(7): kimlik ve adres değişikliği loglanır, değer log'a yazılmaz. */
function degisenAlanlar(once: Record<string, unknown>, sonra: Record<string, unknown>): string[] {
  const s = (x: unknown) => (x === null || x === undefined ? null : String(x));
  return Object.keys(sonra).filter((k) => s(once[k]) !== s(sonra[k]));
}

/** Yazılmaya hazır, denetlenmiş cari. */
export type DenetlenmisCari = {
  veri: ReturnType<typeof ortakDenetle>["veri"];
  sinif: "DOKTOR" | "BAYI";
  telefon: string;
  sorumluSaticiId: string | null;
};

/**
 * Cari açmanın satır kuralları — hiçbir şey yazmaz. Elle açma ve `CARI` içe aktarımı aynı denetimden
 * geçer (X-16 §(1)); dosya içi tekillik içe aktarımın küme kuralıdır, burada yalnız veritabanına bakılır.
 */
export async function cariAcmaDenetle(
  db: Prisma.TransactionClient,
  girdi: CariAcmaGirdisi
): Promise<{ hatalar: Bildirim[]; cari: DenetlenmisCari | null }> {
  const v = CARI_ACMA_SEMASI.parse(girdi);
  const hatalar: Bildirim[] = [];
  if (!v.accountClass) hatalar.push(sert("ALAN_ZORUNLU", {}, "accountClass"));
  // X-17 §(7), X-8 §(3): BAYI'nin sahibi olmaz; DOKTOR'un sahibi aktif SATICI olmalı.
  if (v.accountClass === "BAYI" && v.sorumluSaticiId) hatalar.push(sert("BAYI_SAHIP_ATANAMAZ", {}, "ownerSellerId"));
  else if (v.sorumluSaticiId) {
    const s = await db.user.findUnique({ where: { id: v.sorumluSaticiId }, select: { role: true, isActive: true } });
    if (!s || s.role !== "SATICI" || !s.isActive) hatalar.push(sert("SAHIP_AKTIF_SATICI_DEGIL", {}, "ownerSellerId"));
  }
  const { telefon, veri } = ortakDenetle(v, v.accountClass, hatalar);
  await listeVarMi(db, veri.priceListId, hatalar);
  if (telefon && (await db.doctor.findUnique({ where: { phoneNormalized: telefon }, select: { id: true } }))) {
    hatalar.push(sert("TELEFON_KAYITLI", { telefon: v.phone.trim(), portfoyunuzde: 0 }, "phone"));
  }
  if (hatalar.length > 0 || !v.accountClass || !telefon) return { hatalar, cari: null };
  return { hatalar, cari: { veri, sinif: v.accountClass, telefon, sorumluSaticiId: v.sorumluSaticiId } };
}

/** Denetlenmiş cariyi yazar: kayıt, sahiplik (tek yazma noktası, X-17 §(1)) ve denetim kaydı. */
export async function cariAcmaYaz(
  tx: Prisma.TransactionClient,
  c: DenetlenmisCari,
  yapan: { id: string; gerekce: string; partiId?: string }
): Promise<{ id: string }> {
  const cari = await tx.doctor.create({
    data: { ...c.veri, accountClass: c.sinif, phoneNormalized: c.telefon, importBatchId: yapan.partiId ?? null },
  });
  if (c.sorumluSaticiId) {
    const s = await degistirDoktorSahibi([cari.id], c.sorumluSaticiId, { metin: yapan.gerekce, yapanId: yapan.id }, tx);
    if (s.durum === "HATA") throw new IsHatasi([sert(s.kuralKodu, {}, "ownerSellerId")]);
  }
  await createAuditLog(
    {
      actorId: yapan.id,
      action: AUDIT_ACTIONS.DOCTOR_CREATE,
      entityType: "Doctor",
      entityId: cari.id,
      after: { ...cari, degisenAlanlar: degisenAlanlar({}, c.veri) },
    },
    tx
  );
  return { id: cari.id };
}

/** Yöneticinin elle cari açması: denetle → yaz. */
export async function cariAc(
  tx: Prisma.TransactionClient,
  girdi: CariAcmaGirdisi,
  yapanId: string
): Promise<{ id: string }> {
  const { hatalar, cari } = await cariAcmaDenetle(tx, girdi);
  if (!cari) throw new IsHatasi(hatalar);
  return cariAcmaYaz(tx, cari, { id: yapanId, gerekce: "İlk kayıt" });
}

/** Düzeltme (X-16 §(9)): hesap sınıfı değişmez (X-17 §(2)), sahip devirle değişir (X-13 §(5)). */
export async function cariDuzelt(
  tx: Prisma.TransactionClient,
  id: string,
  girdi: CariDuzeltmeGirdisi,
  yapanId: string
): Promise<void> {
  const v = CARI_DUZELTME_SEMASI.parse(girdi);
  const once = await tx.doctor.findUnique({ where: { id } });
  if (!once) throw new IsHatasi([sert("DOKTOR_KAPSAM_DISI")]);
  const hatalar: Bildirim[] = [];
  const { telefon, veri } = ortakDenetle(v, once.accountClass, hatalar);
  await listeVarMi(tx, veri.priceListId, hatalar);
  if (telefon && telefon !== once.phoneNormalized) {
    if (await tx.doctor.findUnique({ where: { phoneNormalized: telefon }, select: { id: true } })) {
      hatalar.push(sert("TELEFON_KAYITLI", { telefon: v.phone.trim(), portfoyunuzde: 0 }, "phone"));
    }
  }
  if (hatalar.length > 0 || !telefon) throw new IsHatasi(hatalar);

  const sonra = await tx.doctor.update({ where: { id }, data: { ...veri, phoneNormalized: telefon } });
  const degisen = degisenAlanlar(once, { ...veri, phoneNormalized: telefon });
  if (degisen.length === 0) return;
  await createAuditLog(
    {
      actorId: yapanId,
      action: AUDIT_ACTIONS.DOCTOR_UPDATE,
      entityType: "Doctor",
      entityId: id,
      before: once,
      after: { ...sonra, degisenAlanlar: degisen },
    },
    tx
  );
}

/**
 * Eksik fatura bilgisi (A-13 §(5)) — bilgi kademesidir, kaydı engellemez. Tanım: VKN/TCKN boş, ya da
 * fatura adresi veya ili boş, ya da tüzel kişide vergi dairesi boş. Ünvan boşsa ad-soyad
 * kullanıldığı için (§(4)) eksik sayılmaz. Liste süzgeci ve dışa aktarım uyarısı bu tanımı kullanır.
 */
export const EKSIK_FATURA_BILGISI: Prisma.DoctorWhereInput = {
  OR: [
    { taxId: null },
    { invoiceAddress: null },
    { invoiceCity: null },
    { partyType: "TUZEL_KISI", taxOffice: null },
  ],
};
