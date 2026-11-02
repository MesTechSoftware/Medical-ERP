/**
 * Adresteki yalnız verilen alanların ham sorgusu (normalize edilmez); verilen sırayla, yok ile boş
 * (`ad=`) ayrı. Süzgeç formu bununla anahtarlanır (`SuzgecFormu`). Saf modül, istemcide de çalışır.
 */
export function alanSorgusu(sp: URLSearchParams, adlar: readonly string[]): string {
  const q = new URLSearchParams();
  for (const ad of adlar) for (const deger of sp.getAll(ad)) q.append(ad, deger);
  return q.toString();
}
