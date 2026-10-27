import { createHash } from "node:crypto";

/**
 * Denetim zinciri (KARARLAR X-18 §(2), ADR-011 §4–5). Mühür = SHA-256(önceki mühür ‖ kanonik kayıt).
 * Mührü veritabanı yazar (`denetim_muhurle()`, commit anında); bu dosya aynı hesabı doğrulama için
 * yapar. Kanonik biçim `denetim_kanonik()` ile birebir aynıdır — eşitlik `zincir.itest.ts`'tedir.
 */

export type KanonikKayit = {
  id: string;
  seq: number;
  createdAt: Date;
  actorId: string | null;
  actorRole: string | null;
  action: string;
  actionType: string;
  module: string;
  entityType: string;
  entityId: string | null;
  beforeData: string | null;
  afterData: string | null;
  changes: string | null;
  reason: string | null;
  ipAddress: string | null;
  sessionId: string | null;
  requestMethod: string | null;
  endpoint: string | null;
};

/** Alanlar sabit sırayla; her biri `<UTF-8 bayt uzunluğu>:<değer>`, boş alan `~`. Ayraç ve kaçış yok. */
export function kanonikMetin(k: KanonikKayit): string {
  const alanlar = [
    k.id,
    String(k.seq),
    k.createdAt.toISOString(),
    k.actorId,
    k.actorRole,
    k.action,
    k.actionType,
    k.module,
    k.entityType,
    k.entityId,
    k.beforeData,
    k.afterData,
    k.changes,
    k.reason,
    k.ipAddress,
    k.sessionId,
    k.requestMethod,
    k.endpoint,
  ];
  return alanlar.map((v) => (v === null ? "~" : `${Buffer.byteLength(v, "utf8")}:${v}`)).join("");
}

export function muhurHesapla(oncekiHash: string | null, k: KanonikKayit): string {
  return createHash("sha256")
    .update((oncekiHash ?? "") + kanonikMetin(k), "utf8")
    .digest("hex");
}

/** Zincir sırasıyla okunan mühür ve kaydı; kayıt silinmişse `kayit` boştur. */
export type MuhurSatiri = { chainIndex: number; logId: string; prevHash: string | null; hash: string; kayit: KanonikKayit | null };
export type ZincirSorunu = {
  chainIndex: number;
  logId: string;
  tur: "ZINCIR_BOSLUGU" | "BAG_KOPUK" | "KAYIT_YOK" | "ICERIK_UYUSMUYOR";
};
export type ZincirDurumu = { sonIndeks: number; sonHash: string | null };

/**
 * Bir parti mührü önceki partinin bıraktığı durumdan denetler. Sıra boşluğu, önceki mühre bağın
 * kopması, mührü kalıp kaydı silinen satır ve içeriği değişen kayıt ayrı ayrı bildirilir.
 */
export function zinciriDenetle(satirlar: readonly MuhurSatiri[], baslangic: ZincirDurumu): { sorunlar: ZincirSorunu[]; durum: ZincirDurumu } {
  const sorunlar: ZincirSorunu[] = [];
  let durum = baslangic;
  for (const s of satirlar) {
    const bildir = (tur: ZincirSorunu["tur"]) => sorunlar.push({ chainIndex: s.chainIndex, logId: s.logId, tur });
    if (s.chainIndex !== durum.sonIndeks + 1) bildir("ZINCIR_BOSLUGU");
    if (s.prevHash !== durum.sonHash) bildir("BAG_KOPUK");
    if (s.kayit === null) bildir("KAYIT_YOK");
    else if (muhurHesapla(s.prevHash, s.kayit) !== s.hash) bildir("ICERIK_UYUSMUYOR");
    durum = { sonIndeks: s.chainIndex, sonHash: s.hash };
  }
  return { sorunlar, durum };
}

export type KayitDurumu = "DOGRULANDI" | "ICERIK_UYUSMUYOR" | "BAG_KOPUK" | "MUHURSUZ";

/**
 * Tek kaydın bütünlüğü (detay paneli): mühür kaydın içeriğini özetliyor mu, önceki mühre bağlı mı?
 * İlk mührün önceki özeti yoktur; önceki mühür silinmişse bağ kopuktur.
 */
export function kaydiDogrula(
  k: KanonikKayit,
  muhur: { chainIndex: number; prevHash: string | null; hash: string } | null,
  oncekiMuhur: { hash: string } | null
): KayitDurumu {
  if (muhur === null) return "MUHURSUZ";
  if (muhurHesapla(muhur.prevHash, k) !== muhur.hash) return "ICERIK_UYUSMUYOR";
  const beklenen = muhur.chainIndex === 1 ? null : (oncekiMuhur?.hash ?? undefined);
  return muhur.prevHash === beklenen ? "DOGRULANDI" : "BAG_KOPUK";
}
