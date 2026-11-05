import Decimal from "decimal.js";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { sayilanBelgeler } from "@/lib/sayilan-belgeler";
import { kalanMiktar, SIPARIS_SATIRI, siparisToplami } from "@/lib/siparis";
import { bilgi, type Bildirim } from "@/lib/sonuc";
import { bugun, gunAraligi } from "@/lib/zaman";

type Db = Prisma.TransactionClient | typeof prisma;

/**
 * `hesaplaDoktorBakiye(doktor, tarih?)` — cari bakiyenin TEK kaynağı (K-2, tek çağrı
 * noktası listesinin 2. maddesi). Bayi de aynı fonksiyonu kullanır (X-8 §(2)).
 *
 * Bakiye ayrı bir kolonda TUTULMAZ; cari hareketlerin toplamıdır (RULE-08, X-11 §(6)).
 * Bütün hareket tipleri girer — açılış ve vade farkı bakiyenin parçasıdır; sayılan
 * belgeler filtresi burada uygulanmaz. Toplama veritabanında `SUM()` ile yapılır;
 * uygulamada parasal aritmetik yoktur (X-5 §(4)). Tutarlar KDV dahildir (C-6 §(6)).
 *
 * `tarih` verilirse sonuç o günün İstanbul günü sonu itibarıyladır (C-2 §(3), E-1 §(5)).
 * Negatif bakiye avanstır (K-2); ekran çıplak negatif göstermez, `yon` ile etiketler.
 */

export type BakiyeYonu = "BORC" | "ALACAK" | "KAPALI";

export type DoktorBakiye = {
  toplamBorc: Decimal;
  toplamAlacak: Decimal;
  bakiye: Decimal; // işaretli: pozitif = doktor borçlu, negatif = avans
  yon: BakiyeYonu;
};

type Satir = { borc: Prisma.Decimal; alacak: Prisma.Decimal; bakiye: Prisma.Decimal };

/** İşaretli bakiye ifadesi; bakiye de risk de bunu okur. */
const BAKIYE = Prisma.sql`COALESCE(SUM(CASE WHEN "direction" = 'BORC' THEN "amount" ELSE -"amount" END), 0)`;

/** İşaretli bakiyenin yönü (K-2): pozitif borç, negatif avans. */
export function bakiyeYonu(bakiye: Decimal): BakiyeYonu {
  return bakiye.gt(0) ? "BORC" : bakiye.lt(0) ? "ALACAK" : "KAPALI";
}

export async function hesaplaDoktorBakiye(doktorId: string, tarih?: Date, db: Db = prisma): Promise<DoktorBakiye> {
  const tarihFiltresi = tarih ? Prisma.sql`AND "createdAt" < ${gunAraligi(tarih).bitis}` : Prisma.empty;
  const [s] = await db.$queryRaw<Satir[]>`
    SELECT COALESCE(SUM(CASE WHEN "direction" = 'BORC' THEN "amount" END), 0) AS borc,
           COALESCE(SUM(CASE WHEN "direction" = 'ALACAK' THEN "amount" END), 0) AS alacak,
           ${BAKIYE} AS bakiye
    FROM "LedgerEntry"
    WHERE "doctorId" = ${doktorId} ${tarihFiltresi}`;
  const bakiye = new Decimal(s.bakiye);
  return {
    toplamBorc: new Decimal(s.borc),
    toplamAlacak: new Decimal(s.alacak),
    bakiye,
    yon: bakiyeYonu(bakiye),
  };
}

/**
 * Sınır anlarındaki işaretli bakiyeler (KPI trendi; K-2: pozitif borç, negatif avans) — her
 * sınırdan önceki hareketlerin toplamı, tek sorguda. `hesaplaDoktorBakiye` ile aynı ifade.
 */
export async function bakiyeSerisi(doktorId: string, sinirlar: readonly Date[], db: Db = prisma): Promise<Decimal[]> {
  if (sinirlar.length === 0) return [];
  const sutunlar = sinirlar.map(
    (sinir, i) =>
      Prisma.sql`COALESCE(SUM(CASE WHEN "createdAt" < ${sinir} THEN (CASE WHEN "direction" = 'BORC' THEN "amount" ELSE -"amount" END) END), 0) AS ${Prisma.raw(`"b${i}"`)}`
  );
  const [s] = await db.$queryRaw<Record<string, Prisma.Decimal>[]>`
    SELECT ${Prisma.join(sutunlar)} FROM "LedgerEntry" WHERE "doctorId" = ${doktorId}`;
  return sinirlar.map((_, i) => new Decimal(s[`b${i}`]));
}

/**
 * `VADESI_GECMIS_HAREKET` — X-6 §(6) ve 20.10.2026 eki. `BILGI` kademesidir; tutar değil varlık:
 * cari borçluyken (bakiye yönü `BORC`) vadesi `gun`den önce olan, ters kayıtla çevrilmemiş bir
 * `BORC` hareketi varsa en eski vadesiyle döner. Tutar gösterilmez (§(7)); tahsilat borçlarla
 * eşleştirilmez (§(1)/(2)) — tarih o borcun açık olduğunu söylemez.
 *
 * `bakiye` verilirse (aynı istekte riskle ya da kartla zaten hesaplanmışsa) yeniden hesaplanmaz ve vade okuması
 * onunla aynı turda gider. Verilmezse okumalar sıralıdır ve vade yalnız borçluyken okunur (transaction içinde
 * paralel sorgu gönderilmez).
 */
