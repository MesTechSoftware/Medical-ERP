import Link from "next/link";
import { YanPanel } from "@/components/YanPanel";
import { Sparkline } from "@/components/grafik/Sparkline";
import { Ikon } from "@/components/Ikon";
import { StokMiktari } from "@/components/StokMiktari";
import { Tutar } from "@/components/Tutar";
import { buton } from "@/components/stil";
import { LinkButton, StatusBadge, StatusChip } from "@/components/ui";
import { formatDate, formatDateTime } from "@/lib/format";
import { formatla } from "@/lib/money";
import { BRUT, MATRAH, tabanli } from "@/lib/taban";
import type { UrunPaneli as UrunPaneliVerisi } from "@/lib/urun-listesi/sorgu";

const BASLIK = "urun-paneli-baslik";

function Satir({ ad, children }: { ad: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-2 py-1.5 text-sm">
      <dt className="text-slate-500">{ad}</dt>
      <dd className="min-w-0 break-words text-slate-900">{children}</dd>
    </div>
  );
}

function Bolum({ baslik, children }: { baslik: string; children: React.ReactNode }) {
  return (
    <section aria-label={baslik}>
      <h3 className="mb-1 text-xs font-medium uppercase text-slate-500">{baslik}</h3>
      {children}
    </section>
  );
}

const Yok = ({ metin = "kayıt yok" }: { metin?: string }) => <span className="text-slate-400">{metin}</span>;

const gecerlilik = (s: { validFrom: Date | null; validTo: Date | null }) =>
  s.validFrom || s.validTo
    ? `${s.validFrom ? formatDate(s.validFrom) : "…"} – ${s.validTo ? formatDate(s.validTo) : "…"}`
    : "Süresiz";

/**
 * Ürün listesinin yan paneli (spec Ü-19 §3.6): özet, 90 günlük stok çizgisi, son 10 stok hareketi
 * ve ürünün fiyat listeleri. Düzenle yalnız `YONETICI`'ye; Stok girişi herkese (D-2 17.10 eki).
 */
export function UrunPaneli({
  veri,
  kapatAdresi,
  yonetici,
}: {
  veri: UrunPaneliVerisi;
  kapatAdresi: string;
  yonetici: boolean;
}) {
  const { urun: u, seri } = veri;
  return (
    <YanPanel kapatAdresi={kapatAdresi} baslikId={BASLIK} kayitId={u.id}>
      <div className="flex h-full flex-col">
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 p-4">
          <div className="min-w-0">
            <h2 id={BASLIK} className="text-base font-semibold text-slate-900">
              {u.name}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-slate-500">{u.code}</span>
              <StokMiktari miktar={u.stok} />
              <StatusBadge status={u.status} />
            </div>
          </div>
          <Link href={kapatAdresi} scroll={false} className={buton("metin")}>
            <Ikon ad="vazgec" />
            Kapat
          </Link>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          <Bolum baslik="Özet">
            <dl className="divide-y divide-slate-100">
              <Satir ad="Stok">{u.stok}</Satir>
              <Satir ad="KDV oranı">{formatla(u.kdvOrani, "oran")}</Satir>
              {/* Tablodaki KDV dahil sütunu gizli olsa da panelde ikisi de görünür (spec §3.6). */}
              <Satir ad={tabanli("Liste fiyatı", MATRAH)}>
                <Tutar deger={u.fiyat} taban={MATRAH} baslikta />
              </Satir>
              <Satir ad={tabanli("Liste fiyatı", BRUT)}>
                <Tutar deger={u.fiyatKdvDahil} taban={BRUT} baslikta />
              </Satir>
            </dl>
          </Bolum>

          <Bolum baslik="Stok — son 90 gün">
            <Sparkline
              seri={seri.map((g) => g.stok)}
              boyut="M"
              ozet={seri.length > 0 ? `90 gün önce ${seri[0].stok}, bugün ${seri.at(-1)!.stok}` : "veri yok"}
            />
          </Bolum>

          <Bolum baslik="Son stok hareketleri">
            {veri.hareketler.length === 0 ? (
              <Yok />
            ) : (
              <ul className="divide-y divide-slate-100">
                {veri.hareketler.map((h) => (
                  <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 py-1.5 text-sm">
                    <span className="min-w-0">
                      {h.tur}
                      <span className="ml-2 text-slate-500">
                        {formatDateTime(h.createdAt)} · {h.konum}
                      </span>
                    </span>
                    <span className="tabular-nums">
                      {h.miktar > 0 ? "+" : "−"}
                      {Math.abs(h.miktar)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Bolum>

          <Bolum baslik="Fiyat listeleri">
            {veri.listeler.length === 0 ? (
              <Yok metin="Bu ürün hiçbir fiyat listesinde yok." />
            ) : (
              <ul className="space-y-3">
                {veri.listeler.map((l) => (
                  <li key={l.id} className="text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Kod düz metin: /price-lists yalnız YONETICI'nindir. */}
                      <span className="font-medium text-slate-900">{l.code}</span>
                      <span className="text-slate-500">{l.name}</span>
                      {l.varsayilan && <StatusChip ton="notr">Varsayılan</StatusChip>}
                      {!l.isActive && <StatusChip ton="notr">Pasif</StatusChip>}
                    </div>
                    <ul className="mt-1 divide-y divide-slate-100">
                      {l.satirlar.map((s, i) => (
                        <li key={i} className="flex flex-wrap items-center justify-between gap-2 py-1">
                          <span className="text-slate-500">
                            {s.minQuantity}+ adet · {gecerlilik(s)}
                          </span>
                          <span className="tabular-nums">
                            <Tutar deger={s.listPrice} taban={MATRAH} />
                          </span>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </Bolum>
        </div>

        <footer className="flex flex-wrap items-center gap-3 border-t border-slate-200 p-4">
          <LinkButton href={`/stock?urun=${u.id}`} ikon="yeni">
            Stok girişi
          </LinkButton>
          {yonetici && (
            <Link href={`/products/${u.id}/edit`} className={buton("metin")}>
              <Ikon ad="duzenle" />
              Düzenle
            </Link>
          )}
        </footer>
      </div>
    </YanPanel>
  );
}
