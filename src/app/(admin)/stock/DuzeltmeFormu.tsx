"use client";

import { startTransition, useActionState, useState } from "react";
import { SonucGosterimi, type SonucDurumu } from "@/components/Sonuc";
import { addStockAdjustment } from "./actions";
import { KONTROL_TEK_SATIR, buton } from "@/components/stil";
import { Ikon } from "@/components/Ikon";

type Secenek = { value: string; label: string };
type Satir = { key: number; urunId: string; konumId: string; fark: string; sebepId: string; aciklama: string };

const KUTU = `w-full ${KONTROL_TEK_SATIR}`;

/**
 * Stok düzeltme formu (B-7) — yalnız yönetici. Sayım doğası gereği çok satırlı; fark ± tam sayıdır.
 * Konum seçimi birden çok konum varsa görünür (B-4: UI satır sayısından türer).
 */
export default function DuzeltmeFormu({
  urunler,
  konumlar,
  sebepler,
}: {
  urunler: Secenek[];
  konumlar: Secenek[];
  sebepler: Secenek[];
}) {
  const [sonuc, formAction] = useActionState<SonucDurumu, FormData>(addStockAdjustment, null);
  const yeni = (key: number): Satir => ({ key, urunId: "", konumId: konumlar[0]?.value ?? "", fark: "", sebepId: "", aciklama: "" });
  const [satirlar, setSatirlar] = useState<Satir[]>([yeni(1)]);
  const guncelle = (key: number, p: Partial<Satir>) => setSatirlar((ss) => ss.map((s) => (s.key === key ? { ...s, ...p } : s)));

  const kalemler = satirlar.map((s) => ({
    urunId: s.urunId,
    konumId: s.konumId,
    fark: /^-?\d+$/.test(s.fark.trim()) ? parseInt(s.fark.trim(), 10) : NaN,
    sebepId: s.sebepId,
    aciklama: s.aciklama,
  }));

  return (
    <form
      className="space-y-3"
      key={sonuc?.durum === "BASARILI" ? String(sonuc.parametreler?.documentNo) : "duzeltme"}
      onSubmit={(e) => {
        e.preventDefault();
        const veri = new FormData(e.currentTarget);
        startTransition(() => formAction(veri));
      }}
    >
      <input type="hidden" name="kalemler" value={JSON.stringify(kalemler)} />
      {satirlar.map((s, i) => (
        <div key={s.key} className="space-y-2 rounded-lg border border-slate-200 p-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label htmlFor={`dzl-urun-${i}`} className="mb-1 block text-xs text-slate-500">
                Ürün
              </label>
              <select id={`dzl-urun-${i}`} value={s.urunId} onChange={(e) => guncelle(s.key, { urunId: e.target.value })} className={KUTU}>
                <option value="">Seçiniz...</option>
                {urunler.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            {konumlar.length > 1 && (
              <div className="col-span-2">
                <label htmlFor={`dzl-konum-${i}`} className="mb-1 block text-xs text-slate-500">
                  Konum
                </label>
                <select id={`dzl-konum-${i}`} value={s.konumId} onChange={(e) => guncelle(s.key, { konumId: e.target.value })} className={KUTU}>
                  {konumlar.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label htmlFor={`dzl-fark-${i}`} className="mb-1 block text-xs text-slate-500">
                Fark (±)
              </label>
              <input id={`dzl-fark-${i}`} type="number" step={1} value={s.fark} onChange={(e) => guncelle(s.key, { fark: e.target.value })} className={KUTU} />
            </div>
            <div>
              <label htmlFor={`dzl-sebep-${i}`} className="mb-1 block text-xs text-slate-500">
                Sebep
              </label>
              <select id={`dzl-sebep-${i}`} value={s.sebepId} onChange={(e) => guncelle(s.key, { sebepId: e.target.value })} className={KUTU}>
                <option value="">Seçiniz...</option>
                {sebepler.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label htmlFor={`dzl-aciklama-${i}`} className="mb-1 block text-xs text-slate-500">
                Açıklama
              </label>
              <input id={`dzl-aciklama-${i}`} value={s.aciklama} onChange={(e) => guncelle(s.key, { aciklama: e.target.value })} className={KUTU} />
            </div>
          </div>
          {satirlar.length > 1 && (
            <button type="button" onClick={() => setSatirlar((ss) => ss.filter((x) => x.key !== s.key))} className="inline-flex items-center justify-center gap-1 text-xs text-slate-400 hover:text-negative dokunmatik:min-h-11 dokunmatik:min-w-11">
              <Ikon ad="sil" />
              Satırı sil
            </button>
          )}
        </div>
      ))}
      <button type="button" onClick={() => setSatirlar((ss) => [...ss, yeni(Math.max(...ss.map((x) => x.key)) + 1)])} className={buton("metin")}>
        <Ikon ad="yeni" />
        Satır Ekle
      </button>
      <div>
        <label htmlFor="dzl-tutanak" className="mb-1 block text-xs text-slate-500">
          Tutanak No (isteğe bağlı)
        </label>
        <input id="dzl-tutanak" name="externalDocNo" maxLength={64} className={KUTU} />
      </div>
      <SonucGosterimi sonuc={sonuc} basari={(p) => `Stok düzeltme kaydedildi: ${p.documentNo}.`} />
      <button type="submit" className={buton("birincil", { form: true })}>
        <Ikon ad="kaydet" />
        Düzeltmeyi Kaydet
      </button>
    </form>
  );
}
