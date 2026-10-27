import Decimal from "decimal.js";
import type { Prisma } from "../src/generated/prisma/client";
import { uretBelgeNo, type BelgeOneki } from "../src/lib/belge-no";
import { prisma } from "../src/lib/db";
import { hesaplaDoktorBakiye } from "../src/lib/doctor-cari";
import { iadeYaz } from "../src/lib/iade";
import { acilisToplamlari, hesaplaSatirTutarlari, type SatirGirdisi } from "../src/lib/satir-tutarlari";
import { sevkiyatYaz } from "../src/lib/sevkiyat";
import { siparisAc } from "../src/lib/siparis-giris";
import { siparisiHazirla, teslimEdildiIsaretle } from "../src/lib/siparis-durum";
import { hesaplaStok } from "../src/lib/stok";
import { stokGirisiYaz } from "../src/lib/stok-giris";
import { tahsilatYaz } from "../src/lib/tahsilat";
import { ayAraligi, bugun, gunAraligi, simdi, takvimAyi, takvimYili } from "../src/lib/zaman";

/**
 * Demo geçmişi (tasarım 2-7b; yalnız demo/geliştirme). Mevcut demo doktor, ürün ve satıcılarıyla
 * geçmiş ayların siparişini, sevkini, teslimini, iadesini, tahsilatını ve stok girişini üretir.
 *
 * - Kayıtlar uygulamanın kendi servislerinden yazılır (siparisAc, siparisiHazirla, sevkiyatYaz,
 *   teslimEdildiIsaretle, iadeYaz, tahsilatYaz, stokGirisiYaz): numara, cari hareket, stok ve denetim
 *   kaydı ekranın ürettiğiyle aynıdır.
 * - Her olaydan hemen sonra, aynı transaction'da, olayın bütün satırları aynı Δ ile geçmişe kayar:
 *   zaman damgaları Δ kadar, `date` kolonları (sevk günü, vade) aynı gün farkı kadar — vade ile sevk
 *   arasındaki fark korunur. Olayın eklediği satır, işaret kolonu (createdAt; yoksa openedAt /
 *   changedAt) olaydan önceki andan sonra olandır; güncellediği satırda yalnız o an sonrası damgalar
 *   kayar. Kolonlar veritabanından okunur.
 * - Kaydırılan belgenin yılı değiştiyse numarası o yılın sayacından yeniden alınır (A-14: global tekil,
 *   boşluk kalıcı) ve cari harekette, denetim kaydında aynı numara yazılır.
 * - Sonda tutarlılık denetimi; ihlal varsa hata atılır ve bütün geçmiş geri alınır.
 */

type Tx = Prisma.TransactionClient;

export const DEMO_ISARETI = "admin@medikal.local";

export type DemoGecmisSecenekleri = {
  /** İçinde bulunulan aydan önceki tam ay sayısı; içinde bulunulan ay dünden geriye doludur. */
  ay: number;
  /** Sabit tohum: aynı demo verisinde aynı geçmiş. */
  tohum: number;
  /** Sipariş yoğunluğu (0–1; varsayılan 1). Testler düşük yoğunlukla koşar. */
  yogunluk?: number;
};

export type DemoGecmisOzeti = {
  baslangic: Date;
  bitis: Date;
  siparis: number;
  sevkiyat: number;
  teslim: number;
  iade: number;
  tahsilat: number;
  stokGirisi: number;
  yenidenNumaralanan: number;
};

const DAKIKA = 60_000;
const GUN = 24 * 60 * DAKIKA;
const TAHSILAT_TUTARLARI = ["500", "1000", "1500", "2500", "5000", "7500", "10000", "15000", "20000"];
const IADE_SEBEPLERI = ["Hasarlı ambalaj", "Yanlış ürün sevk edildi", "Son kullanma tarihi yakın"];
const MIKTARLAR = [2, 3, 4, 5, 6, 8, 10, 12, 15, 20];

/** Sabit tohumlu sözde rastgele (mulberry32): aynı tohum, aynı dizi. */
function rastgeleUretici(tohum: number) {
  let a = tohum >>> 0;
  const r = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const tamsayi = (a1: number, b1: number) => a1 + Math.floor(r() * (b1 - a1 + 1));
  const sec = <T>(dizi: readonly T[]): T => dizi[Math.floor(r() * dizi.length)];
  return { r, tamsayi, sec };
}

