import type { AuditLog, Prisma } from "@/generated/prisma/client";
import type { AuditActionType, AuditModule, Role } from "@/generated/prisma/enums";
import { nesneEtiketleri } from "@/lib/aktivite";
import { veriOku } from "@/lib/aktivite-sablonlari";
import { prisma } from "@/lib/db";
import { alanFarklari, type AlanFarki } from "@/lib/denetim/fark";
import { kisaOzet } from "@/lib/denetim/ozet";
import { SISTEM, type DenetimSuzgeci, type Imlec } from "@/lib/denetim/suzgec";
import { kaydiDogrula, type KayitDurumu } from "@/lib/denetim/zincir";
import { yerelGunAraligi } from "@/lib/zaman";

/**
 * Denetim ekranının okumaları (KARARLAR X-18 §(9)): imleçli liste ve kayıt detayı. Liste en yeni üstte,
 * `(createdAt, seq)` sırasıyla keyset sayfalanır (ADR-011 §6): her süzgeç `(kolon, createdAt, seq)`
 * indeksine iner, tarih aralığı indeksin sınırıdır; maliyet derinlikten ve aralığın konumundan
 * bağımsızdır. Toplam sayı okunmaz.
 */

export const SAYFA_BOYU = 50;

export type DenetimSatiri = {
  id: string;
  seq: number;
  createdAt: Date;
  action: string;
  actionType: AuditActionType;
  module: AuditModule;
  entityType: string;
  entityId: string | null;
  /** Varlığın okunur etiketi (belge no, ürün adı); yoksa boş. */
  nesne: string | null;
  aktor: string | null;
  actorRole: Role | null;
  ozet: string;
};

/** `dahaYeni`/`dahaEski`: o yönde satır varsa imlecin değeri (sayfanın ilk/son sırası). */
export type DenetimSayfasi = { satirlar: DenetimSatiri[]; dahaYeni: number | null; dahaEski: number | null };

function kosul(s: DenetimSuzgeci): Prisma.AuditLogWhereInput {
  const baslangic = s.baslangic ? yerelGunAraligi(s.baslangic)?.baslangic : undefined;
  const bitis = s.bitis ? yerelGunAraligi(s.bitis)?.bitis : undefined;
  return {
    ...(s.kullanici === SISTEM ? { actorId: null } : s.kullanici ? { actorId: s.kullanici } : {}),
    ...(s.modul ? { module: s.modul } : {}),
    ...(s.tur ? { actionType: s.tur } : {}),
    ...(s.olay ? { action: s.olay } : {}),
    ...(baslangic || bitis ? { createdAt: { ...(baslangic ? { gte: baslangic } : {}), ...(bitis ? { lt: bitis } : {}) } } : {}),
  };
}

const SATIR = {
  id: true,
  seq: true,
  createdAt: true,
  action: true,
  actionType: true,
  module: true,
  entityType: true,
  entityId: true,
  afterData: true,
  actorRole: true,
  actor: { select: { name: true } },
} as const;

/** Sıralamadaki konum: zaman, eşitlikte yazım sırası. */
type Konum = { createdAt: Date; seq: number };

// Keyset koşulu: zaman sınırı indekse iner, eşit zamanlı satırları `seq` ayırır (ADR-011 §6).
const eskisi = (k: Konum): Prisma.AuditLogWhereInput => ({
  createdAt: { lte: k.createdAt },
  OR: [{ createdAt: { lt: k.createdAt } }, { seq: { lt: k.seq } }],
});
const yenisi = (k: Konum): Prisma.AuditLogWhereInput => ({
  createdAt: { gte: k.createdAt },
  OR: [{ createdAt: { gt: k.createdAt } }, { seq: { gt: k.seq } }],
});

