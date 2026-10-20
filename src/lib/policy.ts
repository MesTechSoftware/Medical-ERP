import type { FaturaSablonu } from "@/lib/disa-aktarim";

/**
 * Sistem politikası — kurulum düzeyi config noktaları. TEK KAYNAK.
 *
 * "Belirlenir, açılmaz" (GÇ-11, §0.1.1): kullanıcıya ayar ekranı YOKTUR;
 * değer değişikliği kod değişikliğidir ve CI'dan geçer. Eski `settings.ts` +
 * `SystemSetting` tablosu C7'de söküldü (tablo CM'de şemadan çıkar).
 *
 * Anahtar adları normatiftir (ADR-001: Türkçe, ASCII, noktalı camelCase);
 * liste `FAZ1_UYGULAMA_KAPSAMI.md` §B.7'dir (23 anahtar). Değeri henüz belli
 * olmayanlar `null` — doldurulacağı an yanlarında yazılı.
 */
export const policy = {
  finance: {
    /** #1 — Yeni siparişlerde varsayılan vade (gün). Bugünkü kod değeri; devreye almada yazılı teyit (A-7). */
    odemeVadesiGunVarsayilan: 30,
    /** #2 — Vade farkı otomatik hesaplanmaz (A-7). */
    vadeFarkiOrani: null,
    /** #3 — 1B'de dolar (A-7). */
    vadeFarkiGunSayimBazi: null,
    /** #4 — Kredi limiti aşımı bloklamaz (A-12). */
    kredilimitiBloklar: false,
    /** #5 — Fatura bilgisi zorunlu değil (A-13). */
    faturaBilgisiZorunlu: false,
    /** #6 — TL, brüt (ör. "30000"); `null` = kapalı. Devreye almada müşavir teyidiyle dolar (A-15 §(3)). */
    nakitTevsikLimiti: null as string | null,
    /** #23 — Varsayılan prim oranı (%). Bugünkü değer; devreye almada yazılı teyit (X-14 §(1)). */
    primOraniVarsayilan: 5,
  },
  pricing: {
    /** #7 — İskonto tavanı yok (A-10). */
    iskontoTavani: null,
    /** #8 — Fiyat girişi KDV hariç; AÇILMAZ (Ü-3 §(3)). */
    fiyatGirisiKdvDahil: false,
    /** #9 — Seed'in açtığı listenin kodu (X-10). `CM`'de doldu: `cozumleBirimFiyat()` ilk sürümü okur. */
    varsayilanFiyatListesiKodu: "VARSAYILAN",
  },
  tax: {
    /** #10 — (C-6) */
    varsayilanVergiOraniKodu: "KDV20",
  },
  kvkk: {
    /** #11 — (C-3) */
    saklamaSuresiYil: 10,
  },
  export: {
    /**
     * #12 — Fatura hazırlık sütun eşlemesi (K-4 §(6)-b): entegratörün toplu yükleme şablonundaki
     * sütun başlıkları ve sırası. Kodda "standart" şablon yazılmaz; devreye almada dolar.
     * `null` iken fatura hazırlık dosyası verilmez.
     */
    sablonTanimi: null as FaturaSablonu | null,
    /** #13 — (K-4 §6-d) */
    faturaGeriyeDonukUyariGun: 7,
  },
  belge: {
    /** #14 — Belge numarası önekleri (A-14, B-7; §B.4). */
    onekleri: ["SIP", "SVK", "IAD", "KNS", "TRF", "THS", "ACL", "VDF", "DZL"],
  },
  notifications: {
    /** #15 — (D-1) */
    enabled: false,
  },
  modules: {
    /** #16 — Kongre modülü kapalı teslim (K-6). */
    congress: false,
  },
  zaman: {
    /** #17 — Dilim adı, ofset değil (E-1). */
    saatDilimi: "Europe/Istanbul",
  },
  auth: {
    /** #18 — Kayar (E-2). */
    oturumHareketsizlikSaat: 4,
    /** #19 — Kaymaz (E-2). */
    oturumMutlakSaat: 12,
    /** #20 — Art arda başarısız deneme eşiği. Eski `LoginAttempt` kodundan (X-9, ADR-004). */
    girisDenemeSiniri: 5,
    /** #21 — Eşik aşılınca kilit süresi (dakika). Eski `LoginAttempt` kodundan (X-9, ADR-004). */
    girisKilitDakika: 10,
  },
  import: {
    /** #22 — Kesin değer devreye almada; 1B madde 7 (D-6) öncesi dolar (E-3). */
    azamiDosyaBoyutMb: null,
  },
} as const;