// --- Zaman: gün başı ve takvim günü zaman.ts'ten (E-1); ofset sabiti yazılmaz -------------------

/** Yerel günün `dakika`sındaki an. */
function gununDakikasi(gunBasi: Date, dakika: number): Date {
  return new Date(gunBasi.getTime() + dakika * DAKIKA);
}

/** Ertesi yerel günün başı. */
function ertesiGun(gunBasi: Date): Date {
  return gunAraligi(new Date(gunBasi.getTime() + 36 * 60 * DAKIKA)).baslangic;
}

/** Anı mesaiye alır: pazar ya da 09:00–18:00 dışıysa sonraki iş gününün sabahına (yalnız ileri). */
function mesaiye(an: Date, tamsayi: (a: number, b: number) => number): Date {
  let gunBasi = gunAraligi(an).baslangic;
  const dakika = (an.getTime() - gunBasi.getTime()) / DAKIKA;
  if (dakika >= 9 * 60 && dakika <= 18 * 60 && bugun(an).getUTCDay() !== 0) return an;
  if (dakika > 18 * 60 || bugun(an).getUTCDay() === 0) gunBasi = ertesiGun(gunBasi);
  while (bugun(gunBasi).getUTCDay() === 0) gunBasi = ertesiGun(gunBasi);
  return gununDakikasi(gunBasi, 9 * 60 + tamsayi(0, 59));
}

// --- Demo verisi ---------------------------------------------------------------------------------

type DemoVerisi = {
  yonetici: { id: string };
  operasyon: { id: string };
  doktorlar: { id: string; saticiId: string }[];
  urunler: { id: string }[];
  kargolar: { id: string }[];
  yontemler: { id: string }[];
  depoId: string;
};

async function demoVerisi(tx: Tx): Promise<DemoVerisi> {
  const yonetici = await tx.user.findUnique({ where: { email: DEMO_ISARETI }, select: { id: true, role: true } });
  if (!yonetici || yonetici.role !== "YONETICI") {
    throw new Error(`Demo işareti (${DEMO_ISARETI}) yok: önce demo seed'i (npm run db:seed:demo) çalıştırın.`);
  }
  const operasyon = await tx.user.findFirst({ where: { role: "OPERASYON" }, orderBy: { email: "asc" }, select: { id: true } });
  const doktorlar = await tx.doctor.findMany({
    where: { accountClass: "DOKTOR", ownerSellerId: { not: null } },
    orderBy: { fullName: "asc" },
    select: { id: true, ownerSellerId: true },
  });
  const urunler = await tx.product.findMany({ where: { status: "AKTIF" }, orderBy: { code: "asc" }, select: { id: true } });
  const depo = await tx.stockLocation.findFirst({ where: { type: "DEPO" }, orderBy: { code: "asc" }, select: { id: true } });
  if (!operasyon || doktorlar.length === 0 || urunler.length === 0 || !depo) {
    throw new Error("Demo verisi eksik: operasyon kullanıcısı, sahipli doktor, aktif ürün ve depo gerekir.");
  }
  return {
    yonetici,
    operasyon,
    doktorlar: doktorlar.map((d) => ({ id: d.id, saticiId: d.ownerSellerId! })),
    urunler,
    kargolar: await tx.carrier.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true } }),
    yontemler: await tx.paymentMethod.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true } }),
    depoId: depo.id,
  };
}

/** Geçmiş zaten üretildiyse (ya da veri gerçek kullanımdansa) durur: iki günden eski sevkiyat var mı. */
async function gecmisYokMu(tx: Tx, an: Date): Promise<void> {
  const sinir = gunAraligi(new Date(an.getTime() - 2 * GUN)).baslangic;
  const eski = await tx.shipment.count({ where: { shippedAt: { lt: sinir } } });
  if (eski > 0) {
    throw new Error("Veritabanında iki günden eski sevkiyat var: geçmiş zaten üretilmiş ya da veri gerçek kullanımdan. Önce demo seed'iyle sıfırlayın.");
  }
}

// --- Plan ------------------------------------------------------------------------------------------

type SiparisPlani = {
  doktorId: string;
  saticiId: string;
  satirlar: { urunId: string; miktar: number }[];
  siparisId?: string;
  kalemIdleri?: string[];
};

