import type { Prisma } from "@/generated/prisma/client";
import type { FreeReason } from "@/generated/prisma/enums";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";
import type { BelgeOneki } from "@/lib/belge-no";
import { prisma } from "@/lib/db";
import type { KuralKodu } from "@/lib/sonuc";
import { onBlokAcildi, onBlokKararaBaglandi } from "@/lib/olaylar";
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

/** Blok doğuran kural kodları — X-4 kataloğunun alt kümesi (§(3)); veritabanında `varchar`. */
export type BlokKuralKodu = Extract<KuralKodu, "NEGATIF_STOK" | "BEDELSIZ_ONAYI" | "ISKONTO_TAVANI">;

/**
 * A-2 eki (20.10.2026): bedelsiz satırın onay kuralı sebebe bağlıdır — numune onaysız geçer,
 * diğer sebepler `BEDELSIZ_ONAYI` bloğu açar. Kodda kapalıdır.
 */
export const BEDELSIZ_ONAY_GEREKIR: Record<FreeReason, boolean> = {
  NUMUNE: false,
  PROMOSYON: true,
  MAL_FAZLASI: true,
  DIGER: true,
};

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
 * Bir kuralın belgedeki son bloğu (A-8 ek, 16.10.2026 — her kural için son blok geçerli):
 * `YOK` · `BEKLIYOR` (karar verilmemiş) · `ONAY` · `RED`. `acikBlokVarMi()` bütün kurallara
 * bakar; bunu, ihlalin şu an sürüp sürmediğine göre davranan akış (sevkiyat — A-8 eki 20.10) kullanır.
 */
export async function sonBlokDurumu(
  belgeTipi: BelgeOneki,
  belgeId: string,
  kuralKodu: BlokKuralKodu,
  db: Db = prisma
): Promise<"YOK" | "BEKLIYOR" | "ONAY" | "RED"> {
  const b = await db.approvalBlock.findFirst({
    where: { documentType: belgeTipi, documentId: belgeId, ruleCode: kuralKodu },
    orderBy: [{ openedAt: "desc" }, { id: "desc" }],
    select: { decision: true },
  });
  return b ? (b.decision ?? "BEKLIYOR") : "YOK";
}

/** Bir belgenin onay görünümü (A-8, KARARLAR §5.23): kararsız son bloklar ve en yeni `RED` son blok. */
export type OnayAyrintisi = {
  /** Bir kuralın son bloğu kararsızsa `BEKLIYOR`; değilse bir kuralın son kararı `RED` ise `RED`. */
  durum: "BEKLIYOR" | "RED";
  /** Karar verilmemiş (kuralın son) blokların kimlikleri. */
  acikBloklar: string[];
  /** Son bloğu `RED` olan kurallar arasında en yeni karar; yoksa `null`. */
  red: {
    blokId: string;
    kural: string;
    not: string | null;
    tarih: Date | null;
    acanId: string;
    kararVerenId: string | null;
  } | null;
};

/**
 * Ekranlar için belgelerin onay ayrıntısı: her kuralın **son** bloğuna bakılır (`acikBlokVarMi` ile aynı
 * ilke). Onay geçmiş belge haritada yoktur.
 */
export async function belgeOnayAyrintilari(
  belgeTipi: BelgeOneki,
  belgeIdleri: readonly string[],
  db: Db = prisma
): Promise<Map<string, OnayAyrintisi>> {
  const bloklar = await db.approvalBlock.findMany({
    where: { documentType: belgeTipi, documentId: { in: [...belgeIdleri] } },
    orderBy: [{ openedAt: "desc" }, { id: "desc" }],
    select: { id: true, documentId: true, ruleCode: true, decision: true, openedById: true, decidedById: true, decidedAt: true, decisionNote: true },
  });
  const goruldu: Record<string, true> = {};
  const harita = new Map<string, OnayAyrintisi>();
  for (const b of bloklar) {
    const k = `${b.documentId}|${b.ruleCode}`;
    if (goruldu[k]) continue; // yalnız kuralın son bloğu
    goruldu[k] = true;
    if (b.decision === "ONAY") continue;
    const a = harita.get(b.documentId) ?? { durum: "RED" as const, acikBloklar: [], red: null };
    harita.set(b.documentId, a);
    if (b.decision === null) {
      a.durum = "BEKLIYOR";
      a.acikBloklar.push(b.id);
    } else if (!a.red || (b.decidedAt?.getTime() ?? 0) > (a.red.tarih?.getTime() ?? 0)) {
      a.red = { blokId: b.id, kural: b.ruleCode, not: b.decisionNote, tarih: b.decidedAt, acanId: b.openedById, kararVerenId: b.decidedById };
    }
  }
  return harita;
}

/**
 * Ekranlar için belgelerin onay durumu (A-8): her kuralın son bloğuna bakılır; bir kural
 * kararsızsa `BEKLIYOR`, değilse bir kuralın son kararı `RED` ise `RED`. Geçen belge haritada yoktur.
 */
export async function belgeOnayDurumlari(
  belgeTipi: BelgeOneki,
  belgeIdleri: readonly string[],
  db: Db = prisma
): Promise<Map<string, "BEKLIYOR" | "RED">> {
  const ayrinti = await belgeOnayAyrintilari(belgeTipi, belgeIdleri, db);
  return new Map([...ayrinti].map(([id, a]) => [id, a.durum]));
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
    const blok = await tx.approvalBlock.create({
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
    onBlokAcildi({ belgeTipi: girdi.belgeTipi, belgeId: girdi.belgeId, kuralKodu });
    if (yetkili) onBlokKararaBaglandi({ blokId: blok.id, karar: "ONAY" });
    acikKaldi ||= !yetkili;
  }
  return { durum: "BASARILI_UYARILI", kademe: "YUMUSAK", ihlaller, onayaGonderildi: acikKaldi };
}

/**
 * Açık bloğa karar — onay bekleyenler ekranı (A-8). Karar `YONETICI`'nindir (çağıran denetler);
 * not zorunludur (gerekçe her durumda). Koşullu yazılır: karar verilmiş bloğa ikinci karar
 * yazılmaz, eşzamanlı iki karardan yalnız biri geçer. `false` → blok zaten kararlı.
 */
export async function blokKarariVer(
  tx: Prisma.TransactionClient,
  girdi: { blokId: string; karar: "ONAY" | "RED"; not: string; yapanId: string }
): Promise<boolean> {
  const r = await tx.approvalBlock.updateMany({
    where: { id: girdi.blokId, decision: null },
    data: { decision: girdi.karar, decidedById: girdi.yapanId, decidedAt: simdi(), decisionNote: girdi.not },
  });
  if (r.count !== 1) return false;
  // X-18-9: karar, kararın kendi transaction'ında denetim kaydına yazılır; karar notu gerekçe alanındadır.
  const blok = await tx.approvalBlock.findUniqueOrThrow({
    where: { id: girdi.blokId },
    select: { ruleCode: true, documentType: true, documentId: true },
  });
  await createAuditLog(
    {
      actorId: girdi.yapanId,
      action: AUDIT_ACTIONS.APPROVAL_DECIDE,
      entityType: "ApprovalBlock",
      entityId: girdi.blokId,
      before: { decision: null },
      after: { karar: girdi.karar, ruleCode: blok.ruleCode, documentType: blok.documentType, documentId: blok.documentId },
      gerekce: girdi.not,
    },
    tx
  );
  onBlokKararaBaglandi({ blokId: girdi.blokId, karar: girdi.karar });
  return true;
}
