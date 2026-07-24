"use client";

import { useActionState } from "react";
import { withdrawRequest, type RequestState } from "../talep/actions";

export default function WithdrawButton({ shipmentId }: { shipmentId: string }) {
  const [state, formAction] = useActionState<RequestState, FormData>(
    withdrawRequest,
    {}
  );
  return (
    <form action={formAction} data-withdraw={shipmentId}>
      <input type="hidden" name="shipmentId" value={shipmentId} />
      <button
        type="submit"
        className="text-sm font-medium text-red-600 hover:text-red-800"
      >
        Geri Çek
      </button>
      {state.error && <p className="mt-1 text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
