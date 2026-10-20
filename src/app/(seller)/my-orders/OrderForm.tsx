"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { SubmitButton } from "@/components/form";
import { SonucGosterimi, type SonucDurumu } from "@/components/Sonuc";
import { formatla, paraOku } from "@/lib/money";
import { hesaplaSatirTutarlari } from "@/lib/satir-tutarlari";
import { createOrder } from "./actions";

type Product = {
  id: string;
  name: string;
  code: string;
  /** Varsayılan listenin fiyatı, KDV hariç ham metin; listede yoksa `null`. */
  listPrice: string | null;
  vatRate: string; // %, ham metin
  stock: number;
};

/** Boş bırakılan fiyat = ürünün liste fiyatı. */
type Row = { key: number; productId: string; quantity: number; priceText: string };

export type DoctorOption = {
  id: string;
  fullName: string;
  clinic: string | null;
  title: string | null;
};

export default function OrderForm({
  products,
  doctors,
}: {
  products: Product[];
  doctors: DoctorOption[];
}) {
  const [state, formAction] = useActionState<SonucDurumu, FormData>(createOrder, null);
  const [rows, setRows] = useState<Row[]>([
    { key: 1, productId: "", quantity: 1, priceText: "" },
  ]);

  const productMap = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products]
  );

  /**
   * Girilen metin = net birim fiyat. Boşsa liste fiyatı. Fiyat girişi daima
   * KDV hariçtir — toggle C6'da söküldü (Ü-3 §(3), `pricing.fiyatGirisiKdvDahil = false`).
   * Geçersiz metin `null` döner ve satır gönderilmez.
   */
  function birimFiyatOf(row: Row, p: Product | undefined): string | null {
    if (!p?.listPrice) return null;
    const text = row.priceText.trim();
    if (text === "") return p.listPrice;
    const d = paraOku(text);
    return d ? formatla(d, "ham") : null;
  }

  const satirlar = rows.map((row) => {
    const p = productMap.get(row.productId);
    return { row, product: p, birimFiyat: birimFiyatOf(row, p) };
  });
  const gecerli = satirlar.filter((c) => c.product?.listPrice && c.birimFiyat && c.row.quantity > 0);

  // Önizleme sunucuyla aynı fonksiyondan geçer: tek yuvarlama noktası (C-6 §(5)).
  const hesap = hesaplaSatirTutarlari(
    gecerli.map((c) => ({
      birimFiyat: c.birimFiyat!,
      listeFiyat: c.product!.listPrice!,
      kdvOrani: c.product!.vatRate,
      miktar: c.row.quantity,
    }))
  );
  const tutarOf = new Map(gecerli.map((c, i) => [c.row.key, hesap.satirlar[i]]));
  const computed = satirlar.map((c) => ({ ...c, totals: tutarOf.get(c.row.key) }));

  // Sunucuya net birim fiyat ham metin olarak gider (kanonik değer nettir, X-5).
  const items = gecerli.map((c) => ({
    productId: c.row.productId,
    quantity: c.row.quantity,
    birimFiyat: c.birimFiyat!,
  }));

  function addRow() {
    setRows((rs) => [
      ...rs,
      { key: Date.now(), productId: "", quantity: 1, priceText: "" },
    ]);
  }
  function removeRow(key: number) {
    setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.key !== key) : rs));
  }
  function updateRow(key: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="items" value={JSON.stringify(items)} />

      {/* Doktor artık serbest metin değil, portföydeki bir varlık (BRK-02).
          Yalnızca kendi doktorları listelenir; sahiplik sunucuda da doğrulanır. */}
      <div className="max-w-md">
        <label
          htmlFor="doctorId"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Doktor
        </label>
        {doctors.length === 0 ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Portföyünüzde doktor yok.{" "}
            <Link href="/my-doctors/new" className="font-medium underline">
              Önce doktor ekleyin
            </Link>
            .
          </p>
        ) : (
          <select
            id="doctorId"
            name="doctorId"
            required
            defaultValue=""
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
          >
            <option value="" disabled>
              Seçiniz...
            </option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title ? `${d.title} ` : ""}
                {d.fullName}
                {d.clinic ? ` — ${d.clinic}` : ""}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">
            Sipariş Kalemleri
          </h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={addRow}
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              + Kalem Ekle
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {computed.map(({ row, product: p, totals }) => (
            <div
              key={row.key}
              className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 p-2"
            >
              <div className="min-w-[220px] flex-1">
                <label
                  htmlFor={`product-${row.key}`}
                  className="mb-1 block text-xs text-slate-500"
                >
                  Ürün
                </label>
                <select
                  id={`product-${row.key}`}
                  value={row.productId}
                  onChange={(e) =>
                    updateRow(row.key, { productId: e.target.value, priceText: "" })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
                >
                  <option value="">Seçiniz...</option>
                  {products.map((prod) => (
                    <option key={prod.id} value={prod.id} disabled={!prod.listPrice}>
                      {prod.name} ({prod.code}) — Stok: {prod.stock}
                      {prod.listPrice ? "" : " — fiyat listesinde yok"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-24">
                <label
                  htmlFor={`qty-${row.key}`}
                  className="mb-1 block text-xs text-slate-500"
                >
                  Miktar
                </label>
                <input
                  id={`qty-${row.key}`}
                  type="number"
                  min={1}
                  value={row.quantity}
                  onChange={(e) =>
                    updateRow(row.key, {
                      quantity: Math.max(1, parseInt(e.target.value, 10) || 1),
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </div>

              {/* FR-12: satıcı birim fiyatı değiştirebilir. Taban fiyat reddi C6'da
                  söküldü (GÇ-8, A-10); yerine taban etiketi 1B'de gelir. */}
              <div className="w-32">
                <label
                  htmlFor={`price-${row.key}`}
                  className="mb-1 block text-xs text-slate-500"
                >
                  Birim (KDV hariç)
                </label>
                <input
                  id={`price-${row.key}`}
                  type="number"
                  step="0.01"
                  min={0}
                  placeholder={p?.listPrice ?? "—"}
                  value={row.priceText}
                  onChange={(e) =>
                    updateRow(row.key, { priceText: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm tabular-nums outline-none focus:border-slate-500"
                />
              </div>

              {/* Salt-okunur gösterimler: form kontrolü olmadıkları için <label> değil. */}
              <div className="w-24 text-right">
                <span className="mb-1 block text-xs text-slate-500">KDV</span>
                <div className="py-2 text-sm tabular-nums text-slate-500">
                  {totals ? formatla(totals.kdvTutar) : "—"}
                </div>
              </div>

              <div className="w-28 text-right">
                <span className="mb-1 block text-xs text-slate-500">Tutar (KDV hariç)</span>
                <div className="py-2 text-sm font-medium tabular-nums text-slate-900">
                  {totals ? formatla(totals.matrah) : "—"}
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeRow(row.key)}
                className="px-2 py-2 text-sm text-slate-400 hover:text-red-600"
                aria-label="Kalemi sil"
              >
                ✕
              </button>

            </div>
          ))}
        </div>
      </div>

      {/* Toplamlar kalemlerin TOPLAMIDIR; yeniden yuvarlanmaz (C-6 §(5)). */}
      <div className="flex justify-end">
        <dl className="w-64 space-y-1 text-sm">
          <div className="flex justify-between text-slate-600">
            <dt>Ara Toplam (KDV hariç)</dt>
            <dd className="tabular-nums">{formatla(hesap.toplam.matrah)}</dd>
          </div>
          <div className="flex justify-between text-slate-600">
            <dt>KDV</dt>
            <dd className="tabular-nums">{formatla(hesap.toplam.kdvTutar)}</dd>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-1 font-semibold text-slate-900">
            <dt>Genel Toplam</dt>
            <dd className="tabular-nums">{formatla(hesap.toplam.toplam)}</dd>
          </div>
        </dl>
      </div>

      <SonucGosterimi sonuc={state} />

      <div className="flex items-center gap-3">
        <SubmitButton disabled={items.length === 0}>
          Siparişi Oluştur
        </SubmitButton>
        <Link
          href="/my-orders"
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          İptal
        </Link>
      </div>
    </form>
  );
}
