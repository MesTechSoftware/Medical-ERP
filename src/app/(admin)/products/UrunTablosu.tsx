import Link from "next/link";
import { Card, LinkButton, StatusBadge } from "@/components/ui";
import { Ikon } from "@/components/Ikon";
import { BosDurum } from "@/components/liste/BosDurum";
import { StokMiktari } from "@/components/StokMiktari";
import { BAGLANTI, buton } from "@/components/stil";
import { Tutar } from "@/components/Tutar";
import { formatla } from "@/lib/money";
import { BRUT, MATRAH, tabanli } from "@/lib/taban";
import type { UrunSatiri } from "@/lib/urun-listesi/sorgu";
import { SUTUNLAR, type UrunSutunu } from "@/lib/urun-listesi/sutunlar";
import { bosDurum, urunAdresi, type BosDurum as BosTur, type UrunSuzgeci } from "@/lib/urun-listesi/suzgec";

/** Sütun başlıkları; liste fiyatının tabanı başlıktadır (`tabanli` — Ü-3-1). */
const BASLIK: Record<UrunSutunu, { metin: string; sinif?: string }> = {
  kod: { metin: "Kod", sinif: "oncelik-dusuk" },
  fiyat: { metin: tabanli("Liste Fiyatı", MATRAH), sinif: "sayi" },
  fiyatKdvDahil: { metin: tabanli("Liste Fiyatı", BRUT), sinif: "sayi" },
  kdv: { metin: "KDV", sinif: "sayi oncelik-dusuk" },
  stok: { metin: "Stok", sinif: "sayi" },
  durum: { metin: "Durum" },
};

/** Boş liste metinleri (spec Ü-19 §3.5). */
const BOS: Record<BosTur, { ikon: "yeni" | "onayla" | "filtrele"; baslik: string }> = {
  "hic-kayit": { ikon: "yeni", baslik: "Henüz ürün yok." },
  kritik: { ikon: "onayla", baslik: "Kritik stokta ürün yok." },
  tukendi: { ikon: "onayla", baslik: "Tükenen ürün yok." },
  suzgecli: { ikon: "filtrele", baslik: "Bu süzgeçlere uyan ürün bulunamadı." },
};

/**
 * Ürün listesinin tablosu (spec Ü-19 §3.3). Gizli sütunun başlığı ve hücresi çizilmez. Ad yan
 * paneli açar; Düzenle (ve silme) yalnız YONETICI (D-2 17.10 eki).
 */
export function UrunTablosu({
  satirlar,
  gizli,
  yonetici,
  suzgec,
  yer,
}: {
  satirlar: UrunSatiri[];
  gizli: ReadonlySet<UrunSutunu>;
  yonetici: boolean;
  suzgec: UrunSuzgeci;
  /** Listenin sayfası; panel bağlantısı korur. */
  yer: { page?: number; per?: number };
}) {
  const gorunur = SUTUNLAR.filter((s) => !gizli.has(s.anahtar)).map((s) => s.anahtar);
  const acik = (k: UrunSutunu) => !gizli.has(k);

  return (
    <Card>
      <div className="tablo-kutusu">
        <table className="veri-tablosu">
          <thead>
            <tr>
              <th>Ürün</th>
              {gorunur.map((k) => (
                <th key={k} className={BASLIK[k].sinif}>
                  {BASLIK[k].metin}
                </th>
              ))}
              <th className="sayi">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {satirlar.length === 0 && <BosHucre tur={bosDurum(suzgec)} colSpan={2 + gorunur.length} yeniUrun={yonetici} />}
            {satirlar.map((p) => (
              <tr key={p.id}>
                <td className="font-medium text-slate-900">
                  {/* Ad yan paneli açar (spec §3.6); kapanınca odak `data-kayit` ile buraya döner. */}
                  <Link
                    href={urunAdresi(suzgec, { ...yer, detay: p.id })}
                    scroll={false}
                    data-kayit={p.id}
                    className={`inline-flex items-center gap-0.5 ${BAGLANTI}`}
                  >
                    <span>{p.name}</span>
                    <Ikon ad="sonraki" />
                  </Link>
                </td>
                {acik("kod") && <td className="text-slate-500 oncelik-dusuk">{p.code}</td>}
                {acik("fiyat") && (
                  <td className="sayi">
                    <Tutar deger={p.fiyat} taban={MATRAH} baslikta />
                  </td>
                )}
                {acik("fiyatKdvDahil") && (
                  <td className="sayi">
                    <Tutar deger={p.fiyatKdvDahil} taban={BRUT} baslikta />
                  </td>
                )}
                {acik("kdv") && <td className="sayi text-slate-500 oncelik-dusuk">{formatla(p.kdvOrani, "oran")}</td>}
                {acik("stok") && (
                  <td className="sayi">
                    <StokMiktari miktar={p.stok} />
                  </td>
                )}
                {acik("durum") && (
                  <td>
                    <StatusBadge status={p.status} />
                  </td>
                )}
                <td className="sayi">
                  {yonetici && (
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/products/${p.id}/edit`} className={buton("metin")}>
                        <Ikon ad="duzenle" />
                        Düzenle
                      </Link>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function BosHucre({ tur, colSpan, yeniUrun }: { tur: BosTur; colSpan: number; yeniUrun: boolean }) {
  return (
    <BosDurum
      colSpan={colSpan}
      {...BOS[tur]}
      temizleAdresi={tur === "suzgecli" ? "/products" : undefined}
      eylem={
        tur === "hic-kayit" && yeniUrun ? (
          <LinkButton href="/products/new" ikon="yeni">
            Yeni Ürün
          </LinkButton>
        ) : undefined
      }
    />
  );
}