export async function vadesiGecmisUyarisi(
  doktorId: string,
  { gun = bugun(), db = prisma, bakiye }: { gun?: Date; db?: Db; bakiye?: Promise<Decimal> } = {}
): Promise<Bildirim | null> {
  const enEskiVade = () =>
    db.ledgerEntry.findFirst({
      where: { doctorId: doktorId, direction: "BORC", dueDate: { lt: gun }, reversal: { is: null } },
      orderBy: { dueDate: "asc" },
      select: { dueDate: true },
    });
  const kendiBakiyesi = () => hesaplaDoktorBakiye(doktorId, undefined, db).then((x) => x.bakiye);
  let b: Decimal;
  let enEski: { dueDate: Date | null } | null;
  if (bakiye) {
    // Verilen bakiye riskle/kartla aynı turda hesaplanıyor; vade okuması onu beklemez. Verilen okuma düşerse
    // uyarı kendi bakiyesini hesaplar — paylaşılan okumanın hatası uyarıyı (ve sayfayı) birlikte düşürmesin.
    [b, enEski] = await Promise.all([bakiye.catch(kendiBakiyesi), enEskiVade()]);
  } else {
    b = await kendiBakiyesi();
    if (bakiyeYonu(b) !== "BORC") return null;
    enEski = await enEskiVade();
  }
  if (bakiyeYonu(b) !== "BORC") return null;
  if (!enEski?.dueDate) return null;
  return bilgi("VADESI_GECMIS_HAREKET", { enEskiVade: enEski.dueDate.toISOString().slice(0, 10) });
}

/**
 * `hesaplaDoktorRisk(doktor)` — kredi riskinin TEK kaynağı (A-12, tek çağrı noktası
 * listesinin 3. maddesi).
 *
 * Risk = cari bakiye + açık sipariş tutarı. Açık sipariş sayılan sipariş kümesidir
 * (`ONAYLI`, iptal edilmemiş); yalnız sevk edilmemiş miktar girer. Taban brüttür (C-6):
 * satır tutarı `siparisToplami()` → `hesaplaSatirTutarlari()`'dan gelir, bedelsiz satır 0'dır.
 * Eşleştirme kullanılmaz (X-11 §(8)). Toplama veritabanındadır (X-5 §(4)).
 *
 * Limit aşımı bilgi kademesidir (§0.3): fonksiyon işlemi durdurmaz, `limitAsildi` döner.
 */

export type DoktorRisk = {
  bakiye: Decimal;
  acikSiparis: Decimal;
  risk: Decimal;
  krediLimiti: Decimal | null; // null = limitsiz
  limitAsildi: boolean;
};

export async function hesaplaDoktorRisk(doktorId: string, db: Db = prisma): Promise<DoktorRisk> {
  const r = (await hesaplaDoktorRiskleri([doktorId], db)).get(doktorId);
  if (!r) throw new Error(`Doktor bulunamadı: ${doktorId}`);
  return r;
}

/**
 * Doktorların riski tek seferde (cari listesi — A-12-5). Tekli `hesaplaDoktorRisk` bunu çağırır:
 * toplu ve tekli aynı yoldur. Açık sipariş satır bazında `siparisToplami()` ile yuvarlanır; bakiye
 * ve risk toplaması veritabanındadır (X-5 §(4)). Bulunamayan kimlik haritada yoktur.
 */
export async function hesaplaDoktorRiskleri(idler: readonly string[], db: Db = prisma): Promise<Map<string, DoktorRisk>> {
  const sonuc = new Map<string, DoktorRisk>();
  if (idler.length === 0) return sonuc;
  const [doktorlar, satirlar] = await Promise.all([
    db.doctor.findMany({ where: { id: { in: [...idler] } }, select: { id: true, creditLimit: true } }),
    db.orderItem.findMany({
      where: { order: { ...sayilanBelgeler.siparis, doctorId: { in: [...idler] } } },
      select: { ...SIPARIS_SATIRI, shipmentItems: { select: { quantity: true } }, order: { select: { doctorId: true } } },
    }),
  ]);
  if (doktorlar.length === 0) return sonuc;

  const acikSatirlar = new Map<string, typeof satirlar>();
  for (const s of satirlar) {
    const kalan = kalanMiktar(s);
    if (kalan > 0) acikSatirlar.set(s.order.doctorId, [...(acikSatirlar.get(s.order.doctorId) ?? []), { ...s, quantity: kalan }]);
  }
  const acik = new Map(doktorlar.map((d) => [d.id, siparisToplami(acikSatirlar.get(d.id) ?? []).toplam]));

  const degerler = Prisma.join(doktorlar.map((d) => Prisma.sql`(${d.id}, ${acik.get(d.id)!.toFixed(2)}::numeric)`));
  const bakiyeler = await db.$queryRaw<{ id: string; bakiye: Prisma.Decimal; risk: Prisma.Decimal }[]>`
    SELECT v.id, ${BAKIYE} AS bakiye, ${BAKIYE} + v.acik AS risk
    FROM (VALUES ${degerler}) AS v(id, acik)
    LEFT JOIN "LedgerEntry" ON "LedgerEntry"."doctorId" = v.id
    GROUP BY v.id, v.acik`;
  const r = new Map(bakiyeler.map((b) => [b.id, b]));

  for (const d of doktorlar) {
    const risk = new Decimal(r.get(d.id)!.risk);
    const krediLimiti = d.creditLimit === null ? null : new Decimal(d.creditLimit);
    sonuc.set(d.id, {
      bakiye: new Decimal(r.get(d.id)!.bakiye),
      acikSiparis: acik.get(d.id)!,
      risk,
      krediLimiti,
      limitAsildi: krediLimiti !== null && risk.gt(krediLimiti),
    });
  }
  return sonuc;
}
