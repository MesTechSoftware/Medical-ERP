"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import {
  VERI_SETLERI,
  calistirDisaAktarim,
  type DisaAktarimParametresi,
  type VeriSeti,
} from "@/lib/disa-aktarim";
import { BICIM, type Bicim } from "@/lib/disa-aktarim-yazici";
import { basarili, engel, type IslemSonucu } from "@/lib/sonuc";
import { TUM_ZAMANLAR, bugun, yerelGunAraligi, yerelGunMetni } from "@/lib/zaman";

/** Dosya istemciye base64 gider; sunucuda saklanmaz (D-5 §(10), E-3). */
export type DisaAktarimSonucu = IslemSonucu & { dosya?: { ad: string; mime: string; icerik: string } };

const ARALIKLI: readonly VeriSeti[] = ["CARI_HAREKET", "TAHSILAT", "SIPARIS"];

/**
 * Dışa aktarım — D-5. Yalnız `YONETICI` (§(4)). Her çalıştırma kütüğe yazılır: kullanıcı kimliği,
 * veri seti, parametreler, satır sayısı; satır içeriği, ad ve tutar yazılmaz (§(5)). Kütük
 * yazılamazsa dosya verilmez.
 */
export async function disaAktar(_prev: unknown, formData: FormData): Promise<DisaAktarimSonucu> {
  const session = await requireAdmin();

  const kod = String(formData.get("kod") ?? "") as VeriSeti;
  const bicim = String(formData.get("bicim") ?? "xlsx") as Bicim;
  if (!VERI_SETLERI.includes(kod)) return engel("ALAN_ZORUNLU", {}, "kod");
  if (!(bicim in BICIM)) return engel("ALAN_ZORUNLU", {}, "bicim");

  let parametre: DisaAktarimParametresi;
  let kutukParametresi: Record<string, string>;
  if (ARALIKLI.includes(kod)) {
    // Dönem zorunludur; "tüm zamanlar" bilinçli seçimdir, varsayılan değildir (D-5 §(3), X-1 §(2)).
    if (formData.get("tumZamanlar") === "on") {
      parametre = { kod: kod as "CARI_HAREKET", aralik: TUM_ZAMANLAR };
      kutukParametresi = { donem: "tum" };
    } else {
      const basMetni = String(formData.get("baslangic") ?? "");
      const bitMetni = String(formData.get("bitis") ?? "");
      if (!basMetni) return engel("ALAN_ZORUNLU", {}, "baslangic");
      if (!bitMetni) return engel("ALAN_ZORUNLU", {}, "bitis");
      const bas = yerelGunAraligi(basMetni);
      const bit = yerelGunAraligi(bitMetni);
      if (!bas) return engel("GECERSIZ_TARIH", {}, "baslangic");
      if (!bit) return engel("GECERSIZ_TARIH", {}, "bitis");
      if (bit.bitis <= bas.baslangic) return engel("TARIH_ARALIGI_TERS", {}, "bitis");
      // Ekranda kapalı okunan aralık ("1–31 Ağustos") yarı açığa çevrilir (E-1 §(4)).
      parametre = { kod: kod as "CARI_HAREKET", aralik: { baslangic: bas.baslangic, bitis: bit.bitis } };
      kutukParametresi = { baslangic: basMetni, bitis: bitMetni };
    }
  } else if (kod === "STOK") {
    const tarihMetni = String(formData.get("tarih") ?? "");
    const gun = tarihMetni ? yerelGunAraligi(tarihMetni) : null;
    if (tarihMetni && !gun) return engel("GECERSIZ_TARIH", {}, "tarih");
    const an = gun?.baslangic ?? bugun();
    parametre = { kod, tarih: an };
    kutukParametresi = { tarih: tarihMetni || yerelGunMetni(an) };
  } else {
    parametre = { kod: "DOKTOR_LISTESI" };
    kutukParametresi = {};
  }

  const cikti = await calistirDisaAktarim(parametre);
  await prisma.exportLog.create({
    data: {
      userId: session.user.id,
      datasetCode: kod,
      parameters: { ...kutukParametresi, bicim },
      rowCount: cikti.satirlar.length,
    },
  });

  const { yaz, mime, uzanti } = BICIM[bicim];
  const ek = Object.values(kutukParametresi).join("_");
  return {
    ...basarili({ satir: cikti.satirlar.length }),
    dosya: {
      ad: `${kod.toLowerCase()}${ek ? `_${ek}` : ""}.${uzanti}`,
      mime,
      icerik: yaz(cikti).toString("base64"),
    },
  };
}
