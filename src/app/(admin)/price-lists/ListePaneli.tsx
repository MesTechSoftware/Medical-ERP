import Link from "next/link";
import { YanPanel } from "@/components/YanPanel";
import { Ikon } from "@/components/Ikon";
import { buton } from "@/components/stil";
import { LinkButton, StatusChip } from "@/components/ui";
import type { ListePaneli as ListePaneliVerisi } from "@/lib/fiyat-listesi-listesi/sorgu";
import { BaremMatrisi } from "./BaremMatrisi";

const BASLIK = "liste-paneli-baslik";

function Satir({ ad, children }: { ad: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[9rem_minmax(0,1fr)] gap-2 py-1.5 text-sm">
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

/**
 * Fiyat listesinin yan paneli (spec Ü-21 §3.5): özet, salt okunur barem matrisi (bugün) ve atanmış
 * cariler. Satır yazımı detay sayfasındadır ("Satırları düzenle").
 */
export function ListePaneli({ veri, kapatAdresi }: { veri: ListePaneliVerisi; kapatAdresi: string }) {
  const { liste: l } = veri;
  const kalan = veri.cariToplam - veri.cariler.length;
  return (
    <YanPanel kapatAdresi={kapatAdresi} baslikId={BASLIK} kayitId={l.id}>
      <div className="flex h-full flex-col">
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 p-4">
          <div className="min-w-0">
            <h2 id={BASLIK} className="text-base font-semibold text-slate-900">
              {l.code}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-slate-500">{l.name}</span>
              {l.varsayilan && <StatusChip ton="notr">Varsayılan</StatusChip>}
              <StatusChip ton={l.aktif ? "olumlu" : "notr"}>{l.aktif ? "Aktif" : "Boş"}</StatusChip>
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
              <Satir ad="Bugün geçerli">
                {l.urunSayisi} ürün · {l.baremSayisi} barem satırı
              </Satir>
              <Satir ad="Satır">
                {veri.gecerliSatir} bugün geçerli / {veri.toplamSatir} toplam
              </Satir>
              {veri.tarihliSatir > 0 && (
                <Satir ad="Tarihli satır">
                  {veri.tarihliSatir} <span className="text-slate-500">· içe aktarımdan gelir</span>
                </Satir>
              )}
              <Satir ad="Atanmış cari">{veri.cariToplam}</Satir>
            </dl>
          </Bolum>

          <Bolum baslik="Barem matrisi">
            <BaremMatrisi matris={veri.matris} />
          </Bolum>

          <Bolum baslik="Atanmış cariler">
            {veri.cariler.length === 0 ? (
              <p className="text-sm text-slate-400">
                {l.varsayilan ? "Atanmamış bütün cariler bu listeyi kullanır." : "Bu listeye atanmış cari yok."}
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {veri.cariler.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2 py-1.5 text-sm">
                    <Link href={`/doctors?detay=${c.id}`} className="text-link underline decoration-link/40 underline-offset-4 hover:decoration-link">
                      {c.fullName}
                    </Link>
                    {c.pasif && <StatusChip ton="notr">Pasif</StatusChip>}
                  </li>
                ))}
                {kalan > 0 && <li className="py-1.5 text-sm text-slate-500">ve {kalan} cari daha</li>}
              </ul>
            )}
          </Bolum>
        </div>

        <footer className="border-t border-slate-200 p-4">
          <LinkButton href={`/price-lists/${l.id}`} ikon="duzenle">
            Satırları düzenle
          </LinkButton>
        </footer>
      </div>
    </YanPanel>
  );
}
