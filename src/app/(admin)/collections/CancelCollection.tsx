"use client";

import { useActionState } from "react";
import { cancelCollection, type CollectionState } from "./actions";

export default function CancelCollection({ paymentId }: { paymentId: string }) {
  const [state, formAction] = useActionState<CollectionState, FormData>(
    cancelCollection,
    {}
  );

  return (
    <form
      action={formAction}
      data-payment-id={paymentId}
      onSubmit={(e) => {
        if (
          !window.confirm(
            "Tahsilat iptal edilecek ve mahsupları geri alınacak. Onaylıyor musunuz?"
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="paymentId" value={paymentId} />
      <input type="hidden" name="reason" value="Admin iptali" />
      <button
        type="submit"
        className="text-sm font-medium text-red-600 hover:text-red-800"
      >
        İptal Et
      </button>
      {state.error && (
        <p className="mt-1 text-xs text-red-600">{state.error}</p>
      )}
    </form>
  );
}
