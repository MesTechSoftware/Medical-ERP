import { fiyatSatiriDenetle, fiyatSatiriYaz, type DenetlenmisFiyatSatiri } from "@/lib/fiyat-listesi";
import { sert, type Bildirim } from "@/lib/sonuc";
import { MATRAH, TABAN_ETIKETI } from "@/lib/taban";
import { satirBildirimi, type IceAktarimTanimi, type Kolon } from "./tanim";

/**
 * `FIYAT_LISTESI` içe aktarımı — liste ekranının toplu hâli (X-16 §(1)). Tarih kolonu yoktur
 * (X-16 §(12)): satırlar süresizdir. İçe aktarım yalnız satır açar (§(9)); aynı (liste, ürün,
 * `min_adet`) satırı kayıtlıysa ya da dosyada tekrarlanıyorsa `FIYAT_SATIRI_CAKISIYOR`.
 */
const KOLONLAR: readonly Kolon[] = [
  { baslik: "Liste kodu", alan: "priceListId", zorunlu: true, aciklama: "Kayıtlı bir fiyat listesinin kodu.", ornek: "BAYI", kaynak: "X-10 §(1)" },
  { baslik: "Ürün kodu", alan: "productId", zorunlu: true, aciklama: "Kayıtlı bir ürünün kodu.", ornek: "MED-001", kaynak: "X-10 §(1)" },
  { baslik: "Min. adet", alan: "minQuantity", zorunlu: false, aciklama: "Barem alt sınırı; boşsa 1.", ornek: "10", kaynak: "B-6" },
  { baslik: "Liste fiyatı", alan: "listPrice", zorunlu: true, aciklama: `${TABAN_ETIKETI[MATRAH]}.`, ornek: "95.00", kaynak: "X-10 §(1)" },
];

export const FIYAT_LISTESI_TANIMI: IceAktarimTanimi<DenetlenmisFiyatSatiri> = {
  tur: "FIYAT_LISTESI",
  tablo: "PriceListItem",
  kolonlar: KOLONLAR,
  sistemDoldurur: ["id", "minQuantity"],
  kumeKurallari: [
    { anahtar: "(liste, ürün, min_adet) — Faz 1'de tarih yok", kapsam: "veritabani+parti", kuralKodu: "FIYAT_SATIRI_CAKISIYOR", kisit: "PriceListItem_tarih_cakismasi_excl" },
  ],
  importtanErisilemez: [],

  async denetle(db, satirlar) {
    const [listeler, urunler] = await Promise.all([
      db.priceList.findMany({ select: { id: true, code: true } }),
      db.product.findMany({ select: { id: true, code: true } }),
    ]);
    const listeId = new Map(listeler.map((l) => [l.code.toUpperCase(), l.id]));
    const urunId = new Map(urunler.map((u) => [u.code, u.id]));
    const anahtar = (d: Record<string, string | null>) =>
      `${d.priceListId?.trim().toUpperCase()}|${d.productId?.trim()}|${(d.minQuantity ?? "1").trim()}`;
    const anahtarSatirlari = new Map<string, number[]>();
    for (const s of satirlar) anahtarSatirlari.set(anahtar(s.deger), [...(anahtarSatirlari.get(anahtar(s.deger)) ?? []), s.no]);

    const hatalar: Bildirim[] = [];
    const yazilacak: DenetlenmisFiyatSatiri[] = [];
    const listeAdedi = new Map<string, number>();
    for (const s of satirlar) {
      const d = s.deger;
      const on: Bildirim[] = [];
      const lKod = d.priceListId?.trim().toUpperCase();
      const uKod = d.productId?.trim();
      const liste = lKod ? listeId.get(lKod) : undefined;
      const urun = uKod ? urunId.get(uKod) : undefined;
      if (!lKod) on.push(sert("ALAN_ZORUNLU", {}, "priceListId"));
      if (uKod && !urun) on.push(sert("URUN_BULUNAMADI", {}, "productId"));
      const ayni = anahtarSatirlari.get(anahtar(d)) ?? [];
      if (ayni.length > 1) on.push(sert("FIYAT_SATIRI_CAKISIYOR", { satirlar: ayni.join(", ") }, "minQuantity"));
      const { hatalar: kural, satir, mevcutId } = await fiyatSatiriDenetle(db, {
        priceListId: liste ?? "",
        productId: urun ?? "",
        minQuantity: d.minQuantity ?? "1",
        listPrice: d.listPrice ?? "",
      });
      if (satir && mevcutId) on.push(sert("FIYAT_SATIRI_CAKISIYOR", {}, "minQuantity"));
      const alanlar = new Set(on.map((b) => b.alan));
      const tum = [...on, ...kural.filter((b) => !alanlar.has(b.alan))];
      hatalar.push(...tum.map((b) => satirBildirimi(b, s.no, KOLONLAR)));
      if (tum.length === 0 && satir) {
        yazilacak.push(satir);
        listeAdedi.set(lKod!, (listeAdedi.get(lKod!) ?? 0) + 1);
      }
    }
    return {
      hatalar,
      yazilacak,
      ozet: [...listeAdedi].sort().map(([kod, n]) => ({ etiket: `Liste ${kod}`, deger: n })),
    };
  },

  async yaz(tx, yazilacak, parti) {
    for (const s of yazilacak) await fiyatSatiriYaz(tx, s, { id: parti.yapanId, partiId: parti.id });
  },

  /** Fiyat satırı belgeye bağlanmaz (sipariş fiyatı dondurur); parti her zaman geri alınabilir. */
  async geriAl(tx, partiId) {
    await tx.priceListItem.deleteMany({ where: { importBatchId: partiId } });
    return null;
  },
};
