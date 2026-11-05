import Link from "next/link";
import { Panel, PanelBolumu as Bolum, PanelSatiri } from "@/components/panel/Panel";
import { LinkButton, StatusChip } from "@/components/ui";
import type { ListePaneli as ListePaneliVerisi } from "@/lib/fiyat-listesi-listesi/sorgu";
import { BaremMatrisi } from "./BaremMatrisi";
import { BAGLANTI } from "@/components/stil";

const Satir = (p: { ad: string; children: React.ReactNode }) => <PanelSatiri etiket="genis" {...p} />;

/**
 * Fiyat listesinin yan paneli (spec Ü-21 §3.5): özet, salt okunur barem matrisi (bugün) ve atanmış
 * cariler. Satır yazımı detay sayfasındadır ("Satırları düzenle").
 */
export function ListePaneli({ veri, kapatAdresi }: { veri: ListePaneliVerisi; kapatAdresi: string }) {
  const { liste: l } = veri;
  const kalan = veri.cariToplam - veri.cariler.length;
  return (
    <Panel
      kapatAdresi={kapatAdresi}
      kayitId={l.id}
      baslik={l.code}
      ust={
        <>
          <span className="text-slate-500">{l.name}</span>
          {l.varsayilan && <StatusChip ton="notr">Varsayılan</StatusChip>}
          <StatusChip ton={l.aktif ? "olumlu" : "notr"}>{l.aktif ? "Aktif" : "Boş"}</StatusChip>
        </>
      }
      altBilgi={
        <LinkButton href={`/price-lists/${l.id}`} ikon="duzenle">
          Satırları düzenle
        </LinkButton>
      }
    >
      <Bolum baslik="Özet">
        <dl className="divide-y divide-slate-100">
          <Satir ad="Satır">
            {veri.gecerliSatir} bugün geçerli ({l.urunSayisi} ürün, {l.baremSayisi} barem) / {veri.toplamSatir} toplam
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
        {/* Varsayılan listeyi atanmamış cariler de kullanır; not açık atama olsa da kalır. */}
        {l.varsayilan && <p className="mb-1 text-sm text-slate-500">Atanmamış bütün cariler bu listeyi kullanır.</p>}
        {veri.cariler.length === 0 ? (
          !l.varsayilan && <p className="text-sm text-slate-400">Bu listeye atanmış cari yok.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {veri.cariler.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 py-1.5 text-sm">
                <Link href={`/doctors?detay=${c.id}`} className={BAGLANTI}>
                  {c.fullName}
                </Link>
                {c.pasif && <StatusChip ton="notr">Pasif</StatusChip>}
              </li>
            ))}
            {kalan > 0 && <li className="py-1.5 text-sm text-slate-500">ve {kalan} cari daha</li>}
          </ul>
        )}
      </Bolum>
    </Panel>
  );
}
