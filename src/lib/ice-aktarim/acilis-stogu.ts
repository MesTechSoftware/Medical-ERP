import { sert, type Bildirim } from "@/lib/sonuc";
import { hesaplaStok, stokHareketiYaz, varsayilanDepoId } from "@/lib/stok";
import { quantitySchema } from "@/lib/validation";
import { satirBildirimi, type IceAktarimTanimi, type Kolon } from "./tanim";

/**
 * `ACILIS_STOGU` — elle giriş yolu olmayan tür (X-16 §(1)); konum bazında (B-4, K-7 §(2)). Her satır bir
 * `GIRIS` hareketidir ve tek yazım yolundan (`stokHareketiYaz`) geçer. Parti geri alınmaz; hata
 * `DZL` / `ACILIS_DUZELTME` ile düzeltilir (D-6, B-7, X-12 §(3)).
 */
type Acilis = { productId: string; locationId: string; quantity: number };

const KOLONLAR: readonly Kolon[] = [
  { baslik: "Ürün kodu", alan: "productId", zorunlu: true, aciklama: "Kayıtlı bir ürünün kodu.", ornek: "MED-001", kaynak: "K-7 §(2)" },
  { baslik: "Konum kodu", alan: "locationId", zorunlu: false, aciklama: "Boşsa varsayılan depo.", ornek: "MERKEZ", kaynak: "B-4, A-4" },
  { baslik: "Miktar", alan: "quantity", zorunlu: true, aciklama: "Pozitif tam sayı.", ornek: "120", kaynak: "K-7 §(2)" },
];

export const ACILIS_STOGU_TANIMI: IceAktarimTanimi<Acilis> = {
  tur: "ACILIS_STOGU",
  tablo: "StockMovement",
  kolonlar: KOLONLAR,
  sistemDoldurur: ["id", "type"],
  kumeKurallari: [],
  importtanErisilemez: [],

  async denetle(db, satirlar) {
    const [urunler, konumlar, depo] = await Promise.all([
      db.product.findMany({ select: { id: true, code: true } }),
      db.stockLocation.findMany({ where: { isActive: true }, select: { id: true, code: true, name: true } }),
      varsayilanDepoId(db),
    ]);
    const urunId = new Map(urunler.map((u) => [u.code, u.id]));
    const konumId = new Map(konumlar.map((k) => [k.code.toUpperCase(), k.id]));
    // Tekrar çözümlenmiş konuma bakar: boş konum ile varsayılan deponun kodu aynı konumdur.
    const anahtar = (d: Record<string, string | null>) =>
      `${d.productId?.trim()}|${d.locationId ? (konumId.get(d.locationId.trim().toUpperCase()) ?? d.locationId) : depo}`;
    const tekrar = new Map<string, number[]>();
    for (const s of satirlar) tekrar.set(anahtar(s.deger), [...(tekrar.get(anahtar(s.deger)) ?? []), s.no]);

    const hatalar: Bildirim[] = [];
    const yazilacak: Acilis[] = [];
    for (const s of satirlar) {
      const d = s.deger;
      const b: Bildirim[] = [];
      const urun = d.productId ? urunId.get(d.productId.trim()) : undefined;
      if (!d.productId) b.push(sert("ALAN_ZORUNLU", {}, "productId"));
      else if (!urun) b.push(sert("URUN_BULUNAMADI", {}, "productId"));
      const konum = d.locationId ? konumId.get(d.locationId.trim().toUpperCase()) : depo;
      if (!konum) b.push(sert("STOK_KONUMU_BULUNAMADI", {}, "locationId"));
      const ham = (d.quantity ?? "").trim();
      const miktar = quantitySchema.safeParse(/^\d+$/.test(ham) ? parseInt(ham, 10) : NaN);
      if (!ham) b.push(sert("ALAN_ZORUNLU", {}, "quantity"));
      else if (!miktar.success) b.push(sert("GECERSIZ_MIKTAR", {}, "quantity"));
      const ayni = tekrar.get(anahtar(d)) ?? [];
      if (ayni.length > 1) b.push(sert("ACILIS_STOGU_TEKRAR", { satirlar: ayni.join(", ") }, "productId"));
      hatalar.push(...b.map((x) => satirBildirimi(x, s.no, KOLONLAR)));
      if (b.length === 0 && urun && konum && miktar.success) yazilacak.push({ productId: urun, locationId: konum, quantity: miktar.data });
    }

    // Bilgi: hareketi zaten olan ürün × konum — açılış ikinci kez yükleniyor olabilir.
    let mevcut = 0;
    for (const a of yazilacak) if ((await hesaplaStok(a.productId, a.locationId, undefined, db)) !== 0) mevcut++;
    const ad = new Map(konumlar.map((k) => [k.id, k.name]));
    const konumAdedi = new Map<string, number>();
    for (const a of yazilacak) konumAdedi.set(ad.get(a.locationId) ?? a.locationId, (konumAdedi.get(ad.get(a.locationId) ?? a.locationId) ?? 0) + 1);
    return {
      hatalar,
      yazilacak,
      ozet: [
        ...[...konumAdedi].sort().map(([k, n]) => ({ etiket: `Konum: ${k} (ürün)`, deger: n })),
        { etiket: "Toplam miktar", deger: yazilacak.reduce((t, a) => t + a.quantity, 0) },
        { etiket: "Stoğu zaten olan ürün × konum", deger: mevcut, bilgi: mevcut > 0 },
      ],
    };
  },

  async yaz(tx, yazilacak, parti) {
    await stokHareketiYaz(
      tx,
      yazilacak.map((a) => ({ ...a, type: "GIRIS" as const, note: "Açılış stoğu", importBatchId: parti.id, createdById: parti.yapanId }))
    );
  },
};
