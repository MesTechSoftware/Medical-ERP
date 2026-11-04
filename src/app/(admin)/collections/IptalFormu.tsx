"use client";

import { useActionState } from "react";
import { SonucGosterimi, type SonucDurumu } from "@/components/Sonuc";
import { KONTROL_COK_SATIR, buton } from "@/components/stil";
import { Ikon } from "@/components/Ikon";
import { cancelCollection } from "./actions";

/** Tahsilat iptali (FR-29): gerekçe zorunlu (X-18-5); mahsuplar ters kayıtla geri alınır. */
export function IptalFormu({ paymentId }: { paymentId: string }) {
  const [state, formAction] = useActionState<SonucDurumu, FormData>(cancelCollection, null);
  return (
    <form
      action={formAction}
      data-payment-id={paymentId}
      className="space-y-2"
      onSubmit={(e) => {
        if (!window.confirm("Tahsilat iptal edilecek ve mahsupları geri alınacak. Onaylıyor musunuz?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="paymentId" value={paymentId} />
      <label htmlFor={`gerekce_${paymentId}`} className="block text-xs text-slate-500">
        Gerekçe
      </label>
      <textarea id={`gerekce_${paymentId}`} name="reason" required rows={2} className={`w-full ${KONTROL_COK_SATIR}`} />
      <SonucGosterimi sonuc={state} />
      <button type="submit" className={buton("olumsuz-cerceve")}>
        <Ikon ad="iptalEt" />
        Tahsilatı iptal et
      </button>
    </form>
  );
}
