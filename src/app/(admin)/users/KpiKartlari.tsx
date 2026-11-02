import Link from "next/link";
import { KpiCard } from "@/components/kpi/KpiCard";
import { KpiSatiri } from "@/components/kpi/KpiSatiri";
import type { KullaniciKpileri } from "@/lib/kullanici-listesi/sorgu";
import { BOS_SUZGEC, kullaniciAdresi, type GorenRol } from "@/lib/kullanici-listesi/suzgec";

const KART = "block h-full rounded-xl transition hover:opacity-90";
const ANLIK = { anlik: "şu an" } as const;

/**
 * Kullanıcılar ekranının üst kartları (spec Ü-22 §3.2): anlık sayılar, süzgeçten bağımsız, kapsama bağlı.
 * Her kart kendi süzgecini açar; kart sayısı satır sayısıdır. OPERASYON yalnız satıcıları gördüğünden
 * "Aktif kullanıcı" kartı ona çizilmez (aynı sayıyı tekrar ederdi).
 */
export function KpiKartlari({ sayilar, gorenRol }: { sayilar: KullaniciKpileri; gorenRol: GorenRol }) {
  return (
    <section aria-label="Kullanıcı sayıları">
      <KpiSatiri>
        {gorenRol === "YONETICI" && (
          <Link href={kullaniciAdresi({ ...BOS_SUZGEC, durum: "aktif" })} className={KART}>
            <KpiCard etiket="Aktif kullanıcı" varyant="birincil" iyiYon="notr" bosDavranisi="sifir" adet={sayilar.aktifKullanici} karsilastirma={ANLIK} />
          </Link>
        )}
        <Link href={kullaniciAdresi({ ...BOS_SUZGEC, durum: "aktif", rol: "SATICI" })} className={KART}>
          <KpiCard
            etiket="Aktif satıcı"
            varyant={gorenRol === "YONETICI" ? "ikincil" : "birincil"}
            iyiYon="notr"
            bosDavranisi="sifir"
            adet={sayilar.aktifSatici}
            karsilastirma={ANLIK}
          />
        </Link>
        <Link href={kullaniciAdresi({ ...BOS_SUZGEC, portfoy: "yok" })} className={KART}>
          <KpiCard
            etiket="Portföysüz aktif satıcı"
            varyant="ikincil"
            iyiYon="asagi-iyi"
            bosDavranisi="sifir"
            adet={sayilar.portfoysuz}
            karsilastirma={ANLIK}
            vurgu={sayilar.portfoysuz > 0 ? "uyari" : undefined}
          />
        </Link>
        <Link href={kullaniciAdresi({ ...BOS_SUZGEC, durum: "aktif", parola: "gecici" })} className={KART}>
          <KpiCard
            etiket="İlk girişi bekleyen"
            varyant="ikincil"
            iyiYon="asagi-iyi"
            bosDavranisi="sifir"
            adet={sayilar.ilkGirisBekleyen}
            karsilastirma={ANLIK}
            ikincilMetrik="geçici parolası duran"
          />
        </Link>
      </KpiSatiri>
    </section>
  );
}
