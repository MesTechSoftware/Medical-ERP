"use client";

import { useActionState } from "react";
import { SubmitButton, FormError } from "@/components/form";
import {
  advanceCommissionStatus,
  closePeriod,
  type CommissionActionState,
} from "./actions";

export function ClosePeriodButton({
  sellerId,
  year,
  month,
}: {
  sellerId: string;
  year: number;
  month: number;
}) {
  const [state, formAction] = useActionState<CommissionActionState, FormData>(
    closePeriod,
    {}
  );
  return (
    <form action={formAction} data-close-period={sellerId}>
      <input type="hidden" name="sellerId" value={sellerId} />
      <input type="hidden" name="year" value={year} />
      <input type="hidden" name="month" value={month} />
      <SubmitButton>Dönemi Kapat</SubmitButton>
      {state.ok && <p className="mt-1 text-xs text-green-700">{state.ok}</p>}
      <FormError message={state.error} />
    </form>
  );
}

export function AdvanceStatusButton({
  periodId,
  label,
}: {
  periodId: string;
  label: string;
}) {
  const [state, formAction] = useActionState<CommissionActionState, FormData>(
    advanceCommissionStatus,
    {}
  );
  return (
    <form action={formAction} data-period-id={periodId}>
      <input type="hidden" name="periodId" value={periodId} />
      <button
        type="submit"
        className="text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        {label}
      </button>
      <FormError message={state.error} />
    </form>
  );
}
