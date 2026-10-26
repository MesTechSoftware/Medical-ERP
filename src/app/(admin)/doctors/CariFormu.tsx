"use client";

import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { Field, SelectField, SubmitButton } from "@/components/form";
import { SonucGosterimi, type SonucDurumu } from "@/components/Sonuc";
import type { IslemSonucu } from "@/lib/sonuc";
import { BRUT, tabanli } from "@/lib/taban";
import { buton } from "@/components/stil";

type Secenek = { value: string; label: string };
export type CariDegerleri = Partial<Record<string, string>> & { accountClass?: "DOKTOR" | "BAYI" };

const ALANLAR = [
  "accountClass", "ownerSellerId", "fullName", "title", "specialty", "clinic", "region", "city", "email", "phone",
  "priceListId", "paymentTermDays", "creditLimit", "partyType", "taxId", "invoiceTitle", "taxOffice",
  "invoiceAddress", "invoiceDistrict", "invoiceCity", "accountingCode",
] as const;

/**
 * Tek cari formu (X-8 §(5), A-13 §(9)): *Genel* ve katlanmış *Fatura bilgileri*. Açılışta hesap sınıfı
 * seçili gelmez (X-16 §(8)); sınıf açıldıktan sonra değişmez (X-17 §(2)). Sorumlu satıcı yalnız
 * açılışta ve yalnız `DOKTOR`'da (X-17 §(7)); sonraki değişiklik devirdir.
 */
export default function CariFormu({
  action,
  degerler = {},
  saticilar,
  listeler,
  acilis,
  iptalHref,
}: {
  action: (prev: SonucDurumu, formData: FormData) => Promise<IslemSonucu>;
  degerler?: CariDegerleri;
  saticilar: Secenek[];
  listeler: Secenek[];
  acilis: boolean;
  iptalHref: string;
}) {
  const [sonuc, formAction, gonderiliyor] = useActionState<SonucDurumu, FormData>(action, null);
  const [sinif, setSinif] = useState<"DOKTOR" | "BAYI" | undefined>(degerler.accountClass);
  const d = (a: string) => degerler[a] ?? undefined;

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        const veri = new FormData(e.currentTarget);
        startTransition(() => formAction(veri));
      }}
    >
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Genel</h2>
        {acilis && (
          <fieldset>
            <legend className="mb-1 text-sm font-medium text-slate-700">Hesap sınıfı</legend>
            <div className="flex gap-4 text-sm">
              {(["DOKTOR", "BAYI"] as const).map((s) => (
                <label key={s} className="flex items-center gap-2 dokunmatik:min-h-11">
                  <input type="radio" name="accountClass" value={s} checked={sinif === s} onChange={() => setSinif(s)} />
                  {s === "DOKTOR" ? "Doktor" : "Bayi"}
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={sinif === "BAYI" ? "Ünvan / Ad" : "Ad Soyad"} name="fullName" defaultValue={d("fullName")} required sonuc={sonuc} />
          <Field label="Unvan (Prof. Dr. …)" name="title" defaultValue={d("title")} sonuc={sonuc} />
          <Field label="Branş" name="specialty" defaultValue={d("specialty")} sonuc={sonuc} />
          <Field label={sinif === "BAYI" ? "Klinik (isteğe bağlı)" : "Klinik"} name="clinic" defaultValue={d("clinic")} sonuc={sonuc} />
          <Field label={sinif === "BAYI" ? "Bölge (isteğe bağlı)" : "Bölge"} name="region" defaultValue={d("region")} sonuc={sonuc} />
          <Field label="Şehir" name="city" defaultValue={d("city")} sonuc={sonuc} />
          {/* X-15 §(5): DOKTOR'da kişisel cep telefonu; BAYI'de firma numarası. */}
          <Field label={sinif === "BAYI" ? "Telefon" : "Cep telefonu (kişisel)"} name="phone" defaultValue={d("phone")} required sonuc={sonuc} />
          <Field label="E-posta" name="email" type="email" defaultValue={d("email")} sonuc={sonuc} />
          {acilis && sinif === "DOKTOR" && (
            <SelectField label="Sorumlu satıcı (boş: sahipsiz)" name="ownerSellerId" options={[{ value: "", label: "—" }, ...saticilar]} sonuc={sonuc} />
          )}
          <SelectField label="Fiyat listesi (boş: varsayılan)" name="priceListId" defaultValue={d("priceListId")} options={[{ value: "", label: "Varsayılan" }, ...listeler]} sonuc={sonuc} />
          <Field label="Ödeme vadesi (gün)" name="paymentTermDays" type="number" min="0" defaultValue={d("paymentTermDays")} sonuc={sonuc} />
          <Field label={`${tabanli("Kredi limiti", BRUT)} — boş: limitsiz`} name="creditLimit" defaultValue={d("creditLimit")} sonuc={sonuc} />
        </div>
      </section>

      <details className="rounded-lg border border-slate-200 p-4" open={!!(d("taxId") || d("invoiceAddress"))}>
        <summary className="cursor-pointer text-sm font-semibold text-slate-900">Fatura bilgileri</summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Cari tipi"
            name="partyType"
            defaultValue={d("partyType") ?? "TUZEL_KISI"}
            options={[
              { value: "TUZEL_KISI", label: "Tüzel kişi" },
              { value: "GERCEK_KISI", label: "Gerçek kişi" },
            ]}
            sonuc={sonuc}
          />
          <Field label="VKN / TCKN" name="taxId" defaultValue={d("taxId")} sonuc={sonuc} />
          <Field label="Fatura ünvanı (boş: ad soyad)" name="invoiceTitle" defaultValue={d("invoiceTitle")} sonuc={sonuc} />
          <Field label="Vergi dairesi" name="taxOffice" defaultValue={d("taxOffice")} sonuc={sonuc} />
          <Field label="Fatura adresi" name="invoiceAddress" defaultValue={d("invoiceAddress")} sonuc={sonuc} />
          <Field label="Fatura ilçe" name="invoiceDistrict" defaultValue={d("invoiceDistrict")} sonuc={sonuc} />
          <Field label="Fatura il" name="invoiceCity" defaultValue={d("invoiceCity")} sonuc={sonuc} />
          <Field label="Muhasebe kodu" name="accountingCode" defaultValue={d("accountingCode")} sonuc={sonuc} />
        </div>
      </details>

      <SonucGosterimi sonuc={sonuc} alanlar={ALANLAR} />
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton disabled={gonderiliyor}>{acilis ? "Cariyi Aç" : "Kaydet"}</SubmitButton>
        <Link href={iptalHref} className={buton("metin")}>
          İptal
        </Link>
      </div>
    </form>
  );
}
