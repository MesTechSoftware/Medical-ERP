"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { FormError, SubmitButton } from "@/components/form";
import { formatTRY, kurusToTl, tlToKurus } from "@/lib/money";
import { grossFromNet, lineTotals, netFromGross, sumLineTotals } from "@/lib/vat";
import { VAT_MODE_COOKIE, type VatMode } from "@/lib/vat-mode";
import { createOrder, type OrderFormState } from "./actions";

type Product = {
  id: string;
  name: string;
  code: string;
  netListPrice: bigint; // kuruş, KDV hariç
  netMinPrice: bigint; // kuruş, KDV hariç
  vatRate: number; // %
  stock: number;
};

function persistVatMode(mode: VatMode) {
  document.cookie = `${VAT_MODE_COOKIE}=${mode}; path=/; max-age=31536000; SameSite=Lax`;
}

/** Boş bırakılan fiyat = ürünün liste fiyatı. */
type Row = { key: number; productId: string; quantity: number; priceText: string };

export type DoctorOption = {
  id: string;
  fullName: string;
  clinic: string;
  title: string | null;
};

export default function OrderForm({
  products,
  doctors,
  initialVatMode = "NET",
}: {
  products: Product[];
  doctors: DoctorOption[];
  initialVatMode?: VatMode;
}) {
  const [state, formAction] = useActionState<OrderFormState, FormData>(
    createOrder,
    {}
  );
  const [rows, setRows] = useState<Row[]>([
    { key: 1, productId: "", quantity: 1, priceText: "" },
  ]);

  // FR-18: KDV Dahil/Hariç tercihi hatırlanır (çerezden gelir).
  const [vatMode, setVatMode] = useState<VatMode>(initialVatMode);

  const productMap = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products]
  );

  /** Girilen metni, seçili moda göre NET kuruşa çevirir. Boşsa liste fiyatı. */
  function netKurusOf(row: Row, p: Product | undefined): bigint {
    if (!p) return 0n;
    const text = row.priceText.trim();
    if (text === "") return p.netListPrice;
    const tl = Number(text);
    if (!Number.isFinite(tl) || tl < 0) return 0n;
    const k = tlToKurus(tl);
    return vatMode === "NET" ? k : netFromGross(k, p.vatRate);
  }

  /** Mod değişince girilen değerleri yeniden yaz — NET değer korunur. */
  function switchVatMode(next: VatMode) {
    setRows((rs) =>
      rs.map((r) => {
        if (r.priceText.trim() === "") return r;
        const p = productMap.get(r.productId);
        if (!p) return r;
        const net = netKurusOf(r, p);
        const shown = next === "NET" ? net : grossFromNet(net, p.vatRate);
        return { ...r, priceText: String(kurusToTl(shown)) };
      })
    );
    setVatMode(next);
    persistVatMode(next);
  }

  const computed = rows.map((row) => {
    const p = productMap.get(row.productId);
    const netUnit = netKurusOf(row, p);
    const totals =
      p && row.quantity > 0
        ? lineTotals(netUnit, row.quantity, p.vatRate)
        : { lineNetTotal: 0n, vatAmount: 0n, lineGrossTotal: 0n };
    return {
      row,
      product: p,
      netUnit,
      totals,
      overStock: p ? row.quantity > p.stock : false,
      belowMin: p ? netUnit < p.netMinPrice : false,
    };
  });

  const orderTotals = sumLineTotals(computed.map((c) => c.totals));

  // Sunucuya HER ZAMAN net fiyat gider (kanonik değer nettir).
  const items = computed
    .filter((c) => c.product && c.row.quantity > 0)
    .map((c) => ({
      productId: c.row.productId,
      quantity: c.row.quantity,
      netUnitPriceTL: kurusToTl(c.netUnit),
    }));

  const hasBlockingError = computed.some((c) => c.belowMin || c.overStock);

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

  const priceLabel = vatMode === "NET" ? "Birim (net)" : "Birim (KDV dahil)";

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
                {d.fullName} — {d.clinic}
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
            {/* FR-18: KDV Dahil / KDV Hariç görünüm seçeneği */}
            <div
              className="inline-flex overflow-hidden rounded-lg border border-slate-300"
              role="group"
              aria-label="KDV görünümü"
            >
              {(["NET", "GROSS"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchVatMode(m)}
                  aria-pressed={vatMode === m}
                  className={
                    "px-3 py-1 text-xs font-medium " +
                    (vatMode === m
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-50")
                  }
                >
                  {m === "NET" ? "KDV Hariç" : "KDV Dahil"}
                </button>
              ))}
            </div>
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
          {computed.map(({ row, product: p, netUnit, totals, overStock, belowMin }) => (
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
                    <option key={prod.id} value={prod.id}>
                      {prod.name} ({prod.code}) — Stok: {prod.stock}
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
                      quantity: Math.max(1, Number(e.target.value) || 1),
                    })
                  }
                  className={
                    "w-full rounded-lg border px-3 py-2 text-sm outline-none " +
                    (overStock
                      ? "border-red-400 focus:border-red-500"
                      : "border-slate-300 focus:border-slate-500")
                  }
                />
              </div>

              {/* FR-12: satıcı birim fiyatı değiştirebilir; taban fiyat sunucuda zorlanır. */}
              <div className="w-32">
                <label
                  htmlFor={`price-${row.key}`}
                  className="mb-1 block text-xs text-slate-500"
                >
                  {priceLabel}
                </label>
                <input
                  id={`price-${row.key}`}
                  type="number"
                  step="0.01"
                  min={0}
                  placeholder={
                    p
                      ? String(
                          kurusToTl(
                            vatMode === "NET"
                              ? p.netListPrice
                              : grossFromNet(p.netListPrice, p.vatRate)
                          )
                        )
                      : "—"
                  }
                  value={row.priceText}
                  onChange={(e) =>
                    updateRow(row.key, { priceText: e.target.value })
                  }
                  className={
                    "w-full rounded-lg border px-3 py-2 text-sm tabular-nums outline-none " +
                    (belowMin
                      ? "border-red-400 focus:border-red-500"
                      : "border-slate-300 focus:border-slate-500")
                  }
                />
              </div>

              {/* Salt-okunur gösterimler: form kontrolü olmadıkları için <label> değil. */}
              <div className="w-24 text-right">
                <span className="mb-1 block text-xs text-slate-500">KDV</span>
                <div className="py-2 text-sm tabular-nums text-slate-500">
                  {p ? formatTRY(totals.vatAmount) : "—"}
                </div>
              </div>

              <div className="w-28 text-right">
                <span className="mb-1 block text-xs text-slate-500">Tutar</span>
                <div className="py-2 text-sm font-medium tabular-nums text-slate-900">
                  {formatTRY(
                    vatMode === "NET" ? totals.lineNetTotal : totals.lineGrossTotal
                  )}
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

              {overStock && (
                <p className="w-full text-xs text-red-600">
                  Stok yetersiz (mevcut: {p?.stock}).
                </p>
              )}
              {belowMin && p && (
                <p className="w-full text-xs text-red-600">
                  Birim fiyat taban fiyatın altında: {formatTRY(p.netMinPrice)} (net).
                  Girilen: {formatTRY(netUnit)} (net).
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Toplamlar kalemlerin TOPLAMIDIR; yeniden yuvarlanmaz (src/lib/vat.ts). */}
      <div className="flex justify-end">
        <dl className="w-64 space-y-1 text-sm">
          <div className="flex justify-between text-slate-600">
            <dt>Ara Toplam (KDV hariç)</dt>
            <dd className="tabular-nums">{formatTRY(orderTotals.netTotal)}</dd>
          </div>
          <div className="flex justify-between text-slate-600">
            <dt>KDV</dt>
            <dd className="tabular-nums">{formatTRY(orderTotals.vatTotal)}</dd>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-1 font-semibold text-slate-900">
            <dt>Genel Toplam</dt>
            <dd className="tabular-nums">{formatTRY(orderTotals.grossTotal)}</dd>
          </div>
        </dl>
      </div>

      <FormError message={state.error} />

      <div className="flex items-center gap-3">
        <SubmitButton disabled={hasBlockingError || items.length === 0}>
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
