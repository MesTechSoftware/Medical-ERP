# Kullanıcılar ekranı — KPI, süzgeç, sütun seçici, yan panel (tasarım spec'i)

> **Tarih:** 02.11.2026 · **Kaynak:** kullanıcı talebi (sohbet, 28.10.2026: "Kapsamlı sayfa modernizasyonu"
> isterinin §2-D maddesi; altı modülün dördüncüsü) · **Yol haritası:** Ü-22 (§7-5 gereği yazılır) ·
> **Durum:** kullanıcı 02.11.2026'da "tüm sayfalar için aynı planı ve tasarımı uygula, önerilenlerinle
> ilerle" dedi — her seçim önerilen seçenektir (§9). 28.10 seçimi: "Sahipsiz portföy" yerine
> "Portföysüz aktif satıcı".
>
> Bu belge **plan**dır, karar üretmez (`YOL_HARITASI.md` §7.1-A). Dayandığı kararlar E-2 (kullanıcı
> yönetimi, 20.10 eki), D-2 (OPERASYON yalnız satıcıları salt okur; rapor ve denetim kaydı görmez),
> X-17 (portföy = carinin sorumlu satıcısı). Yeni karar ya da ADR açılmaz.

## 1. Amaç

`/users` tek bakışta ekibin durumunu göstersin: kaç aktif kullanıcı ve satıcı var, hangi aktif satıcının
portföyü boş, kim ilk girişini (geçici parola) henüz yapmadı, kim en son ne zaman sistemdeydi. Bir
kullanıcının özetine listeden ayrılmadan bakılabilsin. Yeni/düzenle/pasifleştirme akışları değişmez.

**Başarı ölçütü:** yönetici "Portföysüz aktif satıcı" kartıyla portföyü boş satıcıları listeler; panelde
satıcının açılış tarihini, son etkinliğini ve son siparişlerini görür; Sahipsiz cariler bağlantısıyla
devir ekranına geçer.

## 2. Kapsam

### Kapsamda

| # | Kalem | Dayanak |
|---|---|---|
| 1 | KPI: Aktif kullanıcı · Aktif satıcı · Portföysüz aktif satıcı · İlk girişi bekleyen | ADR-010 `KpiCard` · 28.10 seçimi |
| 2 | Hızlı sekmeler: Tümü · Aktif · Pasif · Satıcılar · Portföysüz + etkin süzgeç etiketi | ortak `HizliSekmeler`/`EtkinSuzgecler` |
| 3 | Tablo: kullanıcı (+ "Geçici parola" çipi), rol, iletişim, portföy, son etkinlik, durum, işlem | E-2 |
| 4 | Sütun seçici, sayfalama (sayfa dışı adres son sayfaya), boş durum | ortak bileşenler |
| 5 | Yan panel: özet, oturumlar, satıcıysa portföy ve son siparişler; yöneticiye son işlemleri | `YanPanel` · D-2 |

### Kapsam dışı

- Kullanıcı formları (yeni, düzenle, geçici parola, pasifleştirme, portföy devri) — bugünkü gibi.
- Satıcı detay sayfası (`/users/[id]`) — değişmez; panel "Tam detay" ile ona gider.
- Oturum sonlandırma düğmesi — E-2'de ekran yok (pasifleştirme ve parola sıfırlama kapatır).
- Satıcı cirosu/hakediş — Raporlar'dadır; OPERASYON rapor görmez (D-2).

## 3. Ekran

### 3.1 Görünürlük (D-2)

`requireStaff`. **YONETICI** bütün kullanıcıları, **OPERASYON** yalnız satıcıları görür. KPI, sekmeler
ve tablo aynı kapsam koşulundan sayılır (`kapsamKosulu(rol)`): OPERASYON'a "Aktif kullanıcı" kartı
"Aktif satıcı" ile aynı sayıyı verir, bu yüzden OPERASYON'da o kart ve "Satıcılar" sekmesi çizilmez.
Prim oranı ve "Son işlemler" (denetim kaydı) yalnız yöneticiye.

### 3.2 KPI kartları

`karsilastirma: { anlik: "şu an" }`, trend yok, `bosDavranisi: "sifir"`; süzgeçten bağımsız.

| Kart | Tanım | Tıklayınca |
|---|---|---|
| Aktif kullanıcı (yalnız YONETICI) | `isActive` | `?durum=aktif` |
| Aktif satıcı | `isActive` ve `role = SATICI` | `?durum=aktif&rol=SATICI` |
| Portföysüz aktif satıcı | aktif satıcılardan sorumlu olduğu **aktif** carisi olmayanlar; > 0 ise uyarı tonu | `?portfoy=yok` |
| İlk girişi bekleyen | `isActive` ve `mustChangePassword` (geçici parolası duran) | `?durum=aktif&parola=gecici` |

