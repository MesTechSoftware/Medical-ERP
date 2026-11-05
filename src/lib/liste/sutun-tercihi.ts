import { cookies } from "next/headers";
import { gizliSutunlariCoz } from "@/lib/liste/sutunlar";
import { SUTUN_LISTELERI, type SutunAnahtari, type SutunListesi, type SutunluListe } from "@/lib/liste/sutun-listeleri";

/** Ekranın gizli sütunları (sunucuda, istek çerezinden): çerez yoksa tanımdaki varsayılan gizliler. */
export async function gizliSutunlar<L extends SutunluListe>(liste: L): Promise<ReadonlySet<SutunAnahtari<L>>> {
  const kayit: SutunListesi = SUTUN_LISTELERI[liste];
  return gizliSutunlariCoz(kayit.sutunlar, (await cookies()).get(kayit.cerez)?.value) as ReadonlySet<SutunAnahtari<L>>;
}
