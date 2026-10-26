"use client";

import { startTransition, useActionState, useState } from "react";
import type { ImportDataType } from "@/generated/prisma/enums";
import { SatirHatalari, SonucGosterimi } from "@/components/Sonuc";
import type { IceAktarimSonucu } from "@/lib/ice-aktarim";
import { iceAktar, sablonIndir } from "./actions";
import { KONTROL_COK_SATIR, KONTROL_TEK_SATIR, buton } from "@/components/stil";

const KUTU = `w-full ${KONTROL_TEK_SATIR}`;

/**
 * Doğrula → önizle → yaz (X-16 §(4)/(7)): "Yaz" yalnız hatasız önizlemeden sonra açılır ve özetin
 * altında durur. Satır hataları satır numarası ve kolonla listelenir; hiçbiri atılmaz (X-4 §(7)).
 */
export default function IceAktarimFormu({ turler }: { turler: { kod: ImportDataType; ad: string }[] }) {
  const [sonuc, formAction, gonderiliyor] = useActionState<IceAktarimSonucu | null, FormData>(iceAktar, null);
  const [tur, setTur] = useState<ImportDataType>(turler[0].kod);
  const satirHatalari = (sonuc?.bildirimler ?? []).filter((b) => b.parametreler.satir !== undefined);
  const genel = sonuc ? { ...sonuc, bildirimler: sonuc.bildirimler.filter((b) => b.parametreler.satir === undefined) } : null;
  const yazilabilir = sonuc && !sonuc.partiNo && sonuc.durum === "BASARILI" && (sonuc.acilacak ?? 0) > 0;

  async function sablon() {
    const d = (await sablonIndir(tur)).dosya;
    if (!d) return;
    const bayt = Uint8Array.from(atob(d.icerik), (c) => c.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bayt], { type: d.mime }));
    const a = document.createElement("a");
    a.href = url;
    a.download = d.ad;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const veri = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
        startTransition(() => formAction(veri));
      }}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="ia-tur" className="mb-1 block text-sm font-medium text-slate-700">
            Veri türü
          </label>
          <select id="ia-tur" name="tur" value={tur} onChange={(e) => setTur(e.target.value as ImportDataType)} className={KUTU}>
            {turler.map((t) => (
              <option key={t.kod} value={t.kod}>
                {t.ad}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="ia-dosya" className="mb-1 block text-sm font-medium text-slate-700">
            Dosya (.xlsx)
          </label>
          <input id="ia-dosya" name="dosya" type="file" accept=".xlsx" required className={`w-full ${KONTROL_COK_SATIR}`} />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={sablon} className={buton("ikincil")}>
          Şablonu indir
        </button>
        <button type="submit" name="asama" value="onizle" disabled={gonderiliyor} className={buton("birincil", { form: true })}>
          Doğrula ve önizle
        </button>
      </div>

      {genel && <SonucGosterimi sonuc={genel} basari={(p) => (p.partiNo ? `Parti ${p.partiNo} yazıldı.` : "Dosyada hata yok.")} />}

      {sonuc?.ozet && (
        <div className="rounded-lg border border-slate-200 p-4 text-sm">
          <h3 className="mb-2 font-semibold text-slate-900">Önizleme</h3>
          <dl className="grid gap-1 sm:grid-cols-2">
            {sonuc.ozet.map((o) => (
              <div key={o.etiket} className={`flex justify-between gap-2 ${o.bilgi ? "text-sky-800" : "text-slate-700"}`}>
                <dt>{o.etiket}</dt>
                <dd className="tabular-nums">{o.deger}</dd>
              </div>
            ))}
            {(sonuc.kodAdetleri ?? []).map((k) => (
              <div key={k.kod} className="flex justify-between gap-2 text-red-700">
                <dt>Reddedilen — {k.kod}</dt>
                <dd className="tabular-nums">{k.adet}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-2 font-medium text-slate-900">
              <dt>Açılacak kayıt</dt>
              <dd className="tabular-nums">{sonuc.acilacak ?? 0}</dd>
            </div>
          </dl>
          {yazilabilir && (
            <button type="submit" name="asama" value="yaz" disabled={gonderiliyor} className={`mt-4 ${buton("olumlu")}`}>
              Yaz ({sonuc.acilacak} kayıt)
            </button>
          )}
        </div>
      )}

      <SatirHatalari bildirimler={satirHatalari} />
    </form>
  );
}
