import Link from "next/link";
import type { OrderStatus } from "@/generated/prisma/enums";
import { KpiCard } from "@/components/kpi/KpiCard";
import { KpiSatiri } from "@/components/kpi/KpiSatiri";
import type { KpiSonucu } from "@/lib/kpi/getir";
import { aralikEtiketi } from "@/lib/liste/parametreler";
import type { SiparisKpileri } from "@/lib/siparis-listesi/sorgu";
import { kartAdresi, type kpiAraligi } from "@/lib/siparis-listesi/suzgec";

const KART = "block h-full rounded-xl transition hover:opacity-90";

type Aralik = ReturnType<typeof kpiAraligi>;

/** Kartların alt notu: varsayılan aralık "Bu ay", yoksa süzgecin gün aralığı. */
export function kpiDonemNotu(a: Aralik): string {
  return a.varsayilan ? "Bu ay" : aralikEtiketi(a.baslangic, a.bitis);
}

/** Durum kartları, sekmelerle aynı sıra ve metin. */
export const DURUM_KARTLARI: readonly { durum: OrderStatus; etiket: string }[] = [
  { durum: "BEKLIYOR", etiket: "Bekliyor" },
  { durum: "HAZIRLANIYOR", etiket: "Hazırlanıyor" },
  { durum: "KARGOLANDI", etiket: "Kargolandı" },
  { durum: "TESLIM_EDILDI", etiket: "Teslim Edildi" },
  { durum: "IPTAL", etiket: "İptal" },
];

/**
 * Siparişler ekranının üst kartları (spec Ü-23 §3.2; 6 kart ADR-010 eki): aralıkta açılan onaylı
 * siparişler, teklif hariç (A-5-8). Metin, satıcı ve durum süzgecinden bağımsızdır. Durum kartı saydığı
 * aralığı adrese yazar; açtığı listenin satır sayısı kartla aynıdır. Toplam bağlantı değildir (Tümü
 * teklifi de listeler).
 */
export function KpiKartlari({ sonuc, aralik }: { sonuc: KpiSonucu<SiparisKpileri>; aralik: Aralik }) {
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
        {DURUM_KARTLARI.map(({ durum, etiket }) => (
          <Link key={durum} href={kartAdresi(durum, aralik)} className={KART}>
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
