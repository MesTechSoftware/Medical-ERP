import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";
import { uretBelgeNo } from "@/lib/belge-no";
import { cozumleBirimFiyat } from "@/lib/fiyat";
import { prisma } from "@/lib/db";
import { formatla } from "@/lib/money";
import { hesaplaStok, varsayilanDepoId } from "@/lib/stok";
import { IsHatasi } from "@/lib/hata";
import { BEDELSIZ_ONAY_GEREKIR, blokKontrolleriniCalistir, type BlokIhlali } from "@/lib/onay-blogu";
import { policy } from "@/lib/policy";
import { personelSiparisSaticisi, siparisSahibiniKilitle } from "@/lib/sahiplik";
import { engel, sert, yumusak, type Bildirim, type IslemSonucu } from "@/lib/sonuc";
import { birimFiyatPozitifMi, iskontoTavaniAsimi } from "@/lib/satir-tutarlari";
import { priceSchema, quantitySchema } from "@/lib/validation";
import { bugun } from "@/lib/zaman";

/**
 * Sipariş açma — satıcı ekranı ve personel (yönetici/operasyon) ekranının ortak yolu. Satıcı yalnız
 * kendi doktoruna sipariş girer (RULE-02); personel her cariye girer, satıcı sipariş anındaki sahiptir
 * (X-13 §(3)), bayide satıcı yoktur (X-8 §(3)/(4), D-2 §(1)).
 */
const SATIRLAR = z
  .array(
    z.object({
      productId: z.string().min(1),
      quantity: quantitySchema,
      // Birim fiyat değiştirilebilir (FR-12, X-5 §(9) `birim_fiyat`); daima NET, ham ondalık metin
      // (X-5 §(6)). Girilmezse liste fiyatı kullanılır (X-5 §(9)).
      birimFiyat: priceSchema.optional(),
      // A-2: bedelsiz satır — sebep kapalı katalogdan; DIGER'de açıklama zorunlu (A-2 eki 20.10.2026).
      bedelsiz: z
        .object({
          sebep: z.enum(["NUMUNE", "PROMOSYON", "MAL_FAZLASI", "DIGER"]),
          aciklama: z.string().trim().max(200).optional(),
        })
        .optional(),
    })
  )
  .min(1);
export type SiparisSatirlari = z.infer<typeof SATIRLAR>;

/** Form `items` alanı (JSON) → satırlar; bozuk girdi iş hatasıdır (X-3 §(4)). */
export function siparisSatirlariniOku(ham: string | null): { satirlar: SiparisSatirlari } | { hata: IslemSonucu } {
  let veri: unknown;
  try {
    veri = JSON.parse(ham || "[]");
  } catch (e) {
    if (e instanceof SyntaxError) return { hata: engel("SIPARIS_KALEMI_GECERSIZ") };
    throw e;
  }
  const r = SATIRLAR.safeParse(veri);
  if (!r.success) return { hata: engel("SIPARIS_KALEMI_GECERSIZ") };
  if (r.data.some((l) => l.bedelsiz?.sebep === "DIGER" && !l.bedelsiz.aciklama)) return { hata: engel("BEDELSIZ_ACIKLAMA_ZORUNLU") };
  return { satirlar: r.data };
}

