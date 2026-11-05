import type { Prisma } from "@/generated/prisma/client";
import { uretBelgeNo } from "@/lib/belge-no";
import { sevkiyatHareketiYaz } from "@/lib/cari-hareket";
import { IsHatasi } from "@/lib/hata";
import { onSevkiyatTamamlandi } from "@/lib/olaylar";
import { blokKontrolleriniCalistir, sonBlokDurumu, type BlokIhlali } from "@/lib/onay-blogu";
import { policy } from "@/lib/policy";
import { hesaplaSatirTutarlari } from "@/lib/satir-tutarlari";
import { sert, yumusak, type Bildirim } from "@/lib/sonuc";
import { negatifStokOnizle, stokHareketiYaz, stokKilitle, varsayilanDepoId } from "@/lib/stok";
import { bugun, gunEkle, simdi } from "@/lib/zaman";
import { kalanMiktar } from "@/lib/siparis";

/**
 * Sevkiyat — A-3. Bir sipariş satırına birden çok sevkiyat bağlanabilir; **doktor borcu, satıcı
 * primi ve stok çıkışı sevkiyat anında doğar** (A-3, X-11 §(1), X-14 §(3), B-7).
 *
 * Tek transaction'da: ürün satırları kilitlenir (aynı satırı iki sevkiyat aynı anda aşamaz,
 * ADR-008 §(1) sırası: ürün → belge sayacı) → kalan miktar kilit altında okunur → `SVK` numarası →
 * sevkiyat + satırları (prim oranı donar) → stok çıkışı (kaynağı sevkiyat) → `SEVKIYAT` · `BORC`
 * cari hareketi (tutar `hesaplaSatirTutarlari()`'ndan, vade sevk gününden işler — A-7).
 *
 * İş kuralı ihlalinde `IsHatasi` fırlatır (çağıran transaction'ı geri alır, X-4 §(2)).
 *
 * Negatif stok yumuşak kısıttır (B-4, A-8 eki 20.10.2026): hiçbir şey yazılmadan önce denetlenir,
 * blok **siparişe** bağlanır ve sonuç doğuran adım olan sevkiyatı durdurur. Gerekçesiz →
 * `ONAY_GEREKLI` · `YONETICI` gerekçeyle sevk eder (blok aynı işlemde `ONAY`) · diğer rol
 * gerekçe yazarsa sevkiyat yazılmaz, yalnız blok yazılır (`ONAYA_GONDERILDI`). Siparişin son
 * `NEGATIF_STOK` bloğu kararsızsa sevkiyat durur; `ONAY`'lıysa siparişin sevkiyatları sorulmadan
 * geçer; `RED`'den sonra yeni gerekçe yeni blok açar.
 *
 * Bedelsiz satır onayı (`BEDELSIZ_ONAYI`, A-2 eki 20.10.2026) sipariş girişinde açılır;
 * son bloğu kararsızsa ya da `RED`'se sevkiyat durur.
 */
export type SevkiyatGirdisi = {
  siparisId: string;
  kalemler: readonly { siparisKalemiId: string; miktar: number }[];
  carrierId: string | null;
  trackingNumber: string | null;
  externalDispatchNo: string | null;
  yapan: { id: string; rol: "YONETICI" | "OPERASYON" | "SATICI" };
  /** Yumuşak kısıt gerekçesi (A-8); ilk gönderimde boştur. */
  gerekce: string | null;
};

export type SevkiyatSonucu =
  | { durum: "SEVK_EDILDI"; sevkiyatId: string; documentNo: string; tamamlandi: boolean }
  | { durum: "ONAYA_GONDERILDI"; ihlaller: BlokIhlali[] };

