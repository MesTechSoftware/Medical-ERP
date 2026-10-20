"use client";

import { useActionState, useEffect, useRef } from "react";
import { SelectField, Field, TextArea, SubmitButton } from "@/components/form";
import { SonucGosterimi, type SonucDurumu } from "@/components/Sonuc";
import { addStockEntry } from "./actions";

const ALANLAR = ["productId", "quantity"] as const;

export default function StockEntryForm({
  products,
}: {
  products: { id: string; name: string; code: string }[];
}) {
  const [state, formAction] = useActionState<SonucDurumu, FormData>(addStockEntry, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.durum === "BASARILI") formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <SelectField
        label="Ürün"
        name="productId"
        required
        sonuc={state}
        options={products.map((p) => ({
          value: p.id,
          label: `${p.name} (${p.code})`,
        }))}
      />
      <Field label="Miktar (adet)" name="quantity" type="number" min="1" required sonuc={state} />
      <TextArea label="Açıklama (opsiyonel)" name="note" placeholder="Örn: Tedarikçi girişi" />

      <SonucGosterimi sonuc={state} alanlar={ALANLAR} basari={() => "Stok girişi kaydedildi."} />

      <SubmitButton>Stok Girişi Ekle</SubmitButton>
    </form>
  );
}
