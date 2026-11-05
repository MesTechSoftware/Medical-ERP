import Link from "next/link";
import type { OrderStatus } from "@/generated/prisma/enums";
import { KpiCard } from "@/components/kpi/KpiCard";
import { KpiSatiri } from "@/components/kpi/KpiSatiri";
import type { KpiSonucu } from "@/lib/kpi/getir";
import { aralikEtiketi } from "@/lib/liste/parametreler";
import type { SiparisKpileri } from "@/lib/siparis-listesi/sorgu";
import { DURUMLAR, kartAdresi, type kpiAraligi, type SiparisYolu } from "@/lib/siparis-listesi/suzgec";

const KART = "block h-full rounded-xl transition hover:opacity-90";

type Aralik = ReturnType<typeof kpiAraligi>;

/** Kartların alt notu: varsayılan aralık "Bu ay", yoksa süzgecin gün aralığı. */
export function kpiDonemNotu(a: Aralik): string {
  return a.varsayilan ? "Bu ay" : aralikEtiketi(a.baslangic, a.bitis);
}

/** Durum kartları: sekmelerle aynı sıra ve metin (tek kaynak `DURUMLAR`), teklif hariç (A-5-8). */
export const DURUM_KARTLARI: readonly { durum: OrderStatus; etiket: string }[] = DURUMLAR.flatMap((d) =>
  d.kod === "TEKLIF" ? [] : [{ durum: d.kod, etiket: d.etiket }]
);

/**
 * Siparişlerim'in durum kartları (Ü-31): ekran başına 4 kart sınırı (ADR-010 madde 2) yüzünden Toplam'ın
 * yanında üç durum — satıcının "siparişim nerede?" sorusu: bekliyor, yolda, teslim edildi. Hazırlanıyor ve
 * İptal sekmededir; Toplam onları da sayar.
 */
const SATICI_DURUMLARI: readonly OrderStatus[] = ["BEKLIYOR", "KARGOLANDI", "TESLIM_EDILDI"];
export const SATICI_DURUM_KARTLARI = DURUM_KARTLARI.filter((d) => SATICI_DURUMLARI.includes(d.durum));

/** Ekranın kart seti yolundan türer: yol ile kart sayısı ayrı ayrı seçilemez (ADR-010; iskelet de bunu okur). */
export function ekranKartlari(yol: SiparisYolu): typeof DURUM_KARTLARI {
  return yol === "/orders" ? DURUM_KARTLARI : SATICI_DURUM_KARTLARI;
}

/**
 * Sipariş listesinin üst kartları (spec Ü-23 §3.2; 6 kart ADR-010 eki): aralıkta açılan onaylı
 * siparişler, teklif hariç (A-5-8). Metin, satıcı ve durum süzgecinden bağımsızdır. Durum kartı saydığı
 * aralığı adrese yazar; açtığı listenin satır sayısı kartla aynıdır. Toplam bağlantı değildir (Tümü
 * teklifi de listeler). Siparişlerim (Ü-31) aynı kartın satıcı kapsamlı sayısını `ekranKartlari`'nın
 * verdiği dört kartla çizer.
 */
export function KpiKartlari({ sonuc, aralik, yol = "/orders" }: { sonuc: KpiSonucu<SiparisKpileri>; aralik: Aralik; yol?: SiparisYolu }) {
  const kartlar = ekranKartlari(yol);
  const k = sonuc.tamam ? sonuc.deger : null;
  const hataReferansi = sonuc.tamam ? undefined : sonuc.referans;
  const donemNotu = kpiDonemNotu(aralik);
  return (
    <section aria-label="Sipariş sayıları">
      <KpiSatiri>
        <KpiCard
          etiket="Toplam sipariş"
          varyant="birincil"
          iyiYon="notr"
          bosDavranisi="sifir"
          adet={k ? k.toplam : null}
          donemNotu={`${donemNotu} · teklif hariç`}
          hataReferansi={hataReferansi}
        />
        {kartlar.map(({ durum, etiket }) => (
          <Link key={durum} href={kartAdresi(durum, aralik, yol)} className={KART}>
            <KpiCard
              etiket={etiket}
              varyant="ikincil"
              iyiYon="notr"
              bosDavranisi="sifir"
              adet={k ? k[durum] : null}
              donemNotu={donemNotu}
              hataReferansi={hataReferansi}
            />
          </Link>
        ))}
      </KpiSatiri>
    </section>
  );
}
