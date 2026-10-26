"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, SelectField, SubmitButton } from "@/components/form";
import { SonucGosterimi, type SonucDurumu } from "@/components/Sonuc";
import type { IslemSonucu } from "@/lib/sonuc";
import { MATRAH, TABAN_ETIKETI } from "@/lib/taban";
import { buton } from "@/components/stil";

type Action = (prev: SonucDurumu, formData: FormData) => Promise<IslemSonucu>;

const ALANLAR = ["name", "code", "listPrice", "taxRateId"] as const;

export default function ProductForm({
  action,
  defaults,
  taxRates,
  submitLabel,
  showInitialStock,
}: {
  action: Action;
  defaults?: {
    name?: string;
    code?: string;
    /** Varsayılan listenin fiyatı, ham metin (X-10 §(5)). */
    listPrice?: string;
    taxRateId?: string;
    status?: string;
  };
  /** Aktif `TaxRate` satırları (C-6); tanım tablosu ekranı 1B'dedir. */
  taxRates: { id: string; name: string }[];
  submitLabel: string;
  showInitialStock?: boolean;
}) {
  const [state, formAction] = useActionState<SonucDurumu, FormData>(action, null);

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <Field label="Ürün Adı" name="name" required defaultValue={defaults?.name} sonuc={state} />
      <Field label="Ürün Kodu" name="code" required defaultValue={defaults?.code} sonuc={state} />
      {/* Fiyatlar NET (KDV hariç) girilir — kanonik değer nettir (FR-19). */}
      {/* Liste fiyatı varsayılan fiyat listesinin satırına yazılır (X-10 §(5)). */}
      <Field
        label={`Liste Fiyatı — ${TABAN_ETIKETI[MATRAH]} (₺)`}
        name="listPrice"
        required
        defaultValue={defaults?.listPrice}
        sonuc={state}
      />
      <SelectField
        label="KDV Oranı"
        name="taxRateId"
        defaultValue={defaults?.taxRateId ?? taxRates[0]?.id}
        sonuc={state}
        options={taxRates.map((t) => ({ value: t.id, label: t.name }))}
      />
      {showInitialStock && (
        <Field
          label="Başlangıç Stoğu (adet)"
          name="initialStock"
          type="number"
          min="0"
          defaultValue={0}
        />
      )}
      <SelectField
        label="Durum"
        name="status"
        defaultValue={defaults?.status ?? "AKTIF"}
        options={[
          { value: "AKTIF", label: "Aktif" },
          { value: "PASIF", label: "Pasif" },
        ]}
      />

      <SonucGosterimi sonuc={state} alanlar={ALANLAR} />

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <SubmitButton>{submitLabel}</SubmitButton>
        <Link
          href="/products"
          className={buton("metin")}
        >
          İptal
        </Link>
      </div>
    </form>
  );
}