export async function siparisAc(
  tx: Prisma.TransactionClient,
  g: {
    doktorId: string;
    satirlar: SiparisSatirlari;
    gerekce: string | null;
    yapan: { id: string; rol: "YONETICI" | "OPERASYON" | "SATICI" };
    /** İskonto tavanı (yüzde). Verilmezse `policy.pricing.iskontoTavani` (varsayılan `null` = devrede değil); testte eşik verilir. */
    iskontoTavani?: number | null;
  }
): Promise<{ id: string; documentNo: string; onayaGonderildi: boolean }> {
  // Kilit sırası: doktor satırı → belge sayacı (ADR-008 §(1)); stok yazılmadığı için ürün kilidi yok.
  // Satıcı: sahip kilit altında yeniden okunur; arada devir olduysa reddedilir (X-17 §(8)).
  let saticiId: string | null;
  if (g.yapan.rol === "SATICI") {
    const sahip = await siparisSahibiniKilitle(tx, g.doktorId, g.yapan.id);
    if (sahip.durum === "HATA") throw new IsHatasi([sert(sahip.kuralKodu)]);
    saticiId = g.yapan.id;
  } else {
    const s = await personelSiparisSaticisi(tx, g.doktorId);
    if (s.durum === "HATA") throw new IsHatasi([sert(s.kuralKodu, {}, "doctorId")]);
    saticiId = s.saticiId;
  }
  const doktor = await tx.doctor.findUniqueOrThrow({ where: { id: g.doktorId }, select: { fullName: true, paymentTermDays: true } });

  const gun = bugun();
  const tavan = g.iskontoTavani === undefined ? policy.pricing.iskontoTavani : g.iskontoTavani;
  const items = [];
  const ihlaller: BlokIhlali[] = [];
  // Kalem hataları toplanır, hepsi birlikte döner (X-4 §(7)).
  const hatalar: Bildirim[] = [];
  for (const line of g.satirlar) {
    const product = await tx.product.findUnique({
      where: { id: line.productId },
      select: { id: true, name: true, status: true, taxRate: { select: { rate: true } } },
    });
    if (!product) {
      hatalar.push(sert("URUN_BULUNAMADI"));
      continue;
    }
    if (product.status !== "AKTIF") {
      hatalar.push(sert("URUN_PASIF", { urun: product.name }));
      continue;
    }
    // Liste fiyatı tek yoldan çözülür; atanmış listede satır yoksa varsayılana düşülmez (X-10 §(3)).
    // Barem satırın miktarına, geçerlilik siparişin gününe bakar (B-5, B-6).
    const fiyat = await cozumleBirimFiyat(product.id, g.doktorId, { miktar: line.quantity, gun }, tx);
    if (fiyat.durum === "HATA") {
      hatalar.push(sert("FIYAT_COZUMLENEMEDI", { urun: product.name }));
      continue;
    }
    // A-10-5: bedelsiz olmayan satırın birim fiyatı sıfırdan büyük olmalıdır (DB CHECK aynı koşulu zorlar).
    const birimFiyat = line.bedelsiz ? "0" : (line.birimFiyat ?? fiyat.listeFiyat);
    if (!line.bedelsiz && !birimFiyatPozitifMi(birimFiyat)) {
      hatalar.push(sert("BIRIM_FIYAT_GECERSIZ", { urun: product.name }));
      continue;
    }
    // Fiyat ve oran sipariş anında DONDURULUR (RULE-04, C-6 §(2-a)). Bedelsiz satırın liste fiyatı
    // görünür kalır, tutarı 0'dır (A-2, C-6 §(8)).
    items.push({
      productId: product.id,
      quantity: line.quantity,
      listPrice: fiyat.listeFiyat,
      unitPrice: birimFiyat,
      vatRate: product.taxRate.rate,
      isFree: !!line.bedelsiz,
      freeReason: line.bedelsiz?.sebep ?? null,
      freeNote: line.bedelsiz?.aciklama || null,
    });
    // A-10-4: tavan doluysa ve satırın iskontosu onu aşıyorsa onay bloğu; bedelsiz satıra dokunmaz.
    const asim = line.bedelsiz ? null : iskontoTavaniAsimi(fiyat.listeFiyat, birimFiyat, tavan);
    if (asim) ihlaller.push({ kuralKodu: "ISKONTO_TAVANI", parametreler: { urun: product.name, oran: asim, tavan: tavan! } });
    if (line.bedelsiz && BEDELSIZ_ONAY_GEREKIR[line.bedelsiz.sebep]) {
      ihlaller.push({ kuralKodu: "BEDELSIZ_ONAYI", parametreler: { urun: product.name, sebep: line.bedelsiz.sebep } });
    }
  }
  if (hatalar.length > 0) throw new IsHatasi(hatalar);

  const documentNo = await uretBelgeNo("SIP", tx);
  const order = await tx.order.create({
    data: {
      documentNo,
      sellerId: saticiId,
      doctorId: g.doktorId,
      // Bugünkü akış onaylı sipariş açar; teklif aşaması ayrı akıştır (A-5).
      stage: "ONAYLI",
      status: "BEKLIYOR",
      // Vade tarihi cari harekettedir (X-11 §(4)); siparişte gün sayısı durur (A-7).
      paymentTermDays: doktor.paymentTermDays ?? policy.finance.odemeVadesiGunVarsayilan,
      items: { create: items },
    },
  });

  // A-8 · A-2 eki: onay isteyen bedelsiz satır siparişe blok açar; yönetici girerse aynı işlemde ONAY.
  // Gerekçesiz gönderimde hiçbir şey yazılmaz (diyalog).
  const blok = await blokKontrolleriniCalistir(tx, { belgeTipi: "SIP", belgeId: order.id, ihlaller, yapan: g.yapan, gerekce: g.gerekce });
  if (blok.durum === "ONAY_GEREKLI") throw new IsHatasi(blok.ihlaller.map((i) => yumusak(i.kuralKodu, i.parametreler)));
  const onayaGonderildi = blok.durum === "BASARILI_UYARILI" && blok.onayaGonderildi;

  // Stok sipariş anında düşmez; çıkış sevkiyatta doğar (A-3, `sevkiyatYaz()`).
  await createAuditLog(
    {
      actorId: g.yapan.id,
      action: AUDIT_ACTIONS.ORDER_CREATE,
      entityType: "Order",
      entityId: order.id,
      after: { documentNo, doctorId: g.doktorId, doctorName: doktor.fullName, itemCount: g.satirlar.length, saticiId, onayaGonderildi },
    },
    tx
  );
  return { id: order.id, documentNo, onayaGonderildi };
}