Kart sayısı = tıklanınca gelen satır sayısı (aynı `where` üreticisi).

### 3.3 Süzgeç

| Parametre | Değerler | Anlamı |
|---|---|---|
| `durum` | `aktif` · `pasif` | `isActive` |
| `rol` | `YONETICI` · `OPERASYON` · `SATICI` | OPERASYON'da yalnız `SATICI` geçerli (başkası yok sayılır) |
| `portfoy` | `yok` | aktif satıcı ve aktif carisi yok (`durum`/`rol`'ü ezer: kendisi `isActive` + `SATICI`) |
| `parola` | `gecici` | `mustChangePassword` |
| `page`, `per`, `detay` | | ortak adlar |

Sekmeler: Tümü · Aktif (`durum=aktif`) · Pasif (`durum=pasif`) · Satıcılar (`rol=SATICI`, yalnız
YONETICI) · Portföysüz (`portfoy=yok`). Etkin etiketler × ile kaldırılır: "Durum: Aktif", "Rol: Satıcı",
"Portföy: Yok", "Parola: Geçici". Filtrele formu yoktur.

### 3.4 Tablo

| Sütun | İçerik | Gizlenebilir |
|---|---|---|
| Kullanıcı | ad (panel bağlantısı) + `mustChangePassword` ise `StatusChip ton="uyari"` "Geçici parola" | hayır |
| Rol | `ROLE_LABEL` | evet |
| İletişim | e-posta + telefon (küçük) | evet (`oncelik-dusuk`) |
| Portföy | satıcıda aktif cari sayısı (pasif cariler hariç), diğer rollerde "—" | evet |
| Son etkinlik | oturumların en son `lastSeenAt`'i (`formatDateTime`), hiç oturum yoksa "Hiç giriş yapmadı" | evet |
| Durum | `StatusBadge` Aktif/Pasif | evet |
| İşlem | Düzenle (yalnız YONETICI) | hayır |

Sıralama bugünkü gibi `role asc, name asc`. Çerez `kullanici-sutunlar`, `path=/users`; varsayılan gizli
sütun yok. Portföy sayısı bugün **bütün** carileri sayıyor; aktif cariye geçer (portföysüz kartıyla aynı
tanım — X-17 §(4) pasif cari portföyde kalır ama iş yükü değildir).

### 3.5 Yan panel

1. **Özet:** rol, durum, e-posta, telefon, açılış tarihi, (YONETICI) prim oranı — `commissionRate` yoksa
   "varsayılan (%N)" `policy.finance.primOraniVarsayilan`.
2. **Oturum:** son etkinlik, açık oturum sayısı (`revokedAt` boş ve `suresiDolduMu(oturum, şimdi, sureAyari())` yanlış), geçici parola durumu.
3. **Satıcıysa — Portföy:** aktif cari sayısı, ilk 10 cari (bağlantı `/doctors?detay=`); portföy boşsa
   "Portföyünde aktif cari yok." + "Sahipsiz cariler" bağlantısı (`/doctors?satici=yok`).
4. **Satıcıysa — Son siparişler:** son 5 sipariş (belge no bağlantısı `/orders/<id>`, tarih, durum rozeti).
5. **YONETICI — Son işlemler:** kullanıcının son 5 denetim kaydı (zaman, işlem türü, özet;
   `/audit-logs?detay=<id>` bağlantısı).
6. Altta: Düzenle (YONETICI) · Tam detay (satıcı, `/users/<id>`).

## 4. Veri katmanı

- **`src/lib/kullanici-listesi/suzgec.ts`** (saf): `KullaniciSuzgeci = { durum, rol, portfoy, parola }`,
  `suzgecCoz(params, gorenRol)`, `kullaniciAdresi`, `hizliSekmeler(gorenRol)`, `ayniSuzgec`,
  `etkinSuzgecler`, `bosDurum`.
- **`src/lib/kullanici-listesi/sutunlar.ts`** (saf): `SUTUNLAR`, `SUTUN_CEREZI = "kullanici-sutunlar"`.
- **`src/lib/kullanici-listesi/sorgu.ts`:** `kullaniciKosulu(suzgec, gorenRol) → Prisma.UserWhereInput`
  (tek `where`; kapsam + süzgeç; portföysüz: `role SATICI, isActive, ownedDoctors: { none: { status: AKTIF } }`),
  `kullaniciListesi(suzgec, gorenRol, sayfa)` (satır: portföy `doctor.groupBy` aktif cariler; son etkinlik
  `session.groupBy({ by: userId, _max: lastSeenAt })`), `kullaniciKpileri(gorenRol)`,
  `kullaniciPaneli(id, gorenRol)` (kapsam dışı kimlik → `null`; OPERASYON'a yönetici/operasyon kaydı açılmaz).

## 5. Hata davranışı

Geçersiz süzgeç değeri ve OPERASYON'un `rol=YONETICI` gibi kapsam dışı değeri yok sayılır. Kapsam dışı
ya da bulunamayan `detay` paneli açmaz. Sayfa dışı `page` son sayfaya yönlenir.

## 6. Testler

**Kabul kriterleri (testten önce):**

- **X-17-6:** Portföy aktif carilerdir: "Portföysüz aktif satıcı" kartı, aktif satıcılardan sorumlu olduğu
  aktif carisi olmayanların sayısıdır ve `portfoy=yok` süzgecinin satır sayısına eşittir; yalnız pasif
  carisi olan satıcı portföysüzdür.
- **D-2-3:** Kullanıcılar ekranında OPERASYON yalnız satıcıları görür: liste, KPI ve yan panel aynı kapsam
  koşulundandır; OPERASYON'a yönetici/operasyon kaydının paneli açılmaz, prim oranı ve son işlemler
  gösterilmez.

| Katman | Dosya | Neyi doğrular |
|---|---|---|
| Birim | `kullanici-listesi/suzgec.test.ts` | çözme/adres gidiş-dönüş; OPERASYON'da `rol` yalnız SATICI; `portfoy` önceliği; sekmeler role göre; etiketler |
| Entegrasyon | `kullanici-listesi/sorgu.itest.ts` | portföysüz (yalnız pasif carili satıcı dahil, pasif satıcı hariç) = kart = süzgeç; ilk girişi bekleyen; son etkinlik (çok oturum, hiç oturum); OPERASYON kapsamı (liste, KPI, panel `null`); panel açık oturum sayısı, son siparişler, son işlemler yalnız YONETICI |
| E2E | `e2e/admin/kullanicilar.spec.ts` | Portföysüz kartı → satır sayısı = kart; panel aç → özet + portföy; sütun gizle → yenile; sayfa dışı adres |
| E2E | `e2e/operasyon/operasyon.spec.ts` (genişler) | OPERASYON'da "Aktif kullanıcı" kartı ve "Satıcılar" sekmesi yok, yalnız satıcılar; panelde prim ve son işlemler yok |
| E2E | mevcut | `users*.spec.ts`, `seller-deactivation`, `doctor-transfer` geçer |

## 7. Belgeler

YOL_HARITASI Ü-22 · KABUL_KRITERLERI (X-17-6, D-2-3) · TRACEABILITY · PROJE_DURUMU arayüz bölümü ·
DEVAM_PROMPTU. KARARLAR değişmez.

## 8. Teslim

| PR | Dal | İçerik |
|---|---|---|
| D1 | `revize/kullanicilar-d1-veri` | spec · plan · Ü-22 · kriterler · `kullanici-listesi/` saf modüller + sorgular · testler; ekran değişmez |
| D2 | `revize/kullanicilar-d2-ekran` | KPI · sekmeler · tablo · sütun seçici · sayfalama · panel · iskelet · e2e · belgeler |

## 9. Önerilen seçimler

| # | Soru | Seçilen | Diğer |
|---|---|---|---|
| 1 | Portföy neyi sayar? | aktif cariler | bütün cariler (bugünkü sütun) — pasif cari iş yükü değil |
| 2 | Dördüncü KPI | İlk girişi bekleyen (geçici parola) — E-2 akışının açık ucu | Pasif kullanıcı (eylem önermez; sekmede var) |
| 3 | Son etkinlik kaynağı | `Session.lastSeenAt` en büyüğü (iptal edilmiş oturum dahil) | denetim kaydındaki son GIRIS (giriş anı, etkinlik değil) |
| 4 | OPERASYON'da KPI | kapsamına göre: Aktif kullanıcı kartı ve Satıcılar sekmesi gizli | aynı kartlar, aynı sayı (yanıltıcı tekrar) |
| 5 | Panelde satıcı cirosu | yok (Raporlar; D-2) | bu ay ciro |
| 6 | Rol süzgeci | sekme (Satıcılar) + adres `rol` | Filtrele formu (kullanıcı sayısı küçük) |
