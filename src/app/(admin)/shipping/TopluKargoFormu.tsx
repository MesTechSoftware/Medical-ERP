"use client";

import { startTransition, useActionState, useRef } from "react";
import { Ikon } from "@/components/Ikon";
import { SonucGosterimi, TopluKargoSonucListesi } from "@/components/Sonuc";
import { KONTROL_TEK_SATIR, buton } from "@/components/stil";
import { TOPLU_SINIR, tumunuSecDurumu } from "@/lib/kargo-listesi/suzgec";
import { topluKargola, type TopluKargoSonucu } from "./actions";

/**
 * Toplu kargo formu (spec Ü-24 §3.3, 12-A): tablo (sunucuda çizilir, `children`) + ortak firma + Tümünü seç +
 * Seçilenleri kargola. Gönderimden sonra form sıfırlanmaz: yazılmayan siparişin takip numarası satırında kalır.
 * Sonuç sipariş başına listelenir; başarılı satırlar sayfa yenilenince tablodan düşer.
 */
export function TopluKargoFormu({
  firmalar,
  children,
}: {
  firmalar: readonly { id: string; name: string }[];
  children: React.ReactNode;
}) {
  const [sonuc, formAction, bekliyor] = useActionState<TopluKargoSonucu | null, FormData>(topluKargola, null);
  const form = useRef<HTMLFormElement>(null);
  const tumunuSec = () => {
    const kutular = [...(form.current?.querySelectorAll<HTMLInputElement>('input[name="secili"]:not(:disabled)') ?? [])];
    tumunuSecDurumu(kutular.map((k) => k.checked)).forEach((d, i) => (kutular[i].checked = d));
  };
  return (
    <form
      ref={form}
      aria-label="Toplu kargo"
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const veri = new FormData(e.currentTarget);
        startTransition(() => formAction(veri));
      }}
    >
      {/* Sonuç tablonun üstünde (spec §3.3): uzun kuyrukta düğmelerin altında kaybolmaz. */}
      <SonucGosterimi sonuc={sonuc} />
      {sonuc && <TopluKargoSonucListesi satirlar={sonuc.satirlar} />}
      {children}
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[200px] flex-1 sm:flex-none">
          <label htmlFor="toplu-firma" className="mb-1 block text-xs text-slate-500">
            Kargo firması (seçilenlerin hepsi)
          </label>
          <select id="toplu-firma" name="carrierId" defaultValue="" className={`w-full ${KONTROL_TEK_SATIR}`}>
            <option value="">Seçiniz...</option>
            {firmalar.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
        <button type="button" onClick={tumunuSec} className={buton("ikincil")}>
          <Ikon ad="onayla" />
          {`Tümünü seç (en çok ${TOPLU_SINIR})`}
        </button>
        <button type="submit" disabled={bekliyor} className={buton("birincil")}>
          <Ikon ad="kargola" />
          Seçilenleri kargola
        </button>
      </div>
    </form>
  );
}
