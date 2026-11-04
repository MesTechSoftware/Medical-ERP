"use client";

import { useActionState, useEffect, useState } from "react";
import { Field, SubmitButton } from "@/components/form";
import { SonucGosterimi } from "@/components/Sonuc";
import { StatusChip } from "@/components/ui";
import { buton } from "@/components/stil";
import { Ikon } from "@/components/Ikon";
import { donemKisayollari } from "@/lib/disa-aktarim-donem";
import { disaAktar, type DisaAktarimSonucu } from "./actions";

type Rozet = "Dönem ister" | "Gün sonu" | "Anlık";

/** Altı veri seti (D-5, kodda kapalı) — ad, ne içerdiği ve hangi dönemi istediği (spec Ü-29 §3). */
const VERI_SETLERI: readonly { kod: string; ad: string; aciklama: string; rozet: Rozet }[] = [
  { kod: "CARI_HAREKET", ad: "Cari hareket", aciklama: "Bütün cari hareketler tipi, yönü ve vadesiyle; açılış ve vade farkı dahil — mutabakat için.", rozet: "Dönem ister" },
  { kod: "TAHSILAT", ad: "Tahsilat hareket listesi", aciklama: "Tahsilatlar yöntemi, komisyonu, referansı ve durumuyla.", rozet: "Dönem ister" },
  { kod: "SIPARIS", ad: "Sipariş", aciklama: "Sayılan siparişlerin satırları ürün, fiyat ve KDV'siyle; bedelsiz işaretli.", rozet: "Dönem ister" },
  { kod: "STOK", ad: "Stok miktarı", aciklama: "Gün sonu itibarıyla ürün ve konum başına miktar; tutar yok, yıl içi düzeltmeler işaretli.", rozet: "Gün sonu" },
  { kod: "DOKTOR_LISTESI", ad: "Doktor listesi", aciklama: "Cariler fatura bilgileri ve sorumlu satıcısıyla.", rozet: "Anlık" },
  { kod: "FATURA_HAZIRLIK", ad: "Fatura hazırlık (sevk günü)", aciklama: "Sevk günündeki satırlar, kurulumdaki şablonun sütun eşlemesiyle.", rozet: "Dönem ister" },
];
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

/**
 * Dışa aktarım formu (spec Ü-29): açıklamalı veri seti kartları, dönem isteyen sette kısayollar (Bu ay, Geçen ay,
 * Bu yıl, Geçen yıl) ve "Tüm zamanlar", biçim. Fatura hazırlık şablonu tanımsızsa kart pasiftir (K-4 §(6)-b).
 * Geçmiş listesi yoktur (D-5).
 */
export default function DisaAktarimFormu({ bugun, faturaSablonuVar }: { bugun: string; faturaSablonuVar: boolean }) {
  const [state, formAction] = useActionState<DisaAktarimSonucu | null, FormData>(disaAktar, null);
  const [kod, setKod] = useState("CARI_HAREKET");
  const [tumZamanlar, setTumZamanlar] = useState(false);
  // Kısayol alanların varsayılanını değiştirir; `surum` alanları yeniden kurar.
  const [aralik, setAralik] = useState({ baslangic: "", bitis: "", surum: 0 });

  useEffect(() => {
    if (state?.dosya) indir(state.dosya);
  }, [state]);

  const secili = VERI_SETLERI.find((v) => v.kod === kod)!;

  return (
    <form action={formAction} className="space-y-6">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-slate-700">Veri seti</legend>
        <div role="radiogroup" aria-label="Veri seti" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {VERI_SETLERI.map((v) => {
            const pasif = v.kod === "FATURA_HAZIRLIK" && !faturaSablonuVar;
            const secilen = kod === v.kod;
            return (
              <label
                key={v.kod}
                className={`flex cursor-pointer gap-3 rounded-xl border p-4 text-sm transition ${
                  secilen ? "border-information bg-information-bg" : "border-slate-200 bg-white hover:border-slate-300"
                } ${pasif ? "cursor-not-allowed opacity-60" : ""}`}
              >
                <input type="radio" name="kod" value={v.kod} checked={secilen} disabled={pasif} onChange={() => setKod(v.kod)} className="mt-0.5" />
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-slate-900">{v.ad}</span>
                    <StatusChip ton="notr">{v.rozet}</StatusChip>
                  </span>
                  <span className="mt-1 block text-slate-500">{v.aciklama}</span>
                  {pasif && <span className="mt-1 block text-slate-500">Kurulumda fatura şablonu tanımlanmadığı için seçilemez.</span>}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="max-w-lg space-y-4">
        {secili.rozet === "Dönem ister" && (
          <>
            <label className="flex items-center gap-2 text-sm text-slate-700 dokunmatik:min-h-11">
              <input type="checkbox" name="tumZamanlar" checked={tumZamanlar} onChange={(e) => setTumZamanlar(e.target.checked)} />
              Tüm zamanlar
            </label>
            {!tumZamanlar && (
              <>
                <div role="group" aria-label="Dönem kısayolları" className="flex flex-wrap gap-2">
                  {donemKisayollari(bugun).map((k) => (
                    <button
                      key={k.etiket}
                      type="button"
                      className={buton("ikincil")}
                      onClick={() => setAralik((a) => ({ baslangic: k.baslangic, bitis: k.bitis, surum: a.surum + 1 }))}
                    >
                      <Ikon ad="donem" />
                      {k.etiket}
                    </button>
                  ))}
                </div>
                <div key={aralik.surum} className="grid gap-4 sm:grid-cols-2">
                  <Field label="Başlangıç günü" name="baslangic" type="date" required defaultValue={aralik.baslangic} sonuc={state} />
                  <Field label="Bitiş günü (dahil)" name="bitis" type="date" required defaultValue={aralik.bitis} sonuc={state} />
                </div>
              </>
            )}
          </>
        )}
        {kod === "STOK" && <Field label="Gün sonu itibarıyla (boşsa bugün)" name="tarih" type="date" sonuc={state} />}

        <fieldset>
          <legend className="mb-1 text-sm font-medium text-slate-700">Biçim</legend>
          <div role="radiogroup" aria-label="Biçim" className="flex gap-4 text-sm text-slate-700">
            <label className="flex items-center gap-2 dokunmatik:min-h-11">
              <input type="radio" name="bicim" value="xlsx" defaultChecked />
              Excel (.xlsx)
            </label>
            <label className="flex items-center gap-2 dokunmatik:min-h-11">
              <input type="radio" name="bicim" value="csv" />
              CSV (.csv)
            </label>
          </div>
        </fieldset>

        <SonucGosterimi sonuc={state} alanlar={ALANLAR} basari={(p) => `Dosya hazırlandı: ${p.satir} satır.`} />
        <SubmitButton ikon="indir">Dosyayı İndir</SubmitButton>
      </div>
    </form>
  );
}
