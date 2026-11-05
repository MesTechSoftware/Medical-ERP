"use client";

import { startTransition, useActionState } from "react";
import { TextArea } from "@/components/form";
import { SonucGosterimi, type SonucDurumu } from "@/components/Sonuc";
import { buton } from "@/components/stil";
import { Ikon } from "@/components/Ikon";
import { cancelCollection } from "./actions";
import { GEREKCE_AZAMI } from "@/lib/sonuc";

const ALANLAR = ["reason"] as const;

/**
 * Tahsilat iptali (FR-29): gerekçe zorunlu (X-18-5), hatası alanın altında; tahsilatın cari hareketi ters kayıtla
 * geri alınır (X-11; eşleştirme yoktur — X-6). Gönderim elle yapılır (`IslemFormu` gibi): React'in form eylemi alanları sıfırlar, yazılan gerekçe
 * hatadan sonra silinmesin.
 */
export function IptalFormu({ paymentId }: { paymentId: string }) {
  const [state, formAction] = useActionState<SonucDurumu, FormData>(cancelCollection, null);
  return (
    <form
      data-payment-id={paymentId}
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!window.confirm("Tahsilat iptal edilecek; cari hareketlerine ters kayıt yazılır ve carinin bakiyesi bu tahsilat yokmuş gibi olur. Onaylıyor musunuz?")) return;
        const veri = new FormData(e.currentTarget);
        startTransition(() => formAction(veri));
      }}
    >
      <input type="hidden" name="paymentId" value={paymentId} />
      <TextArea label="Gerekçe" name="reason" maxLength={GEREKCE_AZAMI} sonuc={state} />
      <SonucGosterimi sonuc={state} alanlar={ALANLAR} />
      <button type="submit" className={buton("olumsuz-cerceve")}>
        <Ikon ad="iptalEt" />
        Tahsilatı iptal et
      </button>
    </form>
  );
}