/**
 * Sipariş formunun ürün seçenekleri (satıcı ve personel ekranı). Önizleme varsayılan listeyle yapılır;
 * sunucu siparişte carinin listesini yeniden çözer (X-10). Stok satılabilir (depo) stoktur (A-4).
 */
export async function siparisFormuUrunleri() {
  const urunler = await prisma.product.findMany({
    where: { status: "AKTIF" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, code: true, taxRate: { select: { rate: true } } },
  });
  const depoId = await varsayilanDepoId();
  return Promise.all(
    urunler.map(async (u) => {
      const fiyat = await cozumleBirimFiyat(u.id, null, { miktar: 1, gun: bugun() });
      return {
        id: u.id,
        name: u.name,
        code: u.code,
        listPrice: fiyat.durum === "TAMAM" ? formatla(fiyat.listeFiyat, "ham") : null,
        vatRate: formatla(u.taxRate.rate, "ham"),
        stock: await hesaplaStok(u.id, depoId),
      };
    })
  );
}

/** Form önizleme action'larının dönüşü: `listeFiyat` çözülemediyse `null`. */
export type FiyatOnizlemeSonucu = IslemSonucu & { listeFiyat: string | null };

/**
 * Sipariş formu önizlemesi (A-10-2): seçili cari ve miktar için liste fiyatı, `cozumleBirimFiyat()` ile —
 * sunucunun siparişte kullandığı yolun aynısı. Çözülemezse `null` (varsayılana düşülmez, X-10 §(3)).
 */
export async function siparisFiyatiOnizle(doktorId: string, urunId: string, miktar: number): Promise<string | null> {
  if (!Number.isInteger(miktar) || miktar <= 0) return null;
  const fiyat = await cozumleBirimFiyat(urunId, doktorId || null, { miktar, gun: bugun() });
  return fiyat.durum === "TAMAM" ? formatla(fiyat.listeFiyat, "ham") : null;
}
