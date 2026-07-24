"use client";

import { useActionState } from "react";
import { SubmitButton, FormError } from "@/components/form";
import { transferDoctor, type TransferState } from "./actions";

export default function TransferForm({
  doctorId,
  currentSellerId,
  sellers,
}: {
  doctorId: string;
  currentSellerId: string | null;
  sellers: { id: string; name: string }[];
}) {
  const [state, formAction] = useActionState<TransferState, FormData>(
    transferDoctor,
    {}
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="doctorId" value={doctorId} />

      <div>
        <label
          htmlFor={`seller-${doctorId}`}
          className="mb-1 block text-xs text-slate-500"
        >
          Yeni sorumlu satıcı
        </label>
        <select
          id={`seller-${doctorId}`}
          name="sellerId"
          defaultValue={currentSellerId ?? ""}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
        >
          <option value="">— Sahipsiz havuz —</option>
          {sellers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="min-w-[180px] flex-1">
        <label
          htmlFor={`reason-${doctorId}`}
          className="mb-1 block text-xs text-slate-500"
        >
          Gerekçe
        </label>
        <input
          id={`reason-${doctorId}`}
          name="reason"
          placeholder="Örn. bölge değişikliği"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        />
      </div>

      <SubmitButton>Devret</SubmitButton>

      {state.ok && (
        <p className="w-full text-xs font-medium text-green-700">{state.ok}</p>
      )}
      <div className="w-full">
        <FormError message={state.error} />
      </div>
    </form>
  );
}
