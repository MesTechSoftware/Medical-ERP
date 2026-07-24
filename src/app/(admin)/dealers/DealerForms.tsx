"use client";

import { useActionState } from "react";
import { Field, SelectField, TextArea, SubmitButton, FormError } from "@/components/form";
import {
  createDealer,
  setDealerPrice,
  recordDealerPayment,
  type DealerState,
} from "./actions";

export function NewDealerForm() {
  const [state, formAction] = useActionState<DealerState, FormData>(
    createDealer,
    {}
  );
  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <Field label="Bayi Kodu" name="code" required />
      <Field label="Ünvan" name="title" required />
      <Field label="Vergi Dairesi" name="taxOffice" />
      <Field label="Vergi No" name="taxNo" />
      <Field label="Yetkili" name="contactName" />
      <Field label="Telefon" name="phone" />
      <Field label="E-posta" name="email" type="email" />
      <Field label="Adres" name="address" />

      <div className="sm:col-span-2 mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="mb-2 text-xs text-slate-600">
          Opsiyonel bayi paneli girişi. Boş bırakılırsa bayi login olmadan
          yalnızca admin tarafından yönetilir.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Login E-posta" name="loginEmail" type="email" />
          <Field label="Login Şifre (min 6)" name="loginPassword" type="password" />
        </div>
      </div>

      <div className="sm:col-span-2">
        <FormError message={state.error} />
        <SubmitButton>Bayi Oluştur</SubmitButton>
      </div>
    </form>
  );
}

export function PriceForm({
  dealerId,
  products,
}: {
  dealerId: string;
  products: { id: string; label: string }[];
}) {
  const [state, formAction] = useActionState<DealerState, FormData>(
    setDealerPrice,
    {}
  );
  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-4">
      <input type="hidden" name="dealerId" value={dealerId} />
      <div className="sm:col-span-2">
        <SelectField
          label="Ürün"
          name="productId"
          required
          options={[
            { value: "", label: "Seçiniz..." },
            ...products.map((p) => ({ value: p.id, label: p.label })),
          ]}
        />
      </div>
      <Field label="Net Fiyat (₺)" name="netPrice" type="number" step="0.01" min="0" required />
      <Field label="KDV %" name="vatRate" type="number" min="0" defaultValue={20} required />
      <div className="sm:col-span-4">
        {state.ok && <p className="mb-2 text-xs text-green-700">{state.ok}</p>}
        <FormError message={state.error} />
        <SubmitButton>Fiyat Kaydet</SubmitButton>
      </div>
    </form>
  );
}

export function DealerPaymentForm({ dealerId }: { dealerId: string }) {
  const [state, formAction] = useActionState<DealerState, FormData>(
    recordDealerPayment,
    {}
  );
  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-4">
      <input type="hidden" name="dealerId" value={dealerId} />
      <Field label="Tutar (₺)" name="amount" type="number" step="0.01" min="0" required />
      <SelectField
        label="Yöntem"
        name="method"
        defaultValue="TRANSFER"
        options={[
          { value: "CASH", label: "Nakit" },
          { value: "TRANSFER", label: "Havale / EFT" },
          { value: "CARD", label: "Kredi Kartı" },
          { value: "OTHER", label: "Diğer" },
        ]}
      />
      <Field label="Referans No" name="referenceNo" />
      <div className="sm:col-span-4">
        <TextArea label="Açıklama" name="note" />
      </div>
      <div className="sm:col-span-4">
        {state.ok && <p className="mb-2 text-xs text-green-700">{state.ok}</p>}
        <FormError message={state.error} />
        <SubmitButton>Ödeme Kaydet</SubmitButton>
      </div>
    </form>
  );
}
