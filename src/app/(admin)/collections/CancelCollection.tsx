"use client";

import { useActionState } from "react";
import { SonucGosterimi, type SonucDurumu } from "@/components/Sonuc";
import { cancelCollection } from "./actions";
import { buton } from "@/components/stil";

export default function CancelCollection({ paymentId }: { paymentId: string }) {
  const [state, formAction] = useActionState<SonucDurumu, FormData>(cancelCollection, null);

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
        className={buton("metin-olumsuz")}
      >
        İptal Et
      </button>
      <SonucGosterimi sonuc={state} />
    </form>
  );
}