type Olay =
  | { tur: "SIPARIS" | "HAZIRLA" | "SEVK" | "TESLIM"; an: Date; plan: SiparisPlani }
  | { tur: "IADE"; an: Date; plan: SiparisPlani; satir: number; miktar: number }
  | { tur: "TAHSILAT"; an: Date; doktorId: string };

function planla(veri: DemoVerisi, secenek: DemoGecmisSecenekleri, an: Date) {
  const { r, tamsayi, sec } = rastgeleUretici(secenek.tohum);
  const yogunluk = secenek.yogunluk ?? 1;
  const { yil, ay } = takvimAyi(an);
  const baslangic = ayAraligi(yil, ay - secenek.ay).baslangic;
  const bitis = gunAraligi(an).baslangic; // geçmiş bugünden öncedir
  const olaylar: Olay[] = [];
  const ekle = (o: Olay) => (o.an < bitis ? (olaylar.push(o), true) : false);
  const sonra = (an1: Date, dakika: number) => mesaiye(new Date(an1.getTime() + dakika * DAKIKA), tamsayi);

  for (let gunBasi = baslangic; gunBasi < bitis; gunBasi = ertesiGun(gunBasi)) {
    const haftaGunu = bugun(gunBasi).getUTCDay();
    if (haftaGunu === 0) continue;
    const adet = sec(haftaGunu === 6 ? [0, 0, 0, 1] : [0, 1, 1, 2, 2, 3]);
    for (let i = 0; i < adet; i++) {
      if (r() >= yogunluk) continue;
      const doktor = sec(veri.doktorlar);
      const urunler = [...veri.urunler].sort(() => r() - 0.5).slice(0, tamsayi(1, Math.min(3, veri.urunler.length)));
      const plan: SiparisPlani = {
        doktorId: doktor.id,
        saticiId: doktor.saticiId,
        satirlar: urunler.map((u) => ({ urunId: u.id, miktar: sec(MIKTARLAR) })),
      };
      const siparisAni = gununDakikasi(gunBasi, tamsayi(9 * 60, 17 * 60));
      if (!ekle({ tur: "SIPARIS", an: siparisAni, plan })) continue;
      const hazirlaAni = sonra(siparisAni, tamsayi(20, 300));
      if (!ekle({ tur: "HAZIRLA", an: hazirlaAni, plan })) continue;
      const sevkAni = sonra(hazirlaAni, tamsayi(60, 24 * 60));
      if (!ekle({ tur: "SEVK", an: sevkAni, plan })) continue;
      ekle({ tur: "TESLIM", an: sonra(sevkAni, tamsayi(1, 3) * 24 * 60 + tamsayi(0, 240)), plan });
      if (r() < 0.07) {
        const satir = tamsayi(0, plan.satirlar.length - 1);
        const miktar = tamsayi(1, Math.min(3, plan.satirlar[satir].miktar));
        ekle({ tur: "IADE", an: sonra(sevkAni, tamsayi(4, 20) * 24 * 60), plan, satir, miktar });
      }
    }
  }
  // Tahsilat 12–28 günde bir; tutar olay anında o günkü bakiyeye göre seçilir.
  for (const d of veri.doktorlar) {
    for (let t = baslangic.getTime() + tamsayi(10, 20) * GUN; t < bitis.getTime(); t += tamsayi(12, 28) * GUN) {
      ekle({ tur: "TAHSILAT", an: mesaiye(gununDakikasi(gunAraligi(new Date(t)).baslangic, tamsayi(10 * 60, 16 * 60)), tamsayi), doktorId: d.id });
    }
  }
  // Kararlı sıralama: aynı anda iki olay planlandığı sırayla.
  const sirali = olaylar.map((o, i) => ({ o, i })).sort((a, b) => a.o.an.getTime() - b.o.an.getTime() || a.i - b.i);
  return { baslangic, bitis, olaylar: sirali.map((x) => x.o) };
}

// --- Kaydırma ve numara ---------------------------------------------------------------------------

type ZamanKolonlari = { tablo: string; isaret: string; zaman: string[]; gun: string[] };

