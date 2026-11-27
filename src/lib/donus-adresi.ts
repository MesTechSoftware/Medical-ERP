/**
 * Durum geçişi action'larının dönüş adresi (A-3-8): kapalı liste — `/orders`, `/orders/<id>`, `/shipping` ve
 * bunların sorgu dizgisi. Çift eğik çizgi, ters eğik çizgi, şema ya da başka yol varsayılana düşer
 * (açık yönlendirme yok).
 */
export function donusAdresi(ham: string | null | undefined, id: string): string {
  const varsayilan = `/orders/${id}`;
  if (typeof ham !== "string" || ham.length === 0 || ham.length > 500) return varsayilan;
  if (!/^\/[A-Za-z0-9\-_/?=&%.,:+#]*$/.test(ham)) return varsayilan;
  const yol = ham.split(/[?#]/)[0];
  if (yol === "/orders" || yol === "/shipping" || yol === `/orders/${id}`) return ham;
  return varsayilan;
}
