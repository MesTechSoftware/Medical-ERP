import type { ImportDataType } from "@/generated/prisma/enums";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { xlsxKitap, type Dogrulama } from "@/lib/disa-aktarim-yazici";
import { policy } from "@/lib/policy";
import { sert, sonucOlustur, type Bildirim, type IslemSonucu, type KuralKodu } from "@/lib/sonuc";
import { XlsxHatasi, xlsxIlkSayfa } from "@/lib/xlsx-okuyucu";
import { simdi, yerelGunMetni } from "@/lib/zaman";
import { ACILIS_BAKIYESI_TANIMI } from "./acilis-bakiyesi";
import { ACILIS_STOGU_TANIMI } from "./acilis-stogu";
import { CARI_TANIMI } from "./cari";
import { FIYAT_LISTESI_TANIMI } from "./fiyat-listesi";
import { URUN_TANIMI } from "./urun";
import type { IceAktarimTanimi, OzetSatiri, Satir } from "./tanim";

/**
 * İçe aktarımın tek koşturucusu — ADR-006 §2: doğrula → önizle → yaz. Dosya saklanmaz (E-3 §(2));
 * "yaz" aynı dosyayla yeniden çağrılır ve aynı doğrulamadan geçer. Kısmi yazma yoktur (X-16 §(4)).
 */
export const TANIMLAR: Partial<Record<ImportDataType, IceAktarimTanimi<unknown>>> = {
  CARI: CARI_TANIMI as IceAktarimTanimi<unknown>,
  URUN: URUN_TANIMI as IceAktarimTanimi<unknown>,
  FIYAT_LISTESI: FIYAT_LISTESI_TANIMI as IceAktarimTanimi<unknown>,
  ACILIS_BAKIYESI: ACILIS_BAKIYESI_TANIMI as IceAktarimTanimi<unknown>,
  ACILIS_STOGU: ACILIS_STOGU_TANIMI as IceAktarimTanimi<unknown>,
};

export type IceAktarimSonucu = IslemSonucu & {
  ozet?: OzetSatiri[];
  /** Reddedilen satırların kural koduna göre adedi (X-16 §(7)). */
  kodAdetleri?: { kod: KuralKodu; adet: number }[];
  /** Açılacak kayıt adedi (X-16 §(9)). */
  acilacak?: number;
  partiNo?: string;
  /** Şablon indirmesi (base64; dosya sunucuda tutulmaz). */
  dosya?: { ad: string; mime: string; icerik: string };
};

const anahtar = (s: string) => s.trim().toLocaleLowerCase("tr-TR");

/** Dosya + başlık denetimi (E-3 §(3), X-16 §(3)); geçerse satırlar. */
function oku(tanim: IceAktarimTanimi<unknown>, dosya: { ad: string; icerik: Buffer }): { hata: Bildirim[] } | { satirlar: Satir[] } {
  const mb = policy.import.azamiDosyaBoyutMb;
  const dosyaHatasi = { hata: [sert("ICE_AKTARIM_DOSYA_GECERSIZ", { mb })] };
  if (!/\.xlsx$/i.test(dosya.ad) || dosya.icerik.length === 0 || dosya.icerik.length > mb * 1024 * 1024) return dosyaHatasi;
  let ham;
  try {
    ham = xlsxIlkSayfa(dosya.icerik);
  } catch (e) {
    if (e instanceof XlsxHatasi) return dosyaHatasi;
    throw e;
  }
  const [baslik, ...veri] = ham;
  const basliklar = (baslik?.hucreler ?? []).map((h) => (h === null ? null : anahtar(h)));
  const kolonlar = new Map(tanim.kolonlar.map((k) => [anahtar(k.baslik), k]));
  const hata: Bildirim[] = [
    ...tanim.kolonlar.filter((k) => k.zorunlu && !basliklar.includes(anahtar(k.baslik))).map((k) => sert("ICE_AKTARIM_KOLON_EKSIK", { kolon: k.baslik })),
    ...(baslik?.hucreler ?? []).filter((h): h is string => h !== null && !kolonlar.has(anahtar(h))).map((h) => sert("ICE_AKTARIM_KOLON_TANINMIYOR", { kolon: h })),
  ];
  if (hata.length > 0) return { hata };
  if (veri.length === 0) return { hata: [sert("ICE_AKTARIM_BOS")] };
  return {
    satirlar: veri.map((r) => ({
      no: r.no,
      deger: Object.fromEntries(
        basliklar.flatMap((b, i) => {
          const k = b === null ? undefined : kolonlar.get(b);
          return k ? [[k.alan, r.hucreler[i]?.trim() || null]] : [];
        })
      ),
    })),
  };
}

