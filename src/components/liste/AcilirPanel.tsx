"use client";

/**
 * Bu sekmede gezinen düz bağlantı tıklaması mı? Değiştirici tuşlu tıklama, `target="_blank"` ve `download`
 * bağlantısı sayfayı yerinde bırakır. `defaultPrevented` bakılmaz: Next `Link` istemci gezinmesi için
 * her tıklamada onu çağırır.
 */
export function sekmeIciBaglantiTiklamasi(e: React.MouseEvent): boolean {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  const a = e.target instanceof Element ? e.target.closest("a") : null;
  return a !== null && a.target !== "_blank" && !a.hasAttribute("download");
}

/**
 * Liste ekranlarının açılır paneli (Filtrele, Sütunlar): içindeki form gönderilince ya da bir bağlantıya
 * tıklanınca kapanır. İstemci gezinmesinde sayfa yeniden kurulmaz; aynı adrese varan bir eylemden
 * (değişmemiş süzgeçle Uygula, süzgeçsizken Temizle) sonra panel açık kalırdı.
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
