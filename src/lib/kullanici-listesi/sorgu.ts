import type { Prisma } from "@/generated/prisma/client";
import type { AuditActionType, OrderStatus, Role } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { denetimListesi } from "@/lib/denetim/sorgu";
import { BOS_SUZGEC as BOS_DENETIM } from "@/lib/denetim/suzgec";
import { suresiDolduMu, sureAyari } from "@/lib/oturum";
import { simdi } from "@/lib/zaman";
import type { GorenRol, KullaniciSuzgeci } from "@/lib/kullanici-listesi/suzgec";

/**
 * Kullanıcılar ekranı sorguları (spec Ü-22 §4). Kapsam (D-2: OPERASYON yalnız satıcılar) ve süzgeç tek
 * `where` üreticisindedir; liste, KPI ve panel onu kullanır (D-2-3). Portföy aktif carilerdir (X-17-6).
 */

const PANEL_CARI_SINIRI = 10;
const PANEL_SIPARIS_SINIRI = 5;
const PANEL_ISLEM_SINIRI = 5;

/** Portföyü dolduran cari: sorumlusu bu satıcı olan aktif cari. */
const AKTIF_CARI = { status: "AKTIF" } as const;

export type KullaniciSatiri = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  isActive: boolean;
  geciciParola: boolean;
  /** Satıcıda aktif cari sayısı; diğer rollerde `null`. */
  portfoy: number | null;
  /** Oturumlarının en son görülmesi (iptal edilmiş dahil); hiç oturum yoksa `null`. */
  sonEtkinlik: Date | null;
};

export type KullaniciKpileri = { aktifKullanici: number; aktifSatici: number; portfoysuz: number; ilkGirisBekleyen: number };

export type KullaniciPaneli = {
  kullanici: KullaniciSatiri & { createdAt: Date; primOrani: string | null };
  acikOturum: number;
  cariler: { id: string; fullName: string }[];
  siparisler: { id: string; documentNo: string; orderDate: Date; status: OrderStatus }[];
  /** Son denetim kayıtları — yalnız YONETICI'ye (D-2: OPERASYON denetim kaydı görmez). */
  islemler: { id: string; createdAt: Date; actionType: AuditActionType; ozet: string }[] | null;
};

function kapsam(gorenRol: GorenRol): Prisma.UserWhereInput {
  return gorenRol === "OPERASYON" ? { role: "SATICI" } : {};
}

/** Tek `where` üreticisi: kapsam + süzgeç. */
export function kullaniciKosulu(s: KullaniciSuzgeci, gorenRol: GorenRol): Prisma.UserWhereInput {
  const kosullar: Prisma.UserWhereInput[] = [kapsam(gorenRol)];
  if (s.portfoy === "yok") kosullar.push({ role: "SATICI", isActive: true, ownedDoctors: { none: AKTIF_CARI } });
  if (s.durum) kosullar.push({ isActive: s.durum === "aktif" });
  if (s.rol) kosullar.push({ role: s.rol });
  if (s.parola === "gecici") kosullar.push({ mustChangePassword: true });
  return { AND: kosullar };
}

const SECIM = { id: true, name: true, email: true, phone: true, role: true, isActive: true, mustChangePassword: true } as const;
type Kayit = Prisma.UserGetPayload<{ select: typeof SECIM }>;

/** Portföy ve son etkinlik — sayfadaki kullanıcılar için iki toplu okuma. */
async function ekBilgiler(kayitlar: Kayit[]): Promise<KullaniciSatiri[]> {
  const idler = kayitlar.map((k) => k.id);
  const saticilar = kayitlar.filter((k) => k.role === "SATICI").map((k) => k.id);
  const [portfoylar, oturumlar] = await Promise.all([
    saticilar.length === 0
      ? []
      : prisma.doctor.groupBy({ by: ["ownerSellerId"], where: { ownerSellerId: { in: saticilar }, ...AKTIF_CARI }, _count: { _all: true } }),
    idler.length === 0 ? [] : prisma.session.groupBy({ by: ["userId"], where: { userId: { in: idler } }, _max: { lastSeenAt: true } }),
  ]);
  const portfoy = new Map(portfoylar.map((p) => [p.ownerSellerId, p._count._all]));
  const son = new Map(oturumlar.map((o) => [o.userId, o._max.lastSeenAt]));
  return kayitlar.map((k) => ({
    id: k.id,
    name: k.name,
    email: k.email,
    phone: k.phone,
    role: k.role,
    isActive: k.isActive,
    geciciParola: k.mustChangePassword,
    portfoy: k.role === "SATICI" ? (portfoy.get(k.id) ?? 0) : null,
    sonEtkinlik: son.get(k.id) ?? null,
  }));
}

