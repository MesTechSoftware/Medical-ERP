"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import type { IslemSonucu, Parametreler } from "@/lib/sonuc";
import { bildirimMetni } from "@/lib/sozluk";
import { KONTROL_COK_SATIR, buton } from "@/components/stil";
import { Ikon } from "@/components/Ikon";

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
        <ul role="alert" data-kademe="SERT" className="space-y-1 rounded-lg bg-negative-bg px-3 py-2 text-sm text-negative">
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
          className="space-y-3 rounded-lg border border-critical/30 bg-critical-bg p-4"
        >
          <h3 id="onay-baslik" className="text-sm font-semibold text-critical">
            Onay gerekiyor
          </h3>
          <ul className="space-y-1 text-sm text-critical">
            {yumusak.map((b, i) => (
              <li key={i}>{bildirimMetni(b)}</li>
            ))}
          </ul>
          <div>
            <label htmlFor="gerekce" className="mb-1 block text-sm font-medium text-critical">
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
            <Ikon ad="ileri" />
          </button>
        </div>
      )}

      {sonuc.durum === "BASARILI_UYARILI" && kapatilan !== sonuc && (
        <div
          role="status"
          data-kademe={sonuc.kademe ?? undefined}
          className="flex items-start justify-between gap-3 rounded-lg bg-information-bg px-3 py-2 text-sm text-information"
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
            className="inline-flex shrink-0 items-center justify-center gap-1 text-xs font-medium text-information hover:underline dokunmatik:min-h-11 dokunmatik:min-w-11"
          >
            <Ikon ad="vazgec" />
            Kapat
          </button>
        </div>
      )}

      {(sonuc.durum === "BASARILI" || sonuc.durum === "BASARILI_UYARILI") && basari && (
        <p role="status" className="rounded-lg bg-positive-bg px-3 py-2 text-sm text-positive">
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
            <tr key={i} className="text-negative">
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

/** Toplu işlemde bir belgenin sonucu (toplu kargo, A-3-3). */
export type TopluSonucSatiri = {
  siparisId: string;
  belge: string | null;
  cari: string | null;
  durum: "SEVK_EDILDI" | "ONAYA_GONDERILDI" | "HATA" | "TEKNIK";
  sevkiyat: string | null;
  /** Teknik hatanın log referansı (X-3 §(2)); hata gövdesi gösterilmez. */
  referans: string | null;
  tamamlandi: boolean;
  sonucDurumu: IslemSonucu["durum"] | null;
  bildirimler: IslemSonucu["bildirimler"];
};

/**
 * Toplu kargonun sipariş başına sonucu (spec Ü-24 §3.3): yazılan sevkiyat, onaya gönderilen ya da
 * yazılmayan sipariş nedeniyle. Bildirimlerin metni buradadır (X-4-2); hiçbiri atılmaz.
 */
export function TopluKargoSonucListesi({ satirlar }: { satirlar: readonly TopluSonucSatiri[] }) {
  if (satirlar.length === 0) return null;
  return (
    <section role="status" aria-label="Toplu kargo sonucu" className="rounded-lg border border-slate-200 p-3">
      <h3 className="mb-2 text-sm font-semibold text-slate-900">Toplu kargo sonucu</h3>
      <ul className="divide-y divide-slate-100 text-sm">
        {satirlar.map((r) => {
          const metin = r.bildirimler.map(bildirimMetni).join(" ");
          return (
            <li key={r.siparisId} className="flex flex-wrap items-baseline gap-x-2 py-1.5">
              <span className="font-medium text-slate-900">{r.belge ?? "Sipariş bulunamadı"}</span>
              {r.cari && <span className="text-slate-500">{r.cari}</span>}
              <span className={r.durum === "SEVK_EDILDI" ? "text-positive" : r.durum === "ONAYA_GONDERILDI" ? "text-critical" : "text-negative"}>
                {r.durum === "SEVK_EDILDI"
                  ? `${r.sevkiyat} yazıldı${r.tamamlandi ? " — sipariş kargolandı" : ""}`
                  : r.durum === "TEKNIK"
                    ? `Teknik bir hata oluştu; sipariş yazılmadı. Referans: ${r.referans}`
                    : r.durum === "ONAYA_GONDERILDI"
                    ? `Onaya gönderildi: ${metin}`
                    : r.sonucDurumu === "ONAY_GEREKLI"
                      ? `Onay gerekli: ${metin} — Kısmi sevk panelinden gerekçeyle gönderin.`
                      : metin}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
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
