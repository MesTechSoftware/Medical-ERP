import { prisma } from "@/lib/db";
import { cubukOranlari } from "@/lib/kpi/olcek";
import { getDoctorReports, type Donem, type DoctorReport, type KpiKapsami } from "@/lib/reports-service";
import { SAHIPSIZ, type RaporSuzgeci } from "@/lib/rapor-listesi/suzgec";

/**
 * Raporlar'ın doktor ciro sıralaması (spec Ü-27 §4, X-1-2). Servis dönemin bütün carilerini hesaplar;
 * cirosu sıfır olan düşer, sıra ve lidere oran bu tam dönem listesinden çıkar, süzgeç ve sayfa sonra uygulanır —
 * süzülmüş listede de carinin kapsam içindeki yeri okunur (Raporlar'da şirket, Raporum'da satıcının kendi listesi).
 */
export type SiraSatiri = DoctorReport & { sira: number; oran: number | null };

/**
 * Türkçe büyük/küçük harf ve I/ı katlaması: `tr` yereliyle küçültülür, ı ile i birleştirilir — ASCII "ISMAIL" de
 * "ismail" aramasında bulunur (öbür ekranların `metinVaryantlari` genişliğiyle aynı).
 */
const kucuk = (m: string) => m.toLocaleLowerCase("tr").replace(/ı/g, "i");

/**
 * Doktor ciro sıralaması. `kapsam` zorunludur: Raporlar şirket geneli, Raporum (Ü-33) satıcının kendi cirosu
 * (`getDoctorReports`'un kapsamı). Sıra ve lidere oran kapsamın içindeki dönem sırasıdır.
 */
export async function doktorSiralamasi(
  aralik: Donem,
  s: RaporSuzgeci,
  sayfa: { skip: number; take: number },
  kapsam: KpiKapsami
): Promise<{ satirlar: SiraSatiri[]; toplam: number }> {
  const cirolu = (await getDoctorReports(aralik, Number.POSITIVE_INFINITY, kapsam)).filter((d) => !d.ciro.isZero());
  const oranlar = cubukOranlari(cirolu.map((d) => d.ciro));
  const q = s.q ? kucuk(s.q) : null;
  const suzulmus = cirolu
    .map((d, i) => ({ ...d, sira: i + 1, oran: oranlar[i] }))
    .filter((d) => (s.satici === SAHIPSIZ ? d.sellerId === null : s.satici ? d.sellerId === s.satici : true))
    .filter((d) => (q ? kucuk(d.fullName).includes(q) : true));
  return { satirlar: suzulmus.slice(sayfa.skip, sayfa.skip + sayfa.take), toplam: suzulmus.length };
}

/**
 * Filtrele panelinin satıcı seçenekleri: SATICI rolündekiler ve rolü değişse de carisi olanlar (sahip sütununda
 * adı görünen herkes süzülebilsin), ada göre, pasif işaretli.
 */
export async function saticiSecenekleri(): Promise<{ id: string; name: string; isActive: boolean }[]> {
  return prisma.user.findMany({
    where: { OR: [{ role: "SATICI" }, { ownedDoctors: { some: {} } }] },
    orderBy: { name: "asc" },
    select: { id: true, name: true, isActive: true },
  });
}