export async function calistirIceAktarim(
  tur: ImportDataType,
  dosya: { ad: string; icerik: Buffer },
  asama: "onizle" | "yaz",
  yapanId: string
): Promise<IceAktarimSonucu> {
  const tanim = TANIMLAR[tur];
  if (!tanim) throw new Error(`İçe aktarım tanımı yok: ${tur}`);
  const okunan = oku(tanim, dosya);
  if ("hata" in okunan) return sonucOlustur(okunan.hata);

  const yaz = async () =>
    prisma.$transaction(
      async (tx) => {
        // Doğrulama yazma transaction'ının içinde yeniden koşar: önizleme ile yazma arasında değişen
        // veri (ör. aynı telefonla açılan cari) yakalanır.
        const d = await tanim.denetle(tx, okunan.satirlar);
        if (d.hatalar.length > 0) return { d, partiNo: null };
        const no = `${tur}-${yerelGunMetni(simdi()).replaceAll("-", "")}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
        const parti = await tx.importBatch.create({ data: { batchNo: no, dataType: tur, userId: yapanId, fileName: dosya.ad.slice(0, 255) } });
        await tanim.yaz(tx, d.yazilacak, { id: parti.id, no, yapanId });
        await createAuditLog(
          { actorId: yapanId, action: AUDIT_ACTIONS.IMPORT_CREATE, entityType: "ImportBatch", entityId: parti.id, after: { batchNo: no, tur, kayit: d.yazilacak.length, dosya: dosya.ad } },
          tx
        );
        return { d, partiNo: no };
      },
      { timeout: 120_000 }
    );

  const { d, partiNo } =
    asama === "yaz" ? await yaz() : { d: await prisma.$transaction((tx) => tanim.denetle(tx, okunan.satirlar), { timeout: 120_000 }), partiNo: null };

  const sayac = new Map<KuralKodu, number>();
  for (const b of d.hatalar) sayac.set(b.kural_kodu, (sayac.get(b.kural_kodu) ?? 0) + 1);
  const ek = {
    ozet: d.ozet,
    kodAdetleri: [...sayac].map(([kod, adet]) => ({ kod, adet })),
    acilacak: d.yazilacak.length,
  };
  if (asama === "yaz" && d.hatalar.length > 0) {
    const reddedilen = new Set(d.hatalar.map((b) => b.parametreler.satir)).size;
    return { ...sonucOlustur([sert("ICE_AKTARIM_SATIR_HATALI", { adet: reddedilen }), ...d.hatalar]), ...ek };
  }
  return { ...sonucOlustur(d.hatalar, partiNo ? { partiNo } : undefined), ...ek, ...(partiNo ? { partiNo } : {}) };
}

/** Şablon tanımdan üretilir (ADR-006 §3): başlık satırı, açılır listeler ve "Açıklama" sayfası. */
export function sablonUret(tur: ImportDataType): Buffer {
  const tanim = TANIMLAR[tur];
  if (!tanim) throw new Error(`İçe aktarım tanımı yok: ${tur}`);
  const dogrulamalar: Dogrulama[] = tanim.kolonlar.flatMap((k, i) => (k.izinli ? [{ kolon: i, degerler: k.izinli }] : []));
  return xlsxKitap([
    { ad: "Veri", kolonlar: tanim.kolonlar.map((k) => ({ baslik: k.baslik, tip: "metin" as const })), satirlar: [], dogrulamalar },
    {
      ad: "Açıklama",
      kolonlar: ["Kolon", "Zorunlu", "Açıklama", "Örnek", "İzinli değerler", "Kaynak karar"].map((b) => ({ baslik: b, tip: "metin" as const })),
      satirlar: tanim.kolonlar.map((k) => [k.baslik, k.zorunlu ? "Evet" : "Hayır", k.aciklama || null, k.ornek || null, k.izinli?.join(", ") ?? null, k.kaynak]),
    },
  ]);
}

/** Parti geri alma (X-12 §(3), X-16 §(10)): yalnız yönetici, gerekçe zorunlu, tek transaction, kısmi yok. */
export async function partiGeriAl(partiId: string, yapanId: string, gerekce: string): Promise<IslemSonucu> {
  return prisma.$transaction(async (tx) => {
    const parti = await tx.importBatch.findUnique({ where: { id: partiId } });
    if (!parti) return sonucOlustur([sert("PARTI_GERI_ALINAMAZ")]);
    if (parti.revertedAt) return sonucOlustur([sert("PARTI_ZATEN_GERI_ALINDI")]);
    const tanim = TANIMLAR[parti.dataType];
    if (!tanim?.geriAl) return sonucOlustur([sert("PARTI_GERI_ALINMAZ_TUR")]);
    // Koşullu işaret: eşzamanlı iki geri almadan yalnız biri geçer.
    const isaret = await tx.importBatch.updateMany({
      where: { id: partiId, revertedAt: null },
      data: { revertedAt: simdi(), revertedById: yapanId, revertReason: gerekce },
    });
    if (isaret.count === 0) return sonucOlustur([sert("PARTI_ZATEN_GERI_ALINDI")]);
    const engel = await tanim.geriAl(tx, partiId);
    if (engel) throw new GeriAlmaEngeli(engel);
    await createAuditLog(
      { actorId: yapanId, action: AUDIT_ACTIONS.IMPORT_REVERT, entityType: "ImportBatch", entityId: partiId, after: { batchNo: parti.batchNo, reason: gerekce } },
      tx
    );
    return sonucOlustur([]);
  }).catch((e) => {
    if (e instanceof GeriAlmaEngeli) return sonucOlustur([sert(e.kod)]);
    throw e;
  });
}

/** Geri alma koşulu sağlanmadığında işaret de geri alınsın diye transaction'ı bozan iç hata. */
class GeriAlmaEngeli extends Error {
  constructor(readonly kod: KuralKodu) {
    super(kod);
  }
}
