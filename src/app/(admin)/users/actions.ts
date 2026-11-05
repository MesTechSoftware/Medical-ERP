"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Role } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";
import { portfoyuDevret } from "@/lib/sahiplik";
import { kullaniciOturumlariniSonlandir } from "@/lib/oturum";
import { parolaHashle, parolaHatasi } from "@/lib/parola";
import { IsHatasi, benzersizIhlali } from "@/lib/hata";
import { eszamanlilikHatasi, pasiflestirmeEngeli, pasiflestirmeTxSecenekleri } from "@/lib/kullanici";
import { type IslemSonucu, engel, gerekceEngeli, sert, sonucOlustur } from "@/lib/sonuc";

/**
 * Kullanıcı yönetimi — E-2 §(1)/(3)/(6)/(7), 20.10.2026 eki. Yalnız `YONETICI`.
 * Açma, pasifleştirme ve parola sıfırlama yönetimsel eylemdir: gerekçe zorunludur ve denetim
 * kaydına yazılır; `OnayBlogu` kullanılmaz. Kullanıcı silinmez (E-2 §(6)) — silme yolu yoktur.
 *
 * `degerler`: hata dönüşünde kullanıcının seçimleri. React form action'dan sonra formu
 * sıfırlar; durum alanı `AKTIF`'e dönerse ikinci gönderim kullanıcıyı sessizce aktif bırakır.
 */
export type UserFormState = IslemSonucu & {
  degerler?: { status: string; portfoy: string; portfoyGerekce: string; gerekce: string; role?: string };
};

const ROLLER: readonly Role[] = ["SATICI", "OPERASYON", "YONETICI"];

export async function createUser(_prev: unknown, formData: FormData): Promise<UserFormState> {
  const session = await requireAdmin();

  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const phone = ((formData.get("phone") as string) || "").trim() || null;
  const password = (formData.get("password") as string) || "";
  const role = formData.get("role") as Role;
  const gerekce = ((formData.get("gerekce") as string) || "").trim();
  const degerler = { status: "AKTIF", portfoy: "", portfoyGerekce: "", gerekce, role };

  if (!name) return { ...engel("ALAN_ZORUNLU", {}, "name"), degerler };
  if (!email) return { ...engel("ALAN_ZORUNLU", {}, "email"), degerler };
  if (!ROLLER.includes(role)) return { ...engel("ALAN_ZORUNLU", {}, "role"), degerler };
  const parolaHata = parolaHatasi(password, "password");
  if (parolaHata) return { ...sonucOlustur([parolaHata]), degerler };
  const gerekceSonucu = gerekceEngeli(gerekce, "gerekce");
  if (gerekceSonucu) return { ...gerekceSonucu, degerler };

  const passwordHash = await parolaHashle(password);
  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          phone,
          role,
          passwordHash,
          // Yöneticinin verdiği parola geçicidir (E-2 20.10 eki).
          mustChangePassword: true,
        },
      });
      await createAuditLog(
        {
          actorId: session.user.id,
          action: AUDIT_ACTIONS.USER_CREATE,
          entityType: "User",
          entityId: user.id,
          after: user, // passwordHash maskelenir (X-18 §(6))
          gerekce,
        },
        tx
      );
    });
  } catch (e) {
    if (benzersizIhlali(e)) return { ...engel("EPOSTA_KAYITLI", {}, "email"), degerler };
    throw e;
  }

  revalidatePath("/users");
  redirect("/users");
}