/** Şemadaki zaman damgası ve `date` kolonları, tablo başına; işaret kolonu: createdAt, yoksa openedAt / changedAt. */
async function zamanKolonlari(tx: Tx): Promise<ZamanKolonlari[]> {
  const satirlar = await tx.$queryRaw<{ tablo: string; kolon: string; tur: string }[]>`
    SELECT table_name AS tablo, column_name AS kolon, data_type AS tur
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name <> '_prisma_migrations'
      AND data_type IN ('timestamp with time zone', 'timestamp without time zone', 'date')
    ORDER BY table_name, column_name`;
  const tablolar = new Map<string, { zaman: string[]; gun: string[] }>();
  for (const s of satirlar) {
    const t = tablolar.get(s.tablo) ?? { zaman: [], gun: [] };
    (s.tur === "date" ? t.gun : t.zaman).push(s.kolon);
    tablolar.set(s.tablo, t);
  }
  return [...tablolar].flatMap(([tablo, t]) => {
    const isaret = ["createdAt", "openedAt", "changedAt"].find((k) => t.zaman.includes(k));
    return isaret ? [{ tablo, isaret, ...t }] : [];
  });
}

/** Olayın eklediği ve güncellediği satırları `t0`dan `hedef`e kaydırır. */
async function kaydir(tx: Tx, kolonlar: ZamanKolonlari[], t0: Date, hedef: Date): Promise<void> {
  const fark = hedef.getTime() - t0.getTime();
  const gunFarki = Math.round((bugun(hedef).getTime() - bugun(t0).getTime()) / GUN);
  if (!Number.isInteger(fark) || !Number.isInteger(gunFarki)) throw new Error("Kaydırma farkı tam sayı değil.");
  const ileri = (k: string) => `"${k}" + ${fark} * interval '1 millisecond'`;
  for (const t of kolonlar) {
    const atamalar = [...t.zaman.map((k) => `"${k}" = ${ileri(k)}`), ...t.gun.map((k) => `"${k}" = "${k}" + ${gunFarki}`)];
    const denetim = t.tablo === "AuditLog";
    if (denetim) await bakimYolu(tx, true);
    await tx.$executeRawUnsafe(`UPDATE "${t.tablo}" SET ${atamalar.join(", ")} WHERE "${t.isaret}" >= $1`, t0);
    if (denetim) await bakimYolu(tx, false);
    const diger = t.zaman.filter((k) => k !== t.isaret);
    if (diger.length === 0) continue;
    await tx.$executeRawUnsafe(
      `UPDATE "${t.tablo}" SET ${diger.map((k) => `"${k}" = CASE WHEN "${k}" >= $1 THEN ${ileri(k)} ELSE "${k}" END`).join(", ")}
       WHERE "${t.isaret}" < $1 AND (${diger.map((k) => `"${k}" >= $1`).join(" OR ")})`,
      t0
    );
  }
}

type Belge = { onek: BelgeOneki; tablo: "Order" | "Shipment" | "ReturnNote" | "DoctorPayment"; id: string; no: string };

/** Kaydırılan belgenin yılı değiştiyse o yılın sayacından yeni numara; cari hareket ve denetim kaydı da. */
async function yenidenNumarala(tx: Tx, belge: Belge, hedef: Date): Promise<boolean> {
  if (belge.no.split("-")[1] === String(takvimYili(hedef))) return false;
  const yeni = await uretBelgeNo(belge.onek, tx, hedef);
  await tx.$executeRawUnsafe(`UPDATE "${belge.tablo}" SET "documentNo" = $1 WHERE "id" = $2`, yeni, belge.id);
  await tx.$executeRaw`UPDATE "LedgerEntry" SET "documentNo" = ${yeni} WHERE "documentNo" = ${belge.no}`;
  const desen = `%${belge.no}%`;
  await bakimYolu(tx, true);
  await tx.$executeRaw`
    UPDATE "AuditLog"
    SET "afterData" = replace("afterData", ${belge.no}, ${yeni}), "beforeData" = replace("beforeData", ${belge.no}, ${yeni}),
        "changes" = replace("changes", ${belge.no}, ${yeni})
    WHERE "afterData" LIKE ${desen} OR "beforeData" LIKE ${desen}`;
  await bakimYolu(tx, false);
  return true;
}

