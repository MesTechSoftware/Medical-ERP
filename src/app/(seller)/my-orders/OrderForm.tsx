"use client";

import Link from "next/link";
import { startTransition, useActionState, useMemo, useRef, useState } from "react";
import { SubmitButton } from "@/components/form";
import { SonucGosterimi, type SonucDurumu } from "@/components/Sonuc";
import type { IslemSonucu } from "@/lib/sonuc";
import type { FiyatOnizlemeSonucu } from "@/lib/siparis-giris";
import { Tutar } from "@/components/Tutar";
import { MATRAH, SATIR_TABANI, tabanli } from "@/lib/taban";
import { formatla, paraOku } from "@/lib/money";
import { birimFiyatPozitifMi, hesaplaSatirTutarlari, iskontoYuzdesi } from "@/lib/satir-tutarlari";
import { BEDELSIZ_SEBEP_ADI } from "@/lib/sozluk";
import type { FreeReason } from "@/generated/prisma/enums";
import { KONTROL_TEK_SATIR, buton } from "@/components/stil";
import { Ikon } from "@/components/Ikon";
import { AramaliSecim } from "@/components/AramaliSecim";

type Product = {
  id: string;
  name: string;
  code: string;
  /** Varsayılan listenin fiyatı, KDV hariç ham metin; listede yoksa `null`. Seçili cari belli olunca satırda cari listesinden yeniden çözülür (A-10-2). */
  listPrice: string | null;
  vatRate: string; // %, ham metin
  stock: number;
};

/** Boş bırakılan fiyat = ürünün liste fiyatı. Bedelsiz satırın tutarı 0'dır (A-2). */
type Row = {
  key: number;
  productId: string;
  quantity: number;
  priceText: string;
  /** Seçili cari ve satır miktarı için çözülmüş liste fiyatı (A-10-2): `undefined` = henüz çözülmedi, `null` = listede yok. */
  listPrice: string | null | undefined;
  bedelsiz: boolean;
  sebep: FreeReason;
  aciklama: string;
};

const YENI_SATIR = { productId: "", quantity: 1, priceText: "", listPrice: undefined, bedelsiz: false, sebep: "NUMUNE", aciklama: "" } as const;

export type DoctorOption = {
  id: string;
  fullName: string;
  clinic: string | null;
  title: string | null;
};