export async function updateUser(
  id: string,
  _prev: unknown,
  formData: FormData
): Promise<UserFormState> {
  const session = await requireAdmin();

  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const phone = ((formData.get("phone") as string) || "").trim() || null;
  const password = (formData.get("password") as string) || "";
  const isActive = formData.get("status") !== "PASIF";
  const gerekce = ((formData.get("gerekce") as string) || "").trim();
  const degerler = {
    status: isActive ? "AKTIF" : "PASIF",
    portfoy: ((formData.get("portfoy") as string) || "").trim(),
    portfoyGerekce: ((formData.get("portfoyGerekce") as string) || "").trim(),
    gerekce,
  };

  if (!name) return { ...engel("ALAN_ZORUNLU", {}, "name"), degerler };
  if (!email) return { ...engel("ALAN_ZORUNLU", {}, "email"), degerler };

  const before = await prisma.user.findUnique({ where: { id } });
  if (!before) return { ...engel("KULLANICI_BULUNAMADI"), degerler };

  const pasiflestiriliyor = before.isActive && !isActive;
  if (password) {
    const parolaHata = parolaHatasi(password, "password");
    if (parolaHata) return { ...sonucOlustur([parolaHata]), degerler };
  }
  const gerekceSonucu = pasiflestiriliyor || password ? gerekceEngeli(gerekce, "gerekce") : null;
  if (gerekceSonucu) return { ...gerekceSonucu, degerler };

  const data: {
    name: string;
    email: string;
    phone: string | null;
    isActive: boolean;
    passwordHash?: string;
    mustChangePassword?: boolean;
  } = { name, email, phone, isActive };
  if (password) {
    data.passwordHash = await parolaHashle(password);
    data.mustChangePassword = true; // sıfırlanan parola geçicidir (E-2 §(3))
  }

  // Pasifleştirme portföyü bekletmez (X-17 §(5)): doktoru olan satıcı için hedef — tek bir
  // aktif satıcı ya da sahipsiz — ve gerekçe formun zorunlu alanıdır. Otomatik devir yoktur.
  let portfoy: { hedef: string | null; gerekce: string } | null = null;
  if (pasiflestiriliyor && before.role === "SATICI") {
    const doktorSayisi = await prisma.doctor.count({ where: { ownerSellerId: id } });
    if (doktorSayisi > 0) {
      if (!degerler.portfoy) return { ...engel("PORTFOY_HEDEFI_SECILMEDI", { doktorSayisi }, "portfoy"), degerler };
      const portfoySonucu = gerekceEngeli(degerler.portfoyGerekce, "portfoyGerekce");
      if (portfoySonucu) return { ...portfoySonucu, degerler };
      portfoy = {
        hedef: degerler.portfoy === "SAHIPSIZ" ? null : degerler.portfoy,
        gerekce: degerler.portfoyGerekce,
      };
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (pasiflestiriliyor) {
        const kural = await pasiflestirmeEngeli(tx, before, session.user.id);
        if (kural) throw new IsHatasi([sert(kural, {}, "status")]);
      }
      // Önce pasifleştirilir: hedef olarak kendisi seçilemez (aktif SATICI kuralı).
      const u = await tx.user.update({ where: { id }, data });
      // E-2 §(6) ve 20.10 eki: pasifleştirme de sıfırlama da açık oturumları aynı transaction'da sonlandırır.
      if (pasiflestiriliyor || password) await kullaniciOturumlariniSonlandir(tx, id);
      if (portfoy) {
        const sonuc = await portfoyuDevret(tx, id, portfoy.hedef, {
          metin: portfoy.gerekce,
          yapanId: session.user.id,
        });
        if (sonuc.durum === "HATA") throw new IsHatasi([sert(sonuc.kuralKodu, {}, "portfoy")]);
      }
      await createAuditLog(
        {
          actorId: session.user.id,
          action: AUDIT_ACTIONS.USER_UPDATE,
          entityType: "User",
          entityId: id,
          before, // passwordHash maskelenir (X-18 §(6))
          after: u,
          gerekce,
        },
        tx
      );
      if (password) {
        await createAuditLog(
          {
            actorId: session.user.id,
            action: AUDIT_ACTIONS.USER_PASSWORD_RESET,
            entityType: "User",
            entityId: id,
            gerekce,
          },
          tx
        );
      }
    }, pasiflestiriliyor ? pasiflestirmeTxSecenekleri(before.role) : {});
  } catch (e) {
    if (e instanceof IsHatasi) return { ...e.sonuc, degerler };
    if (eszamanlilikHatasi(e)) return { ...engel("ESZAMANLI_DEGISIKLIK"), degerler };
    if (benzersizIhlali(e)) return { ...engel("EPOSTA_KAYITLI", {}, "email"), degerler };
    throw e;
  }

  revalidatePath("/users");
  redirect("/users");
}
