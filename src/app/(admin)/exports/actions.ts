"use server";

import { prisma } from "@/lib/db";
import { ARALIKLI } from "@/lib/disa-aktarim-katalog";
import { requireAdmin } from "@/lib/session";
import {
  VERI_SETLERI,
  calistirDisaAktarim,
  eksikFaturaBilgisiUyarisi,
  faturaGeriyeDonukUyarisi,
  sablonUygula,
  type DisaAktarimParametresi,
  type VeriSeti,
} from "@/lib/disa-aktarim";
import { policy } from "@/lib/policy";
import { BICIM, type Bicim } from "@/lib/disa-aktarim-yazici";
import { engel, sonucOlustur, type Bildirim, type IslemSonucu } from "@/lib/sonuc";
import { TUM_ZAMANLAR, bugun, yerelGunAraligi, yerelGunMetni } from "@/lib/zaman";

/** Dosya istemciye base64 gider; sunucuda saklanmaz (D-5 §(10), E-3). */
export type DisaAktarimSonucu = IslemSonucu & { dosya?: { ad: string; mime: string; icerik: string } };


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
  // K-4 §(6)-b: sütun eşlemesi kurulumda girilmeden fatura hazırlık çıktısı verilmez.
  const sablon = policy.export.sablonTanimi;
  if (kod === "FATURA_HAZIRLIK" && !sablon) return engel("FATURA_SABLONU_TANIMSIZ", {}, "kod");

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

  const veri = await calistirDisaAktarim(parametre);
  const uyarilar: Bildirim[] = [];
  let cikti = veri;
  if (kod === "FATURA_HAZIRLIK" && sablon) {
    const uyari = faturaGeriyeDonukUyarisi(veri);
    if (uyari) uyarilar.push(uyari);
    cikti = sablonUygula(veri, sablon);
  }
  // A-13 §(5): eksik fatura bilgisi — engellemez, sayısı gösterilir.
  const eksik =
    parametre.kod === "DOKTOR_LISTESI"
      ? await eksikFaturaBilgisiUyarisi(parametre)
      : parametre.kod === "FATURA_HAZIRLIK"
        ? await eksikFaturaBilgisiUyarisi({ kod: parametre.kod, aralik: parametre.aralik })
        : null;
  if (eksik) uyarilar.push(eksik);
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
    ...sonucOlustur(uyarilar, { satir: cikti.satirlar.length }),
    dosya: {
      ad: `${kod.toLowerCase()}${ek ? `_${ek}` : ""}.${uzanti}`,
      mime,
      icerik: yaz(cikti).toString("base64"),
    },
  };
}
