"use client";

/**
 * Bu sekmede gezinen düz bağlantı tıklaması mı? `href`'i olan, hedefi bu pencere olan, indirme olmayan
 * bağlantı; değiştirici tuşlu tıklama sayfayı yerinde bırakır. `defaultPrevented` bakılmaz: Next `Link`
 * istemci gezinmesi için her tıklamada onu çağırır.
 */
export function sekmeIciBaglantiTiklamasi(e: React.MouseEvent): boolean {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  const a = e.target instanceof Element ? e.target.closest("a") : null;
  return a !== null && a.hasAttribute("href") && (a.target === "" || a.target === "_self") && !a.hasAttribute("download");
}

/**
 * Liste ekranlarının açılır paneli (Filtrele, Sütunlar): içindeki form gönderilince ya da bir bağlantıya
 * tıklanınca kapanır. İstemci gezinmesinde sayfa yeniden kurulmaz; aynı adrese varan bir eylemden
 * (değişmemiş süzgeçle Uygula, süzgeçsizken Temizle) sonra panel açık kalırdı. Dışarıdan gelen süzgeç
 * değişikliğinde (sekme, etiket, geri) çağıran yer paneli uygulanan süzgecin adresiyle anahtarlar.
 */
export function AcilirPanel(ozellikler: Omit<React.ComponentProps<"details">, "onSubmit" | "onClick">) {
  return (
    <details
      {...ozellikler}
      onSubmit={(e) => (e.currentTarget.open = false)}
      onClick={(e) => {
        if (sekmeIciBaglantiTiklamasi(e)) e.currentTarget.open = false;
      }}
    />
  );
}
