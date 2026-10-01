import { describe, expect, it } from "vitest";

import {
  girisLogSatiri,
  hataKaydet,
  kilitDurumu,
  sifirla,
  temizle,
  type SayacAyari,
  type SayacDeposu,
} from "@/lib/rate-limit";
import { policy } from "@/lib/policy";

// ADR-004: sayaç saf fonksiyonlarla, SAHTE SAATLE sınanır. Eşikler testte
// sabit verilir; policy değerleri ayrıca eski koddakiyle karşılaştırılır.
const AYAR: SayacAyari = { esik: 5, kilitMs: 10 * 60_000 };
const T0 = new Date("2026-10-01T09:00:00.000Z");
const dk = (n: number) => new Date(T0.getTime() + n * 60_000);
const EMAIL = "ahmet@medikal.local";

function yeniDepo(): SayacDeposu {
  return new Map();
}

describe("giriş sayacı — eşik ve kilit (ADR-004, X-9)", () => {
  it("policy eşikleri eski LoginAttempt koduyla aynıdır: 5 deneme, 10 dakika", () => {
    expect(policy.auth.girisDenemeSiniri).toBe(5);
    expect(policy.auth.girisKilitDakika).toBe(10);
  });

  it("eşiğin altında kilit yok", () => {
    const depo = yeniDepo();
    for (let i = 0; i < 4; i++) {
      expect(hataKaydet(depo, EMAIL, T0, AYAR).locked).toBe(false);
    }
    expect(kilitDurumu(depo, EMAIL, T0, AYAR).locked).toBe(false);
  });

  it("5. başarısız denemede 10 dakika kilitlenir", () => {
    const depo = yeniDepo();
    for (let i = 0; i < 4; i++) hataKaydet(depo, EMAIL, T0, AYAR);

    expect(hataKaydet(depo, EMAIL, T0, AYAR)).toEqual({ locked: true, retryAfterMinutes: 10 });
    expect(kilitDurumu(depo, EMAIL, dk(3), AYAR)).toEqual({ locked: true, retryAfterMinutes: 7 });
  });

  it("kalan süre dakikaya yukarı yuvarlanır", () => {
    const depo = yeniDepo();
    for (let i = 0; i < 5; i++) hataKaydet(depo, EMAIL, T0, AYAR);

    const t = new Date(T0.getTime() + 9 * 60_000 + 1_000); // 50 sn kaldı
    expect(kilitDurumu(depo, EMAIL, t, AYAR)).toEqual({ locked: true, retryAfterMinutes: 1 });
  });

  it("kilit süresi dolunca açılır ve sayaç sıfırdan başlar", () => {
    const depo = yeniDepo();
    for (let i = 0; i < 5; i++) hataKaydet(depo, EMAIL, T0, AYAR);

    expect(kilitDurumu(depo, EMAIL, dk(10), AYAR).locked).toBe(false);
    // Yeni tur: tek hata kilitlemez.
    expect(hataKaydet(depo, EMAIL, dk(10), AYAR).locked).toBe(false);
  });

  it("başarılı giriş sayacı sıfırlar", () => {
    const depo = yeniDepo();
    for (let i = 0; i < 4; i++) hataKaydet(depo, EMAIL, T0, AYAR);
    sifirla(depo, EMAIL);

    expect(hataKaydet(depo, EMAIL, T0, AYAR).locked).toBe(false);
  });

  it("anahtar e-postanın normalize hâlidir (büyük harf, boşluk)", () => {
    const depo = yeniDepo();
    for (let i = 0; i < 4; i++) hataKaydet(depo, EMAIL, T0, AYAR);

    expect(hataKaydet(depo, "  AHMET@Medikal.Local ", T0, AYAR).locked).toBe(true);
    expect(kilitDurumu(depo, EMAIL, T0, AYAR).locked).toBe(true);
  });

  it("bir hesabın kilidi başka hesabı etkilemez", () => {
    const depo = yeniDepo();
    for (let i = 0; i < 5; i++) hataKaydet(depo, EMAIL, T0, AYAR);

    expect(kilitDurumu(depo, "admin@medikal.local", T0, AYAR).locked).toBe(false);
  });
});

describe("giriş sayacı — bellek sınırsız büyümez (ADR-004 madde 4)", () => {
  it("kilidi biten kayıt temizlenir", () => {
    const depo = yeniDepo();
    for (let i = 0; i < 5; i++) hataKaydet(depo, EMAIL, T0, AYAR);

    temizle(depo, dk(10), AYAR);
    expect(depo.size).toBe(0);
  });

  it("kilitsiz kayıt son hatadan bir kilit süresi sonra temizlenir (deneme penceresi)", () => {
    const depo = yeniDepo();
    hataKaydet(depo, EMAIL, T0, AYAR);
    hataKaydet(depo, EMAIL, dk(5), AYAR);

    temizle(depo, dk(14), AYAR);
    expect(depo.size).toBe(1); // son hatadan 9 dk geçti

    temizle(depo, dk(15), AYAR);
    expect(depo.size).toBe(0);
  });

  it("pencere dışındaki eski hatalar birikmez", () => {
    const depo = yeniDepo();
    for (let i = 0; i < 4; i++) hataKaydet(depo, EMAIL, T0, AYAR);

    // 4 hata + pencere geçti → 5. hata kilitlemez.
    expect(hataKaydet(depo, EMAIL, dk(11), AYAR).locked).toBe(false);
  });

  it("okuma anında temizlik yapılır — ayrı zamanlayıcı yok", () => {
    const depo = yeniDepo();
    hataKaydet(depo, "a@medikal.local", T0, AYAR);
    hataKaydet(depo, "b@medikal.local", T0, AYAR);

    kilitDurumu(depo, "c@medikal.local", dk(10), AYAR);
    expect(depo.size).toBe(0);
  });
});

describe("deneme logu (E-2 §(8), X-3)", () => {
  it("zaman, kullanıcı kimliği ve sonucu yazar; e-posta yazmaz", () => {
    const satir = girisLogSatiri(T0, "user-1", "hatali_kimlik");

    expect(JSON.parse(satir)).toEqual({
      olay: "giris_denemesi",
      zaman: "2026-10-01T09:00:00.000Z",
      kullaniciId: "user-1",
      sonuc: "hatali_kimlik",
    });
    expect(satir).not.toContain("@");
  });

  it("var olmayan hesapta kimlik null'dır", () => {
    expect(JSON.parse(girisLogSatiri(T0, null, "hatali_kimlik")).kullaniciId).toBeNull();
  });
});
