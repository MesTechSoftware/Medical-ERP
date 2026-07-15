"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { Field, FormError, SubmitButton } from "@/components/form";
import { formatTRY } from "@/lib/money";
import { createOrder, type OrderFormState } from "./actions";

type Product = {
  id: string;
  name: string;
  code: string;
  salePrice: number; // kuruş
  stock: number;
};

type Row = { key: number; productId: string; quantity: number };

export default function OrderForm({ products }: { products: Product[] }) {
  const [state, formAction] = useActionState<OrderFormState, FormData>(
    createOrder,
    {}
  );
  const [rows, setRows] = useState<Row[]>([
    { key: 1, productId: "", quantity: 1 },
  ]);

  const productMap = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products]
  );

  const total = rows.reduce((sum, r) => {
    const p = productMap.get(r.productId);
    return sum + (p ? p.salePrice * r.quantity : 0);
  }, 0);

  const items = rows
    .filter((r) => r.productId && r.quantity > 0)
    .map((r) => ({ productId: r.productId, quantity: r.quantity }));

  function addRow() {
    setRows((rs) => [...rs, { key: Date.now(), productId: "", quantity: 1 }]);
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Doktor Adı" name="doctorName" required />
        <Field label="Hastane / Klinik" name="hospital" />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            Sipariş Kalemleri
          </h2>
          <button
            type="button"
            onClick={addRow}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            + Kalem Ekle
          </button>
        </div>

        <div className="space-y-2">
          {rows.map((row) => {
            const p = productMap.get(row.productId);
            const lineTotal = p ? p.salePrice * row.quantity : 0;
            const overStock = p ? row.quantity > p.stock : false;
            return (
              <div
                key={row.key}
                className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 p-2"
              >
                <div className="min-w-[220px] flex-1">
                  <label className="mb-1 block text-xs text-slate-500">
                    Ürün
                  </label>
                  <select
                    value={row.productId}
                    onChange={(e) =>
                      updateRow(row.key, { productId: e.target.value })
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
                  <label className="mb-1 block text-xs text-slate-500">
                    Miktar
                  </label>
                  <input
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

                <div className="w-28 text-right">
                  <label className="mb-1 block text-xs text-slate-500">
                    Birim
                  </label>
                  <div className="py-2 text-sm tabular-nums text-slate-600">
                    {p ? formatTRY(p.salePrice) : "—"}
                  </div>
                </div>

                <div className="w-28 text-right">
                  <label className="mb-1 block text-xs text-slate-500">
                    Tutar
                  </label>
                  <div className="py-2 text-sm font-medium tabular-nums text-slate-900">
                    {formatTRY(lineTotal)}
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
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 pt-4">
        <span className="text-sm font-medium text-slate-500">Toplam Tutar</span>
        <span className="text-xl font-semibold tabular-nums text-slate-900">
          {formatTRY(total)}
        </span>
      </div>

      <FormError message={state.error} />

      <div className="flex items-center gap-3">
        <SubmitButton>Siparişi Oluştur</SubmitButton>
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