/** Süzülmüş ve sayfalanmış liste; rol sonra ad sırası. */
export async function kullaniciListesi(
  s: KullaniciSuzgeci,
  gorenRol: GorenRol,
  sayfa: { skip: number; take: number }
): Promise<{ satirlar: KullaniciSatiri[]; toplam: number }> {
  const where = kullaniciKosulu(s, gorenRol);
  const [kayitlar, toplam] = await Promise.all([
    prisma.user.findMany({ where, orderBy: [{ role: "asc" }, { name: "asc" }, { id: "asc" }], skip: sayfa.skip, take: sayfa.take, select: SECIM }),
    prisma.user.count({ where }),
  ]);
  return { satirlar: await ekBilgiler(kayitlar), toplam };
}

/** KPI (spec §3.2) — süzgeçten bağımsız, kapsama bağlı; her kart kendi süzgeciyle sayılır. */
export async function kullaniciKpileri(gorenRol: GorenRol): Promise<KullaniciKpileri> {
  const say = (s: Partial<KullaniciSuzgeci>) =>
    prisma.user.count({ where: kullaniciKosulu({ durum: null, rol: null, portfoy: null, parola: null, ...s }, gorenRol) });
  const [aktifKullanici, aktifSatici, portfoysuz, ilkGirisBekleyen] = await Promise.all([
    say({ durum: "aktif" }),
    say({ durum: "aktif", rol: "SATICI" }),
    say({ portfoy: "yok" }),
    say({ durum: "aktif", parola: "gecici" }),
  ]);
  return { aktifKullanici, aktifSatici, portfoysuz, ilkGirisBekleyen };
}

/** Yan panel (spec §3.5); kapsam dışı ya da bulunamayan kimlikte `null`. */
export async function kullaniciPaneli(id: string, gorenRol: GorenRol, an: Date = simdi()): Promise<KullaniciPaneli | null> {
  const kayit = await prisma.user.findFirst({
    where: { AND: [{ id }, kapsam(gorenRol)] },
    select: { ...SECIM, createdAt: true, commissionRate: true },
  });
  if (!kayit) return null;
  const yonetici = gorenRol === "YONETICI";
  const satici = kayit.role === "SATICI";
  const ayar = sureAyari();
  const [[satir], oturumlar, cariler, siparisler, islemler] = await Promise.all([
    ekBilgiler([kayit]),
    prisma.session.findMany({ where: { userId: id, revokedAt: null }, select: { createdAt: true, lastSeenAt: true } }),
    satici
      ? prisma.doctor.findMany({
          where: { ownerSellerId: id, ...AKTIF_CARI },
          orderBy: [{ fullName: "asc" }, { id: "asc" }],
          take: PANEL_CARI_SINIRI,
          select: { id: true, fullName: true },
        })
      : [],
    satici
      ? prisma.order.findMany({
          where: { sellerId: id },
          orderBy: [{ orderDate: "desc" }, { id: "desc" }],
          take: PANEL_SIPARIS_SINIRI,
          select: { id: true, documentNo: true, orderDate: true, status: true },
        })
      : [],
    yonetici ? denetimListesi({ ...BOS_DENETIM, kullanici: id }, null, PANEL_ISLEM_SINIRI) : null,
  ]);
  return {
    kullanici: { ...satir, createdAt: kayit.createdAt, primOrani: yonetici && kayit.commissionRate ? kayit.commissionRate.toFixed(2) : null },
    acikOturum: oturumlar.filter((o) => !suresiDolduMu(o, an, ayar)).length,
    cariler,
    siparisler,
    islemler: islemler ? islemler.satirlar.map((k) => ({ id: k.id, createdAt: k.createdAt, actionType: k.actionType, ozet: k.ozet })) : null,
  };
}
