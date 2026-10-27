import Link from "next/link";

import { Ikon } from "@/components/Ikon";
import { StokMiktari } from "@/components/StokMiktari";
import { buton } from "@/components/stil";
import { formatSayi } from "@/lib/format";
import { stokDurumu } from "@/lib/stok-durumu";

/** Listede en çok bu kadar ürün; fazlası stok ekranındadır. */
const EN_COK = 5;

/**
 * Kritik stok (brief §3.5): tükenen ve kritik ürünler, en düşük stok önce. Hızlı işlem yalnız mevcut
 * akışa bağlantıdır: stok giriş ekranı, ürün önseçili (`/stock?urun=`). Tedarikçiye sipariş akışı
 * olmadığından "Sipariş Ver" yoktur (K-D5).
 */
export function KritikStokListesi({ stoklar }: { stoklar: readonly { id: string; name: string; code: string; stok: number }[] }) {
  const kritik = stoklar.filter((u) => stokDurumu(u.stok) !== null).sort((a, b) => a.stok - b.stok);
  if (kritik.length === 0) return <p className="text-sm text-slate-500">Kritik stokta ürün yok.</p>;
  const kalan = kritik.length - EN_COK;
  return (
    <>
      <ul className="divide-y divide-slate-100">
        {kritik.slice(0, EN_COK).map((u) => (
          <li key={u.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 first:pt-0 last:pb-0">
            <span className="min-w-0 flex-1 truncate text-sm text-slate-900" title={`${u.name} (${u.code})`}>
              {u.name}
            </span>
            <StokMiktari miktar={u.stok} />
            <Link href={`/stock?urun=${u.id}`} className={buton("ikincil")}>
              <Ikon ad="stokGirisi" />
              Stok girişi
            </Link>
          </li>
        ))}
      </ul>
      {kalan > 0 && (
        <Link href="/stock" className={`mt-3 ${buton("metin")}`}>
          +{formatSayi(kalan)} ürün daha
          <Ikon ad="ileri" />
        </Link>
      )}
    </>
  );
}