/**
 * Ana veri geçmişin öncesine alınır: doktor, ürün, kullanıcı, fiyat listesi, sahiplik izi, açılış
 * stoku ve bunların denetim kayıtları. Bugünün demo belgelerine dokunulmaz.
 */
async function anaVeriyiGeriAl(tx: Tx, an: Date): Promise<void> {
  for (const [tablo, kolon] of [
    ["User", "createdAt"],
    ["Doctor", "createdAt"],
    ["Product", "createdAt"],
    ["PriceList", "createdAt"],
    ["DoctorAssignment", "changedAt"],
  ] as const) {
    await tx.$executeRawUnsafe(`UPDATE "${tablo}" SET "${kolon}" = $1 WHERE "${kolon}" > $1`, an);
  }
  // Geçmiş siparişin fiyatı bugünün listesinden çözülür (siparisAc); geçerlilik başlangıcı da geçmişin öncesine.
  await tx.$executeRaw`UPDATE "PriceListItem" SET "validFrom" = ${bugun(an)} WHERE "validFrom" > ${bugun(an)}`;
  await tx.$executeRaw`
    UPDATE "StockMovement" SET "createdAt" = ${an}
    WHERE "type" = 'GIRIS' AND "createdAt" > ${an}
      AND "orderId" IS NULL AND "shipmentId" IS NULL AND "returnNoteId" IS NULL AND "consignmentIssueId" IS NULL
      AND "stockTransferId" IS NULL AND "stockAdjustmentId" IS NULL AND "importBatchId" IS NULL`;
  await bakimYolu(tx, true);
  await tx.$executeRaw`
    UPDATE "AuditLog" SET "createdAt" = ${an}
    WHERE "createdAt" > ${an} AND "entityType" IN ('User', 'Doctor', 'Product', 'PriceList', 'PriceListItem', 'DoctorAssignment')`;
  await bakimYolu(tx, false);
}

/**
 * Denetim kaydı değişmezdir (KARARLAR X-18 §(1)); geçmişe kaydırma onu bakım yoluyla günceller:
 * tetikleyiciler yalnız o cümle için kapanır (ADR-011 §11, süper kullanıcı ister). Değişen kayıtların
 * zinciri üretim commit'lendikten sonra `denetimZinciriniYenidenKur()` ile baştan kurulur.
 */
async function bakimYolu(tx: Tx, acik: boolean): Promise<void> {
  await tx.$executeRawUnsafe(`SET LOCAL session_replication_role = ${acik ? "replica" : "DEFAULT"}`);
}

/**
 * Commit anında yazılan mühürler kaydırılmadan önceki içeriği özetler; zincir kaydırılmış hâliyle
 * baştan kurulur. Ayrı transaction'dadır: üretim transaction'ının içinde kurulan mühürle commit'teki
 * mühürler çakışırdı.
 */
async function denetimZinciriniYenidenKur(): Promise<void> {
  await prisma.$transaction([
    prisma.$executeRawUnsafe("SET LOCAL session_replication_role = replica"),
    prisma.$executeRawUnsafe('DELETE FROM "AuditLogSeal"'),
    prisma.$executeRawUnsafe("SELECT denetim_zinciri_kur()"),
  ]);
}

// --- Olaylar ---------------------------------------------------------------------------------------

type Rastgele = ReturnType<typeof rastgeleUretici>;