export async function denetimListesi(s: DenetimSuzgeci, imlec: Imlec, boyut = SAYFA_BOYU): Promise<DenetimSayfasi> {
  const where = kosul(s);
  // İmleç satırının zamanı benzersiz `seq` indeksinden; bulunmazsa (bozuk adres) ilk sayfa.
  const uc = imlec ? await prisma.auditLog.findUnique({ where: { seq: imlec.seq }, select: { createdAt: true, seq: true } }) : null;
  const eskiye = !uc || imlec?.yon === "once";
  const yon = eskiye ? "desc" : "asc";
  const ham = await prisma.auditLog.findMany({
    where: uc ? { AND: [where, eskiye ? eskisi(uc) : yenisi(uc)] } : where,
    orderBy: [{ createdAt: yon }, { seq: yon }],
    take: boyut + 1,
    select: SATIR,
  });
  // Tarama yönünde fazladan satır bir sonraki sayfayı haber verir; öbür yön tek indeks yoklamasıyla.
  const fazla = ham.length > boyut;
  const sayfa = ham.slice(0, boyut);
  if (!eskiye) sayfa.reverse();
  const ilk = sayfa[0];
  const son = sayfa.at(-1);
  const varMi = async (k: Prisma.AuditLogWhereInput) => (await prisma.auditLog.findFirst({ where: { AND: [where, k] }, select: { id: true } })) !== null;
  const dahaEski = son && (eskiye ? fazla : await varMi(eskisi(son))) ? son.seq : null;
  const dahaYeni = ilk && (eskiye ? uc !== null && (await varMi(yenisi(ilk))) : fazla) ? ilk.seq : null;

  const etiketler = await nesneEtiketleri(sayfa);
  const satirlar = sayfa.map((k) => {
    const nesne = k.entityId ? (etiketler.get(`${k.entityType}:${k.entityId}`) ?? null) : null;
    return {
      id: k.id,
      seq: k.seq,
      createdAt: k.createdAt,
      action: k.action,
      actionType: k.actionType,
      module: k.module,
      entityType: k.entityType,
      entityId: k.entityId,
      nesne,
      aktor: k.actor?.name ?? null,
      actorRole: k.actorRole,
      ozet: kisaOzet(k, nesne),
    };
  });
  return { satirlar, dahaYeni, dahaEski };
}

export type DenetimDetayi = {
  kayit: AuditLog;
  aktor: { name: string; email: string } | null;
  ozet: string;
  farklar: AlanFarki[];
  /** Değişiklik listesi kaydedilmemiş (modül öncesi) kayıt; fark önceki/sonraki hâlden çıkarıldı. */
  modulOncesi: boolean;
  muhur: { chainIndex: number; prevHash: string | null; hash: string } | null;
  butunluk: KayitDurumu;
};

export async function denetimKaydi(id: string): Promise<DenetimDetayi | null> {
  const k = await prisma.auditLog.findUnique({
    where: { id },
    include: { actor: { select: { name: true, email: true } }, seal: { select: { chainIndex: true, prevHash: true, hash: true } } },
  });
  if (!k) return null;
  const { actor, seal, ...kayit } = k;
  const onceki = seal && seal.chainIndex > 1 ? await prisma.auditLogSeal.findUnique({ where: { chainIndex: seal.chainIndex - 1 }, select: { hash: true } }) : null;
  const nesne = kayit.entityId ? ((await nesneEtiketleri([kayit])).get(`${kayit.entityType}:${kayit.entityId}`) ?? null) : null;
  const modulOncesi = kayit.changes === null;
  return {
    kayit,
    aktor: actor,
    ozet: kisaOzet(kayit, nesne),
    farklar: modulOncesi
      ? alanFarklari(kayit.beforeData === null ? undefined : veriOku(kayit.beforeData), kayit.afterData === null ? undefined : veriOku(kayit.afterData))
      : (JSON.parse(kayit.changes!) as AlanFarki[]),
    modulOncesi,
    muhur: seal,
    butunluk: kaydiDogrula(kayit, seal, onceki),
  };
}

/** Kullanıcı süzgecinin seçenekleri: pasif kullanıcılar dahil (geçmiş kayıtları vardır). */
export function kullaniciSecenekleri() {
  return prisma.user.findMany({ select: { id: true, name: true, isActive: true }, orderBy: { name: "asc" } });
}
