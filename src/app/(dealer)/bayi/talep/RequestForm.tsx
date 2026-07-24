"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { FormError, SubmitButton } from "@/components/form";
import { formatTRY } from "@/lib/money";
import { requestShipment, type RequestState } from "./actions";

type PriceItem = {
  productId: string;
  name: string;
  code: string;
  grossPrice: string; // sunucuda formatlanmış (BigInt istemciye geçmesin)
  grossKurus: number; // toplam gösterimi için (2^53 altı güvenli)
};

type Row = { key: number; productId: string; quantity: number };

export default function RequestForm({ prices }: { prices: PriceItem[] }) {
  const [state, formAction] = useActionState<RequestState, FormData>(
    requestShipment,
    {}
  );
  const [rows, setRows] = useState<Row[]>([
    { key: 1, productId: "", quantity: 1 },
  ]);

  const priceMap = useMemo(
    () => new Map(prices.map((p) => [p.productId, p])),
    [prices]
  );

  const items = rows
    .filter((r) => r.productId && r.quantity > 0)
    .map((r) => ({ productId: r.productId, quantity: r.quantity }));

  const totalKurus = rows.reduce((sum, r) => {
    const p = priceMap.get(r.productId);
    return sum + (p ? p.grossKurus * r.quantity : 0);
  }, 0);

  function addRow() {
    setRows((rs) => [...rs, { key: Date.now(), productId: "", quantity: 1 }]);
  }
  function removeRow(key: number) {
    setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.key !== key) : rs));
  }
  function updateRow(key: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  if (prices.length === 0) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Size henüz ürün fiyatı tanımlanmamış. Talep oluşturmak için yöneticinize
        başvurun.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="items" value={JSON.stringify(items)} />

      <div className="space-y-2">
        {rows.map((row) => {
          const p = priceMap.get(row.productId);
          return (
            <div
              key={row.key}
              className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 p-2"
            >
              <div className="min-w-[220px] flex-1">
                <label
                  htmlFor={`p-${row.key}`}
                  className="mb-1 block text-xs text-slate-500"
                >
                  Ürün
                </label>
                <select
                  id={`p-${row.key}`}
                  value={row.productId}
                  onChange={(e) =>
                    updateRow(row.key, { productId: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
                >
                  <option value="">Seçiniz...</option>
                  {prices.map((pr) => (
                    <option key={pr.productId} value={pr.productId}>
                      {pr.name} ({pr.code}) — {pr.grossPrice}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-24">
                <label
                  htmlFor={`q-${row.key}`}
                  className="mb-1 block text-xs text-slate-500"
                >
                  Miktar
                </label>
                <input
                  id={`q-${row.key}`}
                  type="number"
                  min={1}
                  value={row.quantity}
                  onChange={(e) =>
                    updateRow(row.key, {
                      quantity: Math.max(1, Number(e.target.value) || 1),
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </div>
              <div className="w-28 text-right">
                <span className="mb-1 block text-xs text-slate-500">Tutar</span>
                <div className="py-2 text-sm font-medium tabular-nums text-slate-900">
                  {p ? formatTRY(p.grossKurus * row.quantity) : "—"}
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
          );
        })}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        + Kalem Ekle
      </button>

      <div className="flex justify-end">
        <div className="text-sm">
          Toplam (KDV dahil):{" "}
          <strong className="tabular-nums">{formatTRY(totalKurus)}</strong>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Talebiniz yönetici onayına düşer. Onaylanana kadar stok ve cari
        etkilenmez.
      </p>

      {state.ok && (
        <p className="text-sm font-medium text-green-700">{state.ok}</p>
      )}
      <FormError message={state.error} />
      <SubmitButton disabled={items.length === 0}>
        Sevkiyat Talebi Oluştur
      </SubmitButton>
    </form>
  );
}
