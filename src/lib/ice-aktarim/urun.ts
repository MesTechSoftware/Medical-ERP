import { sert, type Bildirim } from "@/lib/sonuc";
import { TABAN_ETIKETI, MATRAH } from "@/lib/taban";
import { urunAcmaDenetle, urunAcmaYaz, type DenetlenmisUrun } from "@/lib/urun";
import { satirBildirimi, type IceAktarimTanimi, type Kolon } from "./tanim";

/**
 * `URUN` içe aktarımı — ürün ekranının toplu hâli (X-16 §(1)). KDV oranı **kodla** gelir (C-6);
 * ÜTS kolonu okunmaz (K-10) — şablonda yoktur, dosyada varsa tanınmayan kolon olarak reddedilir.
 * Liste fiyatı varsayılan listenin satırı olarak yazılır (X-10 §(5)).
 */
const KOLONLAR: readonly Kolon[] = [
  { baslik: "Ürün kodu", alan: "code", zorunlu: true, aciklama: "Benzersiz.", ornek: "MED-001", kaynak: "FR-16" },
  { baslik: "Ürün adı", alan: "name", zorunlu: true, aciklama: "", ornek: "Cerrahi Eldiven (Kutu)", kaynak: "FR-16" },
  { baslik: "KDV oranı kodu", alan: "taxRateId", zorunlu: true, aciklama: "KDV oranı tanım tablosundaki kod.", ornek: "KDV20", kaynak: "C-6, D-6" },
  { baslik: "Liste fiyatı", alan: "listPrice", zorunlu: true, aciklama: `${TABAN_ETIKETI[MATRAH]}; varsayılan fiyat listesine yazılır.`, ornek: "125.50", kaynak: "X-10 §(5)" },
  { baslik: "Durum", alan: "status", zorunlu: false, izinli: ["AKTIF", "PASIF"], aciklama: "Boşsa aktif.", ornek: "AKTIF", kaynak: "FR-16" },
];

export const URUN_TANIMI: IceAktarimTanimi<DenetlenmisUrun> = {
  tur: "URUN",
  tablo: "Product",
  kolonlar: KOLONLAR,
  sistemDoldurur: ["id"],
  kumeKurallari: [{ anahtar: "ürün kodu", kapsam: "veritabani+parti", kuralKodu: "URUN_KODU_KAYITLI", kisit: "Product_code_key" }],
  importtanErisilemez: [],

  async denetle(db, satirlar) {
    const oranlar = await db.taxRate.findMany({ select: { id: true, code: true } });
    const oranId = new Map(oranlar.map((o) => [o.code.toUpperCase(), o.id]));
    const kodSatirlari = new Map<string, number[]>();
    for (const s of satirlar) {
      const k = s.deger.code?.trim();
      if (k) kodSatirlari.set(k, [...(kodSatirlari.get(k) ?? []), s.no]);
    }
    const hatalar: Bildirim[] = [];
    const yazilacak: DenetlenmisUrun[] = [];
    for (const s of satirlar) {
      const d = s.deger;
      const on: Bildirim[] = [];
      const durum = d.status?.trim().toUpperCase();
      if (durum && durum !== "AKTIF" && durum !== "PASIF") on.push(sert("DEGER_KATALOG_DISI", { deger: d.status! }, "status"));
      const oranKodu = d.taxRateId?.trim().toUpperCase();
      const oran = oranKodu ? oranId.get(oranKodu) : undefined;
      if (oranKodu && !oran) on.push(sert("VERGI_ORANI_BULUNAMADI", {}, "taxRateId"));
      const ayni = kodSatirlari.get(d.code?.trim() ?? "") ?? [];
      if (ayni.length > 1) on.push(sert("URUN_KODU_KAYITLI", { satirlar: ayni.join(", ") }, "code"));
      const { hatalar: kural, urun } = await urunAcmaDenetle(db, {
        name: d.name ?? "",
        code: d.code ?? "",
        taxRateId: oran ?? "",
        listPrice: d.listPrice ?? "",
        status: durum === "PASIF" ? "PASIF" : "AKTIF",
      });
      const alanlar = new Set(on.map((b) => b.alan));
      // Kod boşsa çözümleyici hata vermediği için ALAN_ZORUNLU kuraldan gelir; oranda tekrar etmesin.
      const tum = [...on, ...kural.filter((b) => !alanlar.has(b.alan) && !(b.alan === "taxRateId" && oranKodu && !oran))];
      hatalar.push(...tum.map((b) => satirBildirimi(b, s.no, KOLONLAR)));
      if (tum.length === 0 && urun) yazilacak.push(urun);
    }
    return {
      hatalar,
      yazilacak,
      ozet: [
        { etiket: "Aktif ürün", deger: yazilacak.filter((u) => u.veri.status === "AKTIF").length },
        { etiket: "Pasif ürün", deger: yazilacak.filter((u) => u.veri.status === "PASIF").length },
      ],
    };
  },

  async yaz(tx, yazilacak, parti) {
    for (const u of yazilacak) await urunAcmaYaz(tx, u, { id: parti.yapanId, partiId: parti.id });
  },

  /** Ürün hiçbir belgede ve hareket kaydında yoksa; başka listelerdeki satırı da yoksa parti geri alınır. */
  async geriAl(tx, partiId) {
    const bagli = await tx.product.count({
      where: {
        importBatchId: partiId,
        OR: [
          { orderItems: { some: {} } },
          { stockMovements: { some: {} } },
          { consignmentItems: { some: {} } },
          { transferItems: { some: {} } },
          { adjustmentItems: { some: {} } },
          { priceListItems: { some: { NOT: { importBatchId: partiId } } } },
        ],
      },
    });
    if (bagli > 0) return "PARTI_GERI_ALINAMAZ";
    await tx.priceListItem.deleteMany({ where: { importBatchId: partiId } });
    await tx.product.deleteMany({ where: { importBatchId: partiId } });
    return null;
  },
};
