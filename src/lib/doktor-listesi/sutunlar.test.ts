import { describe, expect, it } from "vitest";

import { SUTUNLAR } from "@/lib/doktor-listesi/sutunlar";
import * as ortak from "@/lib/liste/sutunlar";

const gizliSutunlariCoz = (deger: string | undefined) => ortak.gizliSutunlariCoz(SUTUNLAR, deger);
const gizliSutunCerezi = (gizli: Iterable<string>) => ortak.gizliSutunCerezi(SUTUNLAR, gizli);
const guvenliDonus = (donus: string) => ortak.guvenliDonus("/doctors", donus);

// Cari listesinin sütun seçicisi — spec Ü-18 §3.4 (çerez biçimi).

describe("gizliSutunlariCoz", () => {
  it("çerez yoksa ya da boşsa hiçbir sütun gizli değildir", () => {
    expect(gizliSutunlariCoz(undefined).size).toBe(0);
    expect(gizliSutunlariCoz("").size).toBe(0);
  });

  it("virgüllü anahtarları okur", () => {
    expect([...gizliSutunlariCoz("telefon,bakiye")]).toEqual(["telefon", "bakiye"]);
  });

  it("bilinmeyen ve gizlenemez anahtarları atar", () => {
    expect([...gizliSutunlariCoz("telefon,adSoyad,<script>,%%%")]).toEqual(["telefon"]);
  });
});

describe("gizliSutunCerezi", () => {
  it("bilinmeyeni atar, tablo sırasıyla yazar", () => {
    expect(gizliSutunCerezi(["bakiye", "telefon", "yok"])).toBe("telefon,bakiye");
  });

  it("gidiş-dönüş aynı kümeyi verir", () => {
    const hepsi = SUTUNLAR.map((s) => s.anahtar);
    expect([...gizliSutunlariCoz(gizliSutunCerezi(hepsi))]).toEqual(hepsi);
  });
});

describe("SUTUNLAR", () => {
  it("Ad Soyad gizlenebilir sütunlar arasında değildir; sıra tablo sırasıdır", () => {
    expect(SUTUNLAR.map((s) => s.baslik)).toEqual([
      "Klinik / Bölge",
      "Telefon",
      "Sorumlu Satıcı",
      "Sipariş",
      "Son Sipariş",
      "Bakiye",
      "Durum",
    ]);
  });
});

describe("guvenliDonus — kaydettikten sonra yalnız cari listesine dönülür", () => {
  it("liste adresini aynen döner", () => {
    expect(guvenliDonus("/doctors")).toBe("/doctors");
    expect(guvenliDonus("/doctors?bolge=Ege&page=2")).toBe("/doctors?bolge=Ege&page=2");
  });

  it("başka adres listeye düşer", () => {
    for (const kotu of ["", "https://kotu.example", "//kotu.example", "/doctors.kotu", "/doctorsx", "/users", "/doctors/abc/edit"]) {
      expect(guvenliDonus(kotu)).toBe("/doctors");
    }
  });
});
