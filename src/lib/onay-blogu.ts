import type { Prisma } from "@/generated/prisma/client";
import type { BelgeOneki } from "@/lib/belge-no";
import { prisma } from "@/lib/db";
import { simdi } from "@/lib/zaman";

type Db = Prisma.TransactionClient | typeof prisma;

/**
 * `OnayBlogu` — yumuşak kısıtın tek mekanizması (A-8, §0.3, X-4 §(5)). Tek çağrı noktası
 * listesinin 6. maddesi: `acikBlokVarMi()` ve `blokKontrolleriniCalistir()`.
 *
 * Belge kaydı engellenmez; blok yalnız **sonuç doğuran adımı** durdurur. Kararı yetki
 * seviyesi verir — bugün tek seviye `YONETICI`. Gerekçe her durumda zorunludur: bloğu
 * açan da yazar, karar veren de (X-4 §(4) `YUMUSAK`).
 */

/** Blok doğuran kural kodları — kodda kapalı katalog (X-4 §(3)); veritabanında `varchar`. */
export type BlokKuralKodu = "NEGATIF_STOK";

export type BlokIhlali = {
  kuralKodu: BlokKuralKodu;
  /** UI metni sözlükten gelir; sunucu yalnız parametre döner (X-4 §(3)). */
  parametreler: Record<string, string | number>;
};

export type BlokSonucu =
  | { durum: "BASARILI" }
  | { durum: "ONAY_GEREKLI"; kademe: "YUMUSAK"; ihlaller: BlokIhlali[] }
  | { durum: "BASARILI_UYARILI"; kademe: "YUMUSAK"; ihlaller: BlokIhlali[]; onayaGonderildi: boolean };

/**
 * Sonuç doğuran adımı durduran blok var mı? Her kural kodu için **son blok** belirler
 * (A-8 ek, 16.10.2026): kararı verilmemiş ya da `RED` ise durdurur, `ONAY` ise geçirir.
 * `RED`'den sonra yeni gerekçeyle açılan blok yeniden karara gider; eski kayıtlar izdir.
 */
export async function acikBlokVarMi(belgeTipi: BelgeOneki, belgeId: string, db: Db = prisma): Promise<boolean> {
  const bloklar = await db.approvalBlock.findMany({
    where: { documentType: belgeTipi, documentId: belgeId },
    orderBy: [{ openedAt: "desc" }, { id: "desc" }],
    select: { ruleCode: true, decision: true },
  });
  const sonKarar = new Map<string, string | null>();
  for (const b of bloklar) if (!sonKarar.has(b.ruleCode)) sonKarar.set(b.ruleCode, b.decision);
  return [...sonKarar.values()].some((karar) => karar !== "ONAY");
}

/**
 * Blok kontrollerinin tek giriş noktası. Çağıran ihlalleri (ör. `stokHareketiYaz()`'ın
 * `NEGATIF_STOK` kalemleri) verir; fonksiyon X-4 sonucunu döner.
 *
 * - İhlal yok → `BASARILI`.
 * - Gerekçe yok → `ONAY_GEREKLI`; hiçbir şey yazılmaz, çağıran işlemi geri alır ve
 *   gerekçe diyaloğunu gösterir. Bütün ihlaller döner (X-4 §(7)).
 * - Gerekçe var → kural kodu başına bir blok (aynı belge ve kural için açık blok varsa
 *   yenisi açılmaz). `YONETICI` yeni bloğu aynı işlemde `ONAY` ile kapatır; diğer roller
 *   için blok açık kalır ve belge onaya gönderilir. Önceden açık kalmış bloğa karar
 *   burada verilmez — o, onay bekleyenler ekranının işidir; `onayaGonderildi` işlem
 *   sonunda açık blok kalıp kalmadığını söyler.
 */
export async function blokKontrolleriniCalistir(
  tx: Prisma.TransactionClient,
  girdi: {
    belgeTipi: BelgeOneki;
    belgeId: string;
    ihlaller: readonly BlokIhlali[];
    yapan: { id: string; rol: "YONETICI" | "OPERASYON" | "SATICI" };
    gerekce: string | null;
  }
): Promise<BlokSonucu> {
  const ihlaller = [...girdi.ihlaller];
  if (ihlaller.length === 0) return { durum: "BASARILI" };

  const gerekce = girdi.gerekce?.trim() ?? "";
  if (gerekce === "") return { durum: "ONAY_GEREKLI", kademe: "YUMUSAK", ihlaller };

  const yetkili = girdi.yapan.rol === "YONETICI";
  let acikKaldi = false;
  for (const kuralKodu of new Set(ihlaller.map((i) => i.kuralKodu))) {
    const acik = await tx.approvalBlock.findFirst({
      where: { documentType: girdi.belgeTipi, documentId: girdi.belgeId, ruleCode: kuralKodu, decision: null },
      select: { id: true },
    });
    if (acik) {
      acikKaldi = true;
      continue;
    }
    await tx.approvalBlock.create({
      data: {
        documentType: girdi.belgeTipi,
        documentId: girdi.belgeId,
        ruleCode: kuralKodu,
        openedById: girdi.yapan.id,
        openReason: gerekce,
        ...(yetkili
          ? { decision: "ONAY", decidedById: girdi.yapan.id, decidedAt: simdi(), decisionNote: gerekce }
          : {}),
      },
    });
    acikKaldi ||= !yetkili;
  }
  return { durum: "BASARILI_UYARILI", kademe: "YUMUSAK", ihlaller, onayaGonderildi: acikKaldi };
}
