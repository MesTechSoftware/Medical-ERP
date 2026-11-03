import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { IsHatasi } from "@/lib/hata";
import { sevkiyatYaz, type SevkiyatGirdisi } from "@/lib/sevkiyat";
import { kpiGetir } from "@/lib/kpi/getir";
import { kalemMiktarlari } from "@/lib/siparis";
import type { TopluSecim } from "@/lib/kargo-listesi/suzgec";
import { sert, yumusak, type Bildirim, type IslemSonucu } from "@/lib/sonuc";

/**
 * Sevk eyleminin çekirdeği (spec Ü-24 §4, A-3-3): kart formu (`shipOrder`) ve toplu kargo (`topluKargola`)
 * buradan yazar. Kendi transaction'ında `sevkiyatYaz` + başarıda denetim kaydı; iş hatası (`IsHatasi`)
 * transaction'ı geri alır ve sonuç olarak döner. Önbellek yenileme ve yönlendirme eylemlerdedir.
 */

export type SevkSonucu =
  | { durum: "SEVK_EDILDI"; documentNo: string; tamamlandi: boolean }
  | { durum: "ONAYA_GONDERILDI"; bildirimler: Bildirim[] }
  | { durum: "HATA"; sonuc: IslemSonucu };

export async function siparisiSevkEt(g: SevkiyatGirdisi): Promise<SevkSonucu> {
  try {
    return await prisma.$transaction(async (tx): Promise<SevkSonucu> => {
      const sevk = await sevkiyatYaz(tx, g);
      if (sevk.durum === "ONAYA_GONDERILDI") {
        return { durum: "ONAYA_GONDERILDI", bildirimler: sevk.ihlaller.map((i) => yumusak(i.kuralKodu, i.parametreler)) };
      }
      await createAuditLog(
        {
          actorId: g.yapan.id,
          action: AUDIT_ACTIONS.ORDER_STATUS_CHANGE,
          entityType: "Order",
          entityId: g.siparisId,
          after: { sevkiyat: sevk.documentNo, kalemler: g.kalemler, tamamlandi: sevk.tamamlandi },
        },
        tx
      );
      return { durum: "SEVK_EDILDI", documentNo: sevk.documentNo, tamamlandi: sevk.tamamlandi };
    });
  } catch (e) {
    if (e instanceof IsHatasi) return { durum: "HATA", sonuc: e.sonuc };
    throw e;
  }
}

/** Toplu kargoda bir siparişin sonucu; teknik hata (X-3) yalnız o siparişi düşürür, referansla döner. */
export type TopluSatirSonucu = {
  siparisId: string;
  documentNo: string | null;
  cari: string | null;
  sonuc: SevkSonucu | { durum: "TEKNIK"; referans: string };
};

/**
 * Toplu kargo (12-A, A-3-3): seçim sırasıyla, her sipariş **ayrı** `siparisiSevkEt` — kalanı olan her kalem
 * kalanının tamamıyla; firma ortak, takip ve irsaliye satırın; gerekçe yok (negatif stokta onay gereken
 * sipariş yazılmaz, kısmi panelden gerekçeyle gönderilir). Bir siparişin sonucu öbürlerini etkilemez.
 * Kalan kilit dışında okunur; `sevkiyatYaz` kilit altında yeniden doğrular. Beklenmeyen (teknik) hata
 * yutulmaz: `kpiGetir` kapsülüyle log satırına referansla yazılır, sipariş "teknik hata" sonucuyla döner ve
 * sıradaki siparişe geçilir (X-3 §(2)/(4); spec §5: bir siparişin hatası öbürlerini durdurmaz).
 */
export async function topluKargo(
  secimler: readonly TopluSecim[],
  carrierId: string | null,
  yapan: SevkiyatGirdisi["yapan"]
): Promise<TopluSatirSonucu[]> {
  const siparisler = await prisma.order.findMany({
    where: { id: { in: secimler.map((s) => s.siparisId) } },
    select: {
      id: true,
      documentNo: true,
      doctor: { select: { fullName: true } },
      items: { select: { id: true, quantity: true, shipmentItems: { select: { quantity: true } }, returnItems: { select: { quantity: true } } } },
    },
  });
  const sonuclar: TopluSatirSonucu[] = [];
  for (const secim of secimler) {
    const o = siparisler.find((x) => x.id === secim.siparisId);
    if (!o) {
      sonuclar.push({
        siparisId: secim.siparisId,
        documentNo: null,
        cari: null,
        sonuc: { durum: "HATA", sonuc: new IsHatasi([sert("SIPARIS_DURUMU_UYGUN_DEGIL")]).sonuc },
      });
      continue;
    }
    const kalemler = o.items.flatMap((k) => {
      const { kalan } = kalemMiktarlari(k);
      return kalan > 0 ? [{ siparisKalemiId: k.id, miktar: kalan }] : [];
    });
    if (kalemler.length === 0) {
      // Kalanı kalmamış (başkası tamamen sevk etmiş) sipariş artık kargo beklemiyordur.
      sonuclar.push({ siparisId: o.id, documentNo: o.documentNo, cari: o.doctor.fullName, sonuc: { durum: "HATA", sonuc: new IsHatasi([sert("SIPARIS_DURUMU_UYGUN_DEGIL")]).sonuc } });
      continue;
    }
    const r = await kpiGetir(
      () =>
        siparisiSevkEt({
          siparisId: o.id,
          kalemler,
          carrierId,
          trackingNumber: secim.takip,
          externalDispatchNo: secim.irsaliye,
          yapan,
          gerekce: null,
        }),
      { yol: "/shipping", kullaniciId: yapan.id }
    );
    sonuclar.push({
      siparisId: o.id,
      documentNo: o.documentNo,
      cari: o.doctor.fullName,
      sonuc: r.tamam ? r.deger : { durum: "TEKNIK", referans: r.referans },
    });
  }
  return sonuclar;
}
