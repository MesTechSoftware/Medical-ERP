"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import type { IslemSonucu, Parametreler } from "@/lib/sonuc";
import { bildirimMetni } from "@/lib/sozluk";
import { KONTROL_COK_SATIR, buton } from "@/components/stil";

/**
 * İş sonucunun TEK gösterimi — X-4 §(4) kapalı liste, kademe başına bir desen:
 *
 * - `SERT`: alanı olan bildirim alanın altında, alan işaretli (`Field`'ler `alanHatasi` ile);
 *   alanı olmayan ya da formda gösterilmeyen alanın bildirimi form kutusunda.
 * - `YUMUSAK`: onay diyaloğu; gerekçe zorunlu, aynı formla yeniden gönderilir (`gerekce`).
 *   Yetkisiz kullanıcının gerekçesi belgeyi onaya gönderir: şeritte "onaya gönderildi" (A-8).
 * - `BILGI`: işlem tamamlanır; sonuç ekranında kapatılabilir şerit.
 *
 * Hiçbir bildirim atılmaz (X-4 §(7)): formun göstermediği alanın hatası kutuya düşer.
 */

export type SonucDurumu = IslemSonucu | null;

/** Alanın `SERT` bildirimlerinin metni; yoksa `undefined`. */
export function alanHatasi(sonuc: SonucDurumu | undefined, alan: string): string | undefined {
  const metinler = (sonuc?.bildirimler ?? [])
    .filter((b) => b.kademe === "SERT" && b.alan === alan)
    .map(bildirimMetni);
  return metinler.length > 0 ? metinler.join(" ") : undefined;
}

export function SonucGosterimi({
  sonuc,
  alanlar = [],
  basari,
}: {
  sonuc: SonucDurumu;
  /** Formun kendi altında hata gösterdiği alan adları. */
  alanlar?: readonly string[];
  /** İşlem tamamlandığında (`BASARILI` ya da `BASARILI_UYARILI`) gösterilecek metin; sayfada kalan formlar içindir. */
  basari?: (p: Parametreler) => string;
}) {
  const [kapatilan, setKapatilan] = useState<SonucDurumu>(null);
  if (!sonuc) return null;

  const sert = sonuc.bildirimler.filter((b) => b.kademe === "SERT" && !(b.alan && alanlar.includes(b.alan)));
  const yumusak = sonuc.bildirimler.filter((b) => b.kademe === "YUMUSAK");
  const bilgi = sonuc.bildirimler.filter((b) => b.kademe === "BILGI");

  return (
    <>
      {sert.length > 0 && (
        <ul role="alert" data-kademe="SERT" className="space-y-1 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {sert.map((b, i) => (
            <li key={i}>{bildirimMetni(b)}</li>
          ))}
        </ul>
      )}

      {sonuc.durum === "ONAY_GEREKLI" && yumusak.length > 0 && (
        <div
          role="dialog"
          aria-labelledby="onay-baslik"
          data-kademe="YUMUSAK"
          className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-4"
        >
          <h3 id="onay-baslik" className="text-sm font-semibold text-amber-900">
            Onay gerekiyor
          </h3>
          <ul className="space-y-1 text-sm text-amber-900">
            {yumusak.map((b, i) => (
              <li key={i}>{bildirimMetni(b)}</li>
            ))}
          </ul>
          <div>
            <label htmlFor="gerekce" className="mb-1 block text-sm font-medium text-amber-900">
              Gerekçe
            </label>
            <textarea
              id="gerekce"
              name="gerekce"
              required
              rows={2}
              className={`w-full ${KONTROL_COK_SATIR}`}
            />
          </div>
          <button
            type="submit"
            className={buton("uyari")}
          >
            Gerekçeyle devam et
          </button>
        </div>
      )}

      {sonuc.durum === "BASARILI_UYARILI" && kapatilan !== sonuc && (
        <div
          role="status"
          data-kademe={sonuc.kademe ?? undefined}
          className="flex items-start justify-between gap-3 rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-800"
        >
          <ul className="space-y-1">
            {sonuc.parametreler?.onayaGonderildi === 1 && (
              <li className="font-medium">Onaya gönderildi; yönetici kararından sonra devam edilebilir.</li>
            )}
            {[...yumusak, ...bilgi].map((b, i) => (
              <li key={i}>{bildirimMetni(b)}</li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setKapatilan(sonuc)}
            className="shrink-0 text-xs font-medium text-sky-700 hover:text-sky-900 dokunmatik:min-h-11 dokunmatik:min-w-11"
          >
            Kapat
          </button>
        </div>
      )}

      {(sonuc.durum === "BASARILI" || sonuc.durum === "BASARILI_UYARILI") && basari && (
        <p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          {basari(sonuc.parametreler ?? {})}
        </p>
      )}
    </>
  );
}

/**
 * Satır numaralı `SERT` bildirimler (içe aktarım, X-16 §(4)): satır · kolon · metin tablosu. Toplu
 * girişin tek gösterimi; hiçbiri atılmaz (X-4 §(7)).
 */
export function SatirHatalari({ bildirimler }: { bildirimler: IslemSonucu["bildirimler"] }) {
  if (bildirimler.length === 0) return null;
  return (
    <div className="tablo-kutusu">
      <table className="veri-tablosu" aria-label="Satır hataları" data-kademe="SERT">
        <thead>
          <tr>
            <th>Satır</th>
            <th>Kolon</th>
            <th>Hata</th>
          </tr>
        </thead>
        <tbody>
          {bildirimler.map((b, i) => (
            <tr key={i} className="text-red-700">
              <td className="tabular-nums">{b.parametreler.satir}</td>
              <td>{b.parametreler.kolon ?? "—"}</td>
              <td>{bildirimMetni(b)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Alansız tek düğmeli işlem formu (durum geçişi, silme, sevk): action'ın sonucu formun
 * içinde aynı desenle gösterilir. Form, action'dan sonra sıfırlanmaz: `YUMUSAK` diyaloğu
 * aynı formu gerekçeyle yeniden gönderir ve girilen değerler (ör. kısmi sevk miktarı)
 * korunmalıdır — React form action'ı denetimsiz alanları kendiliğinden sıfırlardı.
 */
export function IslemFormu({
  action,
  children,
  className,
  basariMetni,
}: {
  action: (prev: SonucDurumu, formData: FormData) => Promise<IslemSonucu>;
  children: React.ReactNode;
  className?: string;
  /** Sayfada kalan formun başarı metni; verilirse başarıda form temizlenir. */
  basariMetni?: string;
}) {
  const [sonuc, formAction] = useActionState<SonucDurumu, FormData>(action, null);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (basariMetni && sonuc?.durum === "BASARILI") form.current?.reset();
  }, [sonuc, basariMetni]);
  return (
    <form
      ref={form}
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        // Basılan düğmenin `name`/`value`'su da gönderilir (ör. onay/red).
        const veri = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
        startTransition(() => formAction(veri));
      }}
    >
      {children}
      <SonucGosterimi sonuc={sonuc} basari={basariMetni ? () => basariMetni : undefined} />
    </form>
  );
}