export async function sevkiyatYaz(tx: Prisma.TransactionClient, girdi: SevkiyatGirdisi): Promise<SevkiyatSonucu> {
  // 0 bu sevkiyatta gönderilmeyen kalemdir; tam sayı olmayan ya da negatif miktar reddedilir.
  const kalemler = girdi.kalemler.filter((k) => k.miktar !== 0);
  if (kalemler.length === 0 || kalemler.some((k) => !Number.isInteger(k.miktar) || k.miktar < 0)) {
    throw new IsHatasi([sert("SEVK_KALEMI_YOK")]);
  }

  const siparis = await tx.order.findUnique({
    where: { id: girdi.siparisId },
    select: {
      id: true,
      paymentTermDays: true,
      doctorId: true,
      doctor: { select: { accountClass: true } },
      seller: { select: { commissionRate: true } },
      items: { select: { id: true, productId: true } },
    },
  });
  if (!siparis) throw new IsHatasi([sert("SIPARIS_DURUMU_UYGUN_DEGIL")]);

  // Ürün satırları kilitlenir (ADR-008 sırası; yeni kilit kaynağı yok). Aynı siparişin eşzamanlı
  // sevkiyatı ve iptali (`cancelOrder`) aynı ürünleri kilitler; durum ve kalan kilit altında okunur.
  await stokKilitle(tx, siparis.items.map((i) => i.productId));
  const durum = await tx.order.findUniqueOrThrow({ where: { id: siparis.id }, select: { stage: true, status: true } });
  if (durum.stage !== "ONAYLI" || durum.status !== "HAZIRLANIYOR") {
    throw new IsHatasi([sert("SIPARIS_DURUMU_UYGUN_DEGIL")]);
  }
  const satirlar = await tx.orderItem.findMany({
    where: { orderId: siparis.id },
    select: {
      id: true,
      productId: true,
      quantity: true,
      unitPrice: true,
      listPrice: true,
      vatRate: true,
      isFree: true,
      product: { select: { name: true } },
      shipmentItems: { select: { quantity: true } },
    },
  });
  const kalan = new Map(
    satirlar.map((s) => [s.id, { ...s, kalan: kalanMiktar(s) }])
  );

  const hatalar: Bildirim[] = [];
  for (const k of kalemler) {
    const s = kalan.get(k.siparisKalemiId);
    if (!s) hatalar.push(sert("SEVK_KALEMI_YOK"));
    else if (k.miktar > s.kalan) hatalar.push(sert("SEVK_MIKTARI_ASILDI", { urun: s.product.name, kalan: s.kalan }));
  }
  if (hatalar.length > 0) throw new IsHatasi(hatalar);

  // X-14 §(3): uygulanan oran satıra donar — satıcının özel oranı, yoksa varsayılan; BAYI ve bedelsizde boş.
  const primOrani =
    siparis.doctor.accountClass === "BAYI"
      ? null
      : (siparis.seller?.commissionRate ?? (siparis.seller ? policy.finance.primOraniVarsayilan : null));

  const konumId = await varsayilanDepoId(tx);
  const cikislar = kalemler.map((k) => ({
    productId: kalan.get(k.siparisKalemiId)!.productId,
    locationId: konumId,
    type: "CIKIS" as const,
    quantity: k.miktar,
    note: "Sevkiyat çıkışı",
    createdById: girdi.yapan.id,
  }));

  // A-8: bloklar kilit altında okunur; numara ve hiçbir kayıt bundan önce yazılmaz.
  // Bedelsiz satır onayı (A-2 eki) siparişte açılır; ihlal kalıcıdır — son blok ONAY değilse durur.
  const bedelsiz = await sonBlokDurumu("SIP", siparis.id, "BEDELSIZ_ONAYI", tx);
  if (bedelsiz === "BEKLIYOR") throw new IsHatasi([sert("ONAY_BEKLIYOR")]);
  if (bedelsiz === "RED") throw new IsHatasi([sert("ONAY_REDDEDILDI")]);
  const onay = await sonBlokDurumu("SIP", siparis.id, "NEGATIF_STOK", tx);
  if (onay === "BEKLIYOR") throw new IsHatasi([sert("ONAY_BEKLIYOR")]);
  if (onay !== "ONAY") {
    const urunAdi = new Map(satirlar.map((s) => [s.productId, s.product.name]));
    const blok = await blokKontrolleriniCalistir(tx, {
      belgeTipi: "SIP",
      belgeId: siparis.id,
      ihlaller: (await negatifStokOnizle(tx, cikislar)).map((n) => ({
        kuralKodu: n.kuralKodu,
        parametreler: { urun: urunAdi.get(n.urunId) ?? "", sonra: n.sonra },
      })),
      yapan: girdi.yapan,
      gerekce: girdi.gerekce,
    });
    if (blok.durum === "ONAY_GEREKLI") {
      throw new IsHatasi(blok.ihlaller.map((i) => yumusak(i.kuralKodu, i.parametreler)));
    }
    if (blok.durum === "BASARILI_UYARILI" && blok.onayaGonderildi) {
      return { durum: "ONAYA_GONDERILDI", ihlaller: blok.ihlaller };
    }
  }

  const gun = bugun();
  const documentNo = await uretBelgeNo("SVK", tx);
  const sevkiyat = await tx.shipment.create({
    data: {
      documentNo,
      orderId: siparis.id,
      carrierId: girdi.carrierId,
      trackingNumber: girdi.trackingNumber,
      externalDispatchNo: girdi.externalDispatchNo,
      shippedOn: gun,
      shippedAt: simdi(),
      status: "KARGOLANDI",
      items: {
        create: kalemler.map((k) => ({
          orderItemId: k.siparisKalemiId,
          quantity: k.miktar,
          commissionRate: kalan.get(k.siparisKalemiId)!.isFree ? null : primOrani,
        })),
      },
    },
  });

  await stokHareketiYaz(
    tx,
    cikislar.map((c) => ({ ...c, shipmentId: sevkiyat.id }))
  );

  // Borç sevk edilen miktarın toplamıdır; her sevkiyat kendi satırlarını yuvarlar (A-3 C-6 eki).
  const { toplam } = hesaplaSatirTutarlari(
    kalemler.map((k) => {
      const s = kalan.get(k.siparisKalemiId)!;
      return { birimFiyat: s.unitPrice, listeFiyat: s.listPrice, miktar: k.miktar, kdvOrani: s.vatRate, bedelsiz: s.isFree };
    })
  );
  // Tutar daima pozitiftir (X-5 §(7)); yalnız bedelsiz satırlı sevkiyat borç doğurmaz (A-2).
  if (toplam.toplam.gt(0)) {
    await sevkiyatHareketiYaz(tx, {
      doctorId: siparis.doctorId,
      tutar: toplam.toplam,
      vade: gunEkle(gun, siparis.paymentTermDays),
      documentNo,
      shipmentId: sevkiyat.id,
      yapanId: girdi.yapan.id,
    });
  }

  const tamamlandi = [...kalan.values()].every(
    (s) => s.kalan - (kalemler.find((k) => k.siparisKalemiId === s.id)?.miktar ?? 0) === 0
  );
  if (tamamlandi) {
    await tx.order.update({ where: { id: siparis.id }, data: { status: "KARGOLANDI" } });
  }
  onSevkiyatTamamlandi({ sevkiyatId: sevkiyat.id, siparisId: siparis.id, siparisTamamlandi: tamamlandi }); // D-1
  return { durum: "SEVK_EDILDI", sevkiyatId: sevkiyat.id, documentNo, tamamlandi };
}
