"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { Field, SubmitButton } from "@/components/form";
import { SonucGosterimi } from "@/components/Sonuc";
import { StatusChip } from "@/components/ui";
import { buton } from "@/components/stil";
import { Ikon } from "@/components/Ikon";
import { donemKisayollari } from "@/lib/disa-aktarim-donem";
import { ARALIKLI, VERI_SETLERI, type VeriSeti } from "@/lib/disa-aktarim-katalog";
import { disaAktar, type DisaAktarimSonucu } from "./actions";

type Rozet = "Dönem ister" | "Gün sonu" | "Anlık";

/** Veri setinin adı ve ne içerdiği (spec Ü-29 §3); kod listesi sunucuyla tek kaynaktır (`disa-aktarim-katalog`). */
const TANIM: Record<VeriSeti, { ad: string; aciklama: string }> = {
  CARI_HAREKET: { ad: "Cari hareket", aciklama: "Bütün cari hareketler tipi, yönü ve vadesiyle; açılış ve vade farkı dahil — mutabakat için." },
  TAHSILAT: { ad: "Tahsilat hareket listesi", aciklama: "Tahsilatlar yöntemi, komisyonu, referansı ve durumuyla." },
  SIPARIS: { ad: "Sipariş", aciklama: "Sayılan siparişlerin satırları ürün, fiyat ve KDV'siyle; bedelsiz işaretli." },
  STOK: { ad: "Stok miktarı", aciklama: "Gün sonu itibarıyla ürün ve konum başına miktar; tutar yok, yıl içi düzeltmeler işaretli." },
  DOKTOR_LISTESI: { ad: "Doktor listesi", aciklama: "Cariler fatura bilgileri ve sorumlu satıcısıyla." },
  FATURA_HAZIRLIK: { ad: "Fatura hazırlık (sevk günü)", aciklama: "Sevk günündeki satırlar, kurulumdaki şablonun sütun eşlemesiyle." },
};
/** Dönem rozeti sunucunun aralık listesinden türer: dönem alanlarının görünmesi ile sunucunun istemesi aynı kaynaktır. */
const rozet = (kod: VeriSeti): Rozet => (ARALIKLI.includes(kod) ? "Dönem ister" : kod === "STOK" ? "Gün sonu" : "Anlık");
/** Altında hata gösterilen alanlar; `kod` ve `bicim` hataları özet kutusunda görünür. */
const ALANLAR = ["baslangic", "bitis", "tarih"] as const;

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
  const [kod, setKod] = useState<VeriSeti>("CARI_HAREKET");
  const [tumZamanlar, setTumZamanlar] = useState(false);
  // Kısayol alanların varsayılanını değiştirir; `surum` alanları yeniden kurar.
  const [aralik, setAralik] = useState({ baslangic: "", bitis: "", surum: 0 });

  useEffect(() => {
    if (state?.dosya) indir(state.dosya);
  }, [state]);

  const donemIster = ARALIKLI.includes(kod);

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        // Elle gönderim (`IslemFormu` gibi): React'in form eylemi alanları sıfırlar — girilen günler ve biçim kalsın.
        e.preventDefault();
        const veri = new FormData(e.currentTarget);
        startTransition(() => formAction(veri));
      }}
    >
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-slate-700">Veri seti</legend>
        <div role="radiogroup" aria-label="Veri seti" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {VERI_SETLERI.map((v) => {
            const pasif = v === "FATURA_HAZIRLIK" && !faturaSablonuVar;
            const secilen = kod === v;
            return (
              <label
                key={v}
                className={`flex gap-3 rounded-xl border p-4 text-sm transition ${
                  secilen ? "border-information bg-information-bg" : "border-slate-200 bg-white hover:border-slate-300"
                } ${pasif ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
              >
                <input type="radio" name="kod" value={v} checked={secilen} disabled={pasif} onChange={() => setKod(v)} className="mt-0.5" />
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-slate-900">{TANIM[v].ad}</span>
                    <StatusChip ton="notr">{rozet(v)}</StatusChip>
                  </span>
                  <span className="mt-1 block text-slate-500">{TANIM[v].aciklama}</span>
                  {pasif && <span className="mt-1 block text-slate-500">Kurulumda fatura şablonu tanımlanmadığı için seçilemez.</span>}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="max-w-lg space-y-4">
        {donemIster && (
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