async function uygula(tx: Tx, veri: DemoVerisi, kolonlar: ZamanKolonlari[], olay: Olay, ozet: DemoGecmisOzeti, rnd: Rastgele): Promise<void> {
  // Stok yetmiyorsa sevkten önce, aynı sabah depoya giriş (geçmişte stok eksiye düşmez).
  if (olay.tur === "SEVK") {
    for (const s of olay.plan.satirlar) {
      if ((await hesaplaStok(s.urunId, veri.depoId, undefined, tx)) >= s.miktar) continue;
      const t0 = simdi();
      await stokGirisiYaz(tx, { urunId: s.urunId, miktar: Math.max(rnd.sec([100, 150, 200, 250]), s.miktar), not: null, yapanId: veri.operasyon.id });
      await kaydir(tx, kolonlar, t0, new Date(olay.an.getTime() - rnd.tamsayi(30, 120) * DAKIKA));
      ozet.stokGirisi++;
    }
  }

  const t0 = simdi();
  let belge: Belge | null = null;
  switch (olay.tur) {
    case "SIPARIS": {
      const sonuc = await siparisAc(tx, {
        doktorId: olay.plan.doktorId,
        satirlar: olay.plan.satirlar.map((s) => ({ productId: s.urunId, quantity: s.miktar })),
        gerekce: null,
        yapan: { id: olay.plan.saticiId, rol: "SATICI" },
      });
      if (sonuc.onayaGonderildi) throw new Error("Demo siparişi onaya düştü.");
      const kalemler = await tx.orderItem.findMany({ where: { orderId: sonuc.id }, select: { id: true, productId: true } });
      olay.plan.siparisId = sonuc.id;
      olay.plan.kalemIdleri = olay.plan.satirlar.map((s) => kalemler.find((k) => k.productId === s.urunId)!.id);
      belge = { onek: "SIP", tablo: "Order", id: sonuc.id, no: sonuc.documentNo };
      ozet.siparis++;
      break;
    }
    case "HAZIRLA":
      if (!(await siparisiHazirla(tx, { siparisId: olay.plan.siparisId!, yapanId: veri.operasyon.id }))) throw new Error("Hazırlama geçişi olmadı.");
      break;
    case "SEVK": {
      const sonuc = await sevkiyatYaz(tx, {
        siparisId: olay.plan.siparisId!,
        kalemler: olay.plan.satirlar.map((s, i) => ({ siparisKalemiId: olay.plan.kalemIdleri![i], miktar: s.miktar })),
        carrierId: veri.kargolar.length > 0 ? rnd.sec(veri.kargolar).id : null,
        trackingNumber: String(rnd.tamsayi(100_000_000, 999_999_999)),
        externalDispatchNo: null,
        yapan: { id: veri.operasyon.id, rol: "OPERASYON" },
        gerekce: null,
      });
      if (sonuc.durum !== "SEVK_EDILDI") throw new Error("Demo sevkiyatı onaya düştü.");
      belge = { onek: "SVK", tablo: "Shipment", id: sonuc.sevkiyatId, no: sonuc.documentNo };
      ozet.sevkiyat++;
      break;
    }
    case "TESLIM":
      if (!(await teslimEdildiIsaretle(tx, { siparisId: olay.plan.siparisId!, yapanId: veri.operasyon.id }))) throw new Error("Teslim geçişi olmadı.");
      ozet.teslim++;
      break;
    case "IADE": {
      const sonuc = await iadeYaz(tx, {
        siparisId: olay.plan.siparisId!,
        kalemler: [{ siparisKalemiId: olay.plan.kalemIdleri![olay.satir], miktar: olay.miktar }],
        sebep: rnd.sec(IADE_SEBEPLERI),
        yapanId: veri.yonetici.id,
      });
      belge = { onek: "IAD", tablo: "ReturnNote", id: sonuc.iadeId, no: sonuc.documentNo };
      ozet.iade++;
      break;
    }
    case "TAHSILAT": {
      const cari = await hesaplaDoktorBakiye(olay.doktorId, undefined, tx);
      const adaylar = cari.yon === "BORC" ? TAHSILAT_TUTARLARI.filter((t) => cari.bakiye.gte(t)) : [];
      if (adaylar.length === 0 || veri.yontemler.length === 0) return;
      const odeme = await tahsilatYaz(tx, {
        doktorId: olay.doktorId,
        odemeYontemiId: rnd.sec(veri.yontemler).id,
        tutar: new Decimal(rnd.sec(adaylar.slice(-3))),
        odemeAni: simdi(),
        referansNo: null,
        not: null,
        yapanId: veri.yonetici.id,
      });
      belge = { onek: "THS", tablo: "DoctorPayment", id: odeme.id, no: odeme.documentNo };
      ozet.tahsilat++;
      break;
    }
  }
  await kaydir(tx, kolonlar, t0, olay.an);
  if (belge && (await yenidenNumarala(tx, belge, olay.an))) ozet.yenidenNumaralanan++;
}

// --- Tutarlılık ------------------------------------------------------------------------------------