export default function OrderForm({
  products,
  doctors,
  action,
  fiyatOnizle,
  iptalHref = "/my-orders",
}: {
  products: Product[];
  doctors: DoctorOption[];
  /** Satıcı ekranı `createOrder`, personel ekranı `createStaffOrder` (aynı `siparisAc` yolu). */
  action: (prev: SonucDurumu, formData: FormData) => Promise<IslemSonucu>;
  /** Cari ve miktara göre liste fiyatını çözer (sunucu `cozumleBirimFiyat`); yoksa `null`. */
  fiyatOnizle?: (doctorId: string, productId: string, quantity: number) => Promise<FiyatOnizlemeSonucu>;
  iptalHref?: string;
}) {
  const [state, formAction, gonderiliyor] = useActionState<SonucDurumu, FormData>(action, null);
  const [rows, setRows] = useState<Row[]>([{ key: 1, ...YENI_SATIR }]);
  const [doctorId, setDoctorId] = useState("");
  const doctorRef = useRef("");

  const doktorSecenekleri = useMemo(
    () =>
      doctors.map((d) => ({
        id: d.id,
        etiket: `${d.title ? `${d.title} ` : ""}${d.fullName}${d.clinic ? ` — ${d.clinic}` : ""}`,
      })),
    [doctors]
  );
  const urunSecenekleri = useMemo(
    () =>
      products.map((p) => ({
        id: p.id,
        etiket: `${p.name} (${p.code})`,
        arama: p.code,
        ayrinti: `Stok: ${p.stock}`,
      })),
    [products]
  );
  const productMap = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products]
  );

  /**
   * Girilen metin = net birim fiyat. Boşsa liste fiyatı. Fiyat girişi daima
   * KDV hariçtir — toggle C6'da söküldü (Ü-3 §(3), `pricing.fiyatGirisiKdvDahil = false`).
   * Geçersiz metin `null` döner ve satır gönderilmez.
   */
  function listeFiyatiOf(row: Row, p: Product | undefined): string | null {
    return row.listPrice === undefined ? (p?.listPrice ?? null) : row.listPrice;
  }

  function birimFiyatOf(row: Row, p: Product | undefined): string | null {
    const liste = listeFiyatiOf(row, p);
    if (!liste) return null;
    const text = row.priceText.trim();
    if (text === "") return liste;
    const d = paraOku(text);
    return d ? formatla(d, "ham") : null;
  }

  const satirlar = rows.map((row) => {
    const p = productMap.get(row.productId);
    return { row, product: p, listeFiyat: listeFiyatiOf(row, p), birimFiyat: birimFiyatOf(row, p) };
  });
  // Bedelsiz olmayan satırda birim fiyat > 0 (A-10-5); sunucu da aynısını sert reddeder.
  const gecerli = satirlar.filter(
    (c) => c.listeFiyat && c.birimFiyat && c.row.quantity > 0 && (c.row.bedelsiz || birimFiyatPozitifMi(c.birimFiyat))
  );

  // Önizleme sunucuyla aynı fonksiyondan geçer: tek yuvarlama noktası (C-6 §(5)).
  const hesap = hesaplaSatirTutarlari(
    gecerli.map((c) => ({
      birimFiyat: c.birimFiyat!,
      listeFiyat: c.listeFiyat!,
      kdvOrani: c.product!.vatRate,
      miktar: c.row.quantity,
      bedelsiz: c.row.bedelsiz,
    }))
  );
  const tutarOf = new Map(gecerli.map((c, i) => [c.row.key, hesap.satirlar[i]]));
  const computed = satirlar.map((c) => ({ ...c, totals: tutarOf.get(c.row.key) }));

  // Sunucuya net birim fiyat ham metin olarak gider (kanonik değer nettir, X-5) — yalnız elle girildiyse.
  // Boş fiyat gönderilmez: liste fiyatını sunucu **carinin** listesinden çözer (X-10 §(2)); önizlemenin
  // varsayılan liste fiyatını göndermek atanmış listeyi ezerdi.
  const items = gecerli.map((c) => ({
    productId: c.row.productId,
    quantity: c.row.quantity,
    ...(c.row.priceText.trim() && !c.row.bedelsiz ? { birimFiyat: c.birimFiyat! } : {}),
    ...(c.row.bedelsiz
      ? { bedelsiz: { sebep: c.row.sebep, ...(c.row.aciklama.trim() ? { aciklama: c.row.aciklama.trim() } : {}) } }
      : {}),
  }));

  /** Satırın liste fiyatını seçili cari ve miktar için çözer; arada cari/ürün/miktar değiştiyse sonuç atılır. */
  async function fiyatiCoz(row: Row, doktor: string) {
    // Cari seçilmeden liste fiyatı çözülmez; satır varsayılan liste fiyatıyla gösterilir.
    if (!fiyatOnizle || !row.productId || !doktor) return;
    const { listeFiyat: liste } = await fiyatOnizle(doktor, row.productId, row.quantity);
    setRows((rs) =>
      rs.map((x) =>
        x.key === row.key && x.productId === row.productId && x.quantity === row.quantity && doctorRef.current === doktor
          ? { ...x, listPrice: liste }
          : x
      )
    );
  }
  function doktorSec(id: string) {
    setDoctorId(id);
    doctorRef.current = id;
    const yeni = rows.map((r) => ({ ...r, listPrice: undefined }));
    setRows(yeni);
    yeni.forEach((r) => void fiyatiCoz(r, id));
  }
  function urunSec(row: Row, productId: string) {
    const yeni = { ...row, productId, priceText: "", listPrice: undefined };
    updateRow(row.key, yeni);
    void fiyatiCoz(yeni, doctorRef.current);
  }
  function miktarDegisti(row: Row, quantity: number) {
    const yeni = { ...row, quantity, listPrice: undefined };
    updateRow(row.key, yeni);
    void fiyatiCoz(yeni, doctorRef.current);
  }

  function addRow() {
    setRows((rs) => [...rs, { key: Date.now(), ...YENI_SATIR }]);
  }
  function removeRow(key: number) {
    setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.key !== key) : rs));
  }
  function updateRow(key: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  return (
    // Form action'ının kendiliğinden sıfırlaması kullanılmaz: gerekçe diyaloğu (A-8) aynı formu
    // yeniden gönderir ve sıfırlama denetimli alanların DOM değerini de boşaltırdı.
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        const veri = new FormData(e.currentTarget);
        startTransition(() => formAction(veri));
      }}
    >
      <input type="hidden" name="items" value={JSON.stringify(items)} />

      {/* Doktor artık serbest metin değil, portföydeki bir varlık (BRK-02).
          Yalnızca kendi doktorları listelenir; sahiplik sunucuda da doğrulanır. */}
      <div className="max-w-md">
        {doctors.length === 0 ? (
          <p className="rounded-lg border border-critical/30 bg-critical-bg px-3 py-2 text-sm text-critical">
            Portföyünüzde doktor yok.{" "}
            <Link href="/my-doctors/new" className="font-medium underline">
              Önce doktor ekleyin
            </Link>
            .
          </p>
        ) : (
          <AramaliSecim
            id="doctorId"
            name="doctorId"
            etiket="Doktor"
            secenekler={doktorSecenekleri}
            deger={doctorId}
            onSec={doktorSec}
            yerTutucu="Ad, klinik ya da unvan yazın…"
          />
        )}
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">
            Sipariş Kalemleri
          </h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={addRow}
              className={buton("metin")}
            >
              <Ikon ad="yeni" />
              Kalem Ekle
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {computed.map(({ row, product: p, listeFiyat, birimFiyat, totals }) => {
            const oran = listeFiyat && birimFiyat && !row.bedelsiz ? iskontoYuzdesi(listeFiyat, birimFiyat) : null;
            const uyari = !p
              ? null
              : !listeFiyat
                ? "Bu cari için fiyat listesinde yok — bu kalem gönderilmez."
                : !row.bedelsiz && birimFiyat && !birimFiyatPozitifMi(birimFiyat)
                  ? "Birim fiyat 0'dan büyük olmalı; ücretsiz kalem için Bedelsiz seçin."
                  : null;
            return (
              <div key={row.key} className="space-y-2 rounded-lg border border-slate-200 p-3">
                <div className="flex flex-wrap items-start gap-2">
                  <div className="min-w-0 basis-full sm:basis-auto sm:flex-1 sm:min-w-[260px]">
                    <AramaliSecim
                      id={`product-${row.key}`}
                      etiket="Ürün"
                      secenekler={urunSecenekleri}
                      deger={row.productId}
                      onSec={(id) => urunSec(row, id)}
                      yerTutucu="Ürün adı ya da kodu yazın…"
                    />
                    {p && (
                      <p className="mt-1 text-xs text-slate-500">
                        Stok: {p.stock} · KDV %{p.vatRate.replace(/\.00$/, "")} · Liste:{" "}
                        {listeFiyat ? <Tutar deger={listeFiyat} taban={MATRAH} /> : "yok"}
                      </p>
                    )}
                  </div>

                  <div className="w-24">
                    <label htmlFor={`qty-${row.key}`} className="mb-1 block text-xs text-slate-500">
                      Miktar
                    </label>
                    <input
                      id={`qty-${row.key}`}
                      type="number"
                      min={1}
                      value={row.quantity}
                      onChange={(e) => miktarDegisti(row, Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className={`w-full ${KONTROL_TEK_SATIR}`}
                    />
                  </div>

                  {/* FR-12: satıcı birim fiyatı değiştirebilir. Taban fiyat reddi C6'da söküldü (GÇ-8, A-10);
                      giriş matrahtır, etiketi yanında (Ü-3 §(6)). Yüzde tek fonksiyondan (A-10-3). */}
                  <div className="w-36">
                    <label htmlFor={`price-${row.key}`} className="mb-1 block text-xs text-slate-500">
                      {tabanli("Birim", MATRAH)}
                    </label>
                    <input
                      id={`price-${row.key}`}
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder={listeFiyat ?? "—"}
                      disabled={row.bedelsiz}
                      value={row.bedelsiz ? "" : row.priceText}
                      onChange={(e) => updateRow(row.key, { priceText: e.target.value })}
                      className={`w-full tabular-nums ${KONTROL_TEK_SATIR}`}
                    />
                    {oran && !oran.isZero() && (
                      <p data-iskonto className={`mt-1 text-xs tabular-nums ${oran.isNegative() ? "text-slate-500" : "text-positive"}`}>
                        {oran.isNegative() ? `+${formatla(oran.abs(), "oran")} liste üstü` : `${formatla(oran, "oran")} iskonto`}
                      </p>
                    )}
                  </div>

                  {/* Salt-okunur gösterimler: form kontrolü olmadıkları için <label> değil. */}
                  <div className="w-24 text-right">
                    <span className="mb-1 block text-xs text-slate-500">KDV</span>
                    <div className="py-2 text-sm tabular-nums text-slate-500">
                      <Tutar deger={totals?.kdvTutar} taban={SATIR_TABANI.kdvTutar} baslikta />
                    </div>
                  </div>

                  <div className="w-28 text-right">
                    <span className="mb-1 block text-xs text-slate-500">{tabanli("Tutar", SATIR_TABANI.matrah)}</span>
                    <div className="py-2 text-sm font-medium tabular-nums text-slate-900">
                      <Tutar deger={totals?.matrah} taban={SATIR_TABANI.matrah} baslikta />
                    </div>
                  </div>

                  <div className="ml-auto flex items-center gap-3 self-end pb-1">
                    {/* A-2: bedelsiz satır — sebep kapalı listeden; "Diğer"de açıklama zorunlu. Numune
                        dışındaki sebepler siparişi yönetici onayına gönderir (A-2 eki 20.10.2026). */}
                    <div className="flex items-center gap-2">
                      <input
                        id={`free-${row.key}`}
                        type="checkbox"
                        checked={row.bedelsiz}
                        onChange={(e) => updateRow(row.key, { bedelsiz: e.target.checked })}
                      />
                      <label
                        htmlFor={`free-${row.key}`}
                        className="text-xs text-slate-600 dokunmatik:inline-flex dokunmatik:min-h-11 dokunmatik:items-center dokunmatik:pr-2"
                      >
                        Bedelsiz
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRow(row.key)}
                      className="inline-flex items-center justify-center px-2 py-2 text-sm text-slate-400 hover:text-negative dokunmatik:min-h-11 dokunmatik:min-w-11"
                      aria-label="Kalemi sil"
                    >
                      <Ikon ad="sil" />
                    </button>
                  </div>
                </div>

                {row.bedelsiz && (
                  <div className="flex flex-wrap gap-2">
                    <div className="w-44">
                      <label htmlFor={`reason-${row.key}`} className="mb-1 block text-xs text-slate-500">
                        Bedelsiz sebebi
                      </label>
                      <select
                        id={`reason-${row.key}`}
                        value={row.sebep}
                        onChange={(e) => updateRow(row.key, { sebep: e.target.value as FreeReason })}
                        className={`w-full ${KONTROL_TEK_SATIR}`}
                      >
                        {Object.entries(BEDELSIZ_SEBEP_ADI).map(([kod, ad]) => (
                          <option key={kod} value={kod}>
                            {ad}
                          </option>
                        ))}
                      </select>
                    </div>
                    {row.sebep === "DIGER" && (
                      <div className="min-w-[160px] flex-1">
                        <label htmlFor={`note-${row.key}`} className="mb-1 block text-xs text-slate-500">
                          Açıklama
                        </label>
                        <input
                          id={`note-${row.key}`}
                          maxLength={200}
                          value={row.aciklama}
                          onChange={(e) => updateRow(row.key, { aciklama: e.target.value })}
                          className={`w-full ${KONTROL_TEK_SATIR}`}
                        />
                      </div>
                    )}
                  </div>
                )}
                {uyari && <p className="text-xs text-critical">{uyari}</p>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Toplamlar kalemlerin TOPLAMIDIR; yeniden yuvarlanmaz (C-6 §(5)). */}
      <div className="flex justify-end">
        <dl className="w-64 space-y-1 text-sm">
          <div className="flex justify-between text-slate-600">
            <dt>{tabanli("Ara Toplam", SATIR_TABANI.matrah)}</dt>
            <dd className="tabular-nums">
              <Tutar deger={hesap.toplam.matrah} taban={SATIR_TABANI.matrah} baslikta />
            </dd>
          </div>
          <div className="flex justify-between text-slate-600">
            <dt>KDV</dt>
            <dd className="tabular-nums">
              <Tutar deger={hesap.toplam.kdvTutar} taban={SATIR_TABANI.kdvTutar} baslikta />
            </dd>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-1 font-semibold text-slate-900">
            <dt>{tabanli("Genel Toplam", SATIR_TABANI.toplam)}</dt>
            <dd className="tabular-nums">
              <Tutar deger={hesap.toplam.toplam} taban={SATIR_TABANI.toplam} baslikta />
            </dd>
          </div>
        </dl>
      </div>

      <SonucGosterimi sonuc={state} />

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton ikon="kaydet" disabled={items.length === 0 || gonderiliyor}>
          Siparişi Oluştur
        </SubmitButton>
        <Link
          href={iptalHref}
          className={buton("metin")}
        >
          <Ikon ad="vazgec" />
          İptal
        </Link>
      </div>
    </form>
  );
}
