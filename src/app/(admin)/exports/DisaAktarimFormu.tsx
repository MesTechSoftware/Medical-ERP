"use client";

import { useActionState, useEffect, useState } from "react";
import { Field, SelectField, SubmitButton } from "@/components/form";
import { SonucGosterimi } from "@/components/Sonuc";
import { disaAktar, type DisaAktarimSonucu } from "./actions";
import { KONTROL_TEK_SATIR } from "@/components/stil";

const VERI_SETI_ADI: Record<string, string> = {
  CARI_HAREKET: "Cari hareket",
  TAHSILAT: "Tahsilat hareket listesi",
  SIPARIS: "Sipariş",
  STOK: "Stok miktarı",
  DOKTOR_LISTESI: "Doktor listesi",
  FATURA_HAZIRLIK: "Fatura hazırlık (sevk günü)",
};
const ARALIKLI = new Set(["CARI_HAREKET", "TAHSILAT", "SIPARIS", "FATURA_HAZIRLIK"]);
const ALANLAR = ["kod", "bicim", "baslangic", "bitis", "tarih"] as const;

/** Dosya sunucuda saklanmaz: yanıttaki içerik tarayıcıda indirilir (D-5 §(10)). */
function indir(dosya: NonNullable<DisaAktarimSonucu["dosya"]>) {
  const bayt = Uint8Array.from(atob(dosya.icerik), (c) => c.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bayt], { type: dosya.mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = dosya.ad;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DisaAktarimFormu() {
  const [state, formAction] = useActionState<DisaAktarimSonucu | null, FormData>(disaAktar, null);
  const [kod, setKod] = useState("CARI_HAREKET");
  const [tumZamanlar, setTumZamanlar] = useState(false);

  useEffect(() => {
    if (state?.dosya) indir(state.dosya);
  }, [state]);

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <div>
        <label htmlFor="kod" className="mb-1 block text-sm font-medium text-slate-700">
          Veri Seti
        </label>
        <select
          id="kod"
          name="kod"
          value={kod}
          onChange={(e) => setKod(e.target.value)}
          className={`w-full ${KONTROL_TEK_SATIR}`}
        >
          {Object.entries(VERI_SETI_ADI).map(([k, ad]) => (
            <option key={k} value={k}>
              {ad}
            </option>
          ))}
        </select>
      </div>

      {ARALIKLI.has(kod) && (
        <>
          <label className="flex items-center gap-2 text-sm text-slate-700 dokunmatik:min-h-11">
            <input
              type="checkbox"
              name="tumZamanlar"
              checked={tumZamanlar}
              onChange={(e) => setTumZamanlar(e.target.checked)}
            />
            Tüm zamanlar
          </label>
          {!tumZamanlar && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Başlangıç günü" name="baslangic" type="date" required sonuc={state} />
              <Field label="Bitiş günü (dahil)" name="bitis" type="date" required sonuc={state} />
            </div>
          )}
        </>
      )}
      {kod === "STOK" && (
        <Field label="Gün sonu itibarıyla (boşsa bugün)" name="tarih" type="date" sonuc={state} />
      )}

      <SelectField
        label="Biçim"
        name="bicim"
        defaultValue="xlsx"
        options={[
          { value: "xlsx", label: "Excel (.xlsx)" },
          { value: "csv", label: "CSV (.csv)" },
        ]}
        sonuc={state}
      />

      <SonucGosterimi sonuc={state} alanlar={ALANLAR} basari={(p) => `Dosya hazırlandı: ${p.satir} satır.`} />
      <SubmitButton ikon="indir">Dosyayı İndir</SubmitButton>
    </form>
  );
}