/** İleriye dönük iş tarihleri: "gelecek tarihli kayıt" sayılmaz (vade, teklif geçerliliği, fiyat bitişi). */
const ILERI_TARIHLER = new Set([
  "LedgerEntry.dueDate",
  "Order.quoteValidUntil",
  "DoctorPayment.expectedValueDate",
  "PriceListItem.validTo",
  "DueDateChange.oldDueDate",
  "DueDateChange.newDueDate",
]);

const brut = (satirlar: SatirGirdisi[]) => hesaplaSatirTutarlari(satirlar).toplam.toplam;

/**
 * Tutarlılık denetimi; ihlal listesi döner (boş = tutarlı).
 * - Gelecek tarihli kayıt yok (ileriye dönük iş tarihleri hariç).
 * - `seedBasi` verilirse: seed'in yazıp kaydırmadığı satır yok (işaret kolonu seed başından sonra).
 * - Bağlı kayıttan önce tarihli kayıt yok: sevk ≥ sipariş, iade ≥ ilk sevk, cari hareket ≥ belgesi,
 *   sipariş ve tahsilat ≥ doktorun açılışı.
 * - Her doktorun cari bakiyesi (`hesaplaDoktorBakiye`) kaynak belgelerden yeniden hesapla aynı.
 */
export async function tutarlilikDenetle(tx: Tx, an: Date, seedBasi?: Date): Promise<string[]> {
  const ihlaller: string[] = [];
  const say = async (sql: string, ...parametreler: unknown[]) =>
    Number((await tx.$queryRawUnsafe<{ n: bigint }[]>(sql, ...parametreler))[0].n);

  for (const t of await zamanKolonlari(tx)) {
    for (const k of t.zaman) {
      if (ILERI_TARIHLER.has(`${t.tablo}.${k}`)) continue;
      const n = await say(`SELECT count(*) AS n FROM "${t.tablo}" WHERE "${k}" > $1`, an);
      if (n > 0) ihlaller.push(`${t.tablo}.${k}: ${n} gelecek tarihli kayıt`);
    }
    for (const k of t.gun) {
      if (ILERI_TARIHLER.has(`${t.tablo}.${k}`)) continue;
      const n = await say(`SELECT count(*) AS n FROM "${t.tablo}" WHERE "${k}" > $1`, bugun(an));
      if (n > 0) ihlaller.push(`${t.tablo}.${k}: ${n} gelecek tarihli kayıt`);
    }
    if (seedBasi) {
      const n = await say(`SELECT count(*) AS n FROM "${t.tablo}" WHERE "${t.isaret}" >= $1`, seedBasi);
      if (n > 0) ihlaller.push(`${t.tablo}: ${n} satır geçmişe kaydırılmamış`);
    }
  }

  const sira: [string, string][] = [
    ["sevk siparişten önce", `SELECT count(*) AS n FROM "Shipment" s JOIN "Order" o ON o."id" = s."orderId" WHERE s."shippedAt" < o."orderDate"`],
    [
      "iade ilk sevkten önce",
      `SELECT count(*) AS n FROM "ReturnNote" r JOIN "ReturnNoteItem" ri ON ri."returnNoteId" = r."id"
       WHERE r."createdAt" < (SELECT min(s."shippedAt") FROM "ShipmentItem" si JOIN "Shipment" s ON s."id" = si."shipmentId" WHERE si."orderItemId" = ri."orderItemId")`,
    ],
    ["cari hareket sevkiyattan önce", `SELECT count(*) AS n FROM "LedgerEntry" l JOIN "Shipment" s ON s."id" = l."shipmentId" WHERE l."createdAt" < s."createdAt"`],
    ["cari hareket iadeden önce", `SELECT count(*) AS n FROM "LedgerEntry" l JOIN "ReturnNote" r ON r."id" = l."returnNoteId" WHERE l."createdAt" < r."createdAt"`],
    ["cari hareket tahsilattan önce", `SELECT count(*) AS n FROM "LedgerEntry" l JOIN "DoctorPayment" p ON p."id" = l."paymentId" WHERE l."createdAt" < p."createdAt"`],
    ["sipariş doktorun açılışından önce", `SELECT count(*) AS n FROM "Order" o JOIN "Doctor" d ON d."id" = o."doctorId" WHERE o."orderDate" < d."createdAt"`],
    ["tahsilat doktorun açılışından önce", `SELECT count(*) AS n FROM "DoctorPayment" p JOIN "Doctor" d ON d."id" = p."doctorId" WHERE p."paidAt" < d."createdAt"`],
  ];
  for (const [ad, sql] of sira) {
    const n = await say(sql);
    if (n > 0) ihlaller.push(`${ad}: ${n} kayıt`);
  }

  // Cari bakiye: cari hareketlerden (hesaplaDoktorBakiye) ve kaynak belgelerden ayrı ayrı.
  const doktorlar = await tx.doctor.findMany({ select: { id: true, fullName: true } });
  for (const d of doktorlar) {
    const sevkler = await tx.shipment.findMany({
      where: { order: { doctorId: d.id }, status: { not: "IPTAL" } },
      select: { items: { select: { quantity: true, orderItem: { select: { unitPrice: true, listPrice: true, vatRate: true, isFree: true } } } } },
    });
    const iadeler = await tx.returnNote.findMany({
      where: { doctorId: d.id },
      select: { items: { select: { quantity: true, vatRate: true, orderItem: { select: { unitPrice: true, listPrice: true, isFree: true } } } } },
    });
    const odemeler = await tx.doctorPayment.findMany({ where: { doctorId: d.id, status: "AKTIF" }, select: { amount: true, direction: true } });
    const beklenen = acilisToplamlari([
      ...sevkler.map((s) => ({
        tutar: brut(s.items.map((i) => ({ birimFiyat: i.orderItem.unitPrice, listeFiyat: i.orderItem.listPrice, miktar: i.quantity, kdvOrani: i.orderItem.vatRate, bedelsiz: i.orderItem.isFree }))),
        yon: "BORC" as const,
      })),
      ...iadeler.map((r) => ({
        tutar: brut(r.items.map((i) => ({ birimFiyat: i.orderItem.unitPrice, listeFiyat: i.orderItem.listPrice, miktar: i.quantity, kdvOrani: i.vatRate, bedelsiz: i.orderItem.isFree }))),
        yon: "ALACAK" as const,
      })),
      ...odemeler.map((p) => ({ tutar: p.amount, yon: p.direction })),
    ]);
    const cari = await hesaplaDoktorBakiye(d.id, undefined, tx);
    if (cari.yon !== beklenen.netYon || !cari.bakiye.abs().equals(beklenen.net)) {
      ihlaller.push(`${d.fullName}: cari bakiye ${cari.bakiye.toFixed(2)} (${cari.yon}), belgelerden ${beklenen.net.toFixed(2)} (${beklenen.netYon})`);
    }
  }
  return ihlaller;
}

// --- Giriş -----------------------------------------------------------------------------------------

/** Geçmişi tek transaction'da üretir; tutarlılık denetimi başarısızsa hepsi geri alınır. */
export async function demoGecmisUret(secenek: DemoGecmisSecenekleri): Promise<DemoGecmisOzeti> {
  const seedBasi = simdi();
  const ozet = await prisma.$transaction(
    async (tx) => {
      const veri = await demoVerisi(tx);
      await gecmisYokMu(tx, seedBasi);
      const { baslangic, bitis, olaylar } = planla(veri, secenek, seedBasi);
      // Ana veri geçmişin ilk gününden bir hafta önce, sabah 09:00'da açılmış olur.
      await anaVeriyiGeriAl(tx, gununDakikasi(gunAraligi(new Date(baslangic.getTime() - 7 * GUN)).baslangic, 9 * 60));
      const kolonlar = await zamanKolonlari(tx);
      const ozet: DemoGecmisOzeti = { baslangic, bitis, siparis: 0, sevkiyat: 0, teslim: 0, iade: 0, tahsilat: 0, stokGirisi: 0, yenidenNumaralanan: 0 };
      const rnd = rastgeleUretici(secenek.tohum + 1);
      for (const olay of olaylar) await uygula(tx, veri, kolonlar, olay, ozet, rnd);
      const ihlaller = await tutarlilikDenetle(tx, simdi(), seedBasi);
      if (ihlaller.length > 0) {
        throw new Error(`Tutarlılık denetimi başarısız; geçmiş geri alındı:\n- ${ihlaller.join("\n- ")}`);
      }
      return ozet;
    },
    { timeout: 30 * 60_000, maxWait: 30_000 }
  );
  await denetimZinciriniYenidenKur();
  return ozet;
}
