# Product Requirements Document (PRD)

# Medikal Satış Operasyon Yönetim Sistemi

**İngilizce Adı:** Medical Sales Operations System

**Versiyon:** 1.0 (MVP)

---

# Yönetici Özeti

Bu proje, merkezi deposunda bulunan medikal ürünleri yaklaşık **10 satıcısı** aracılığıyla doktorlara ulaştıran bir firmanın şirket içi operasyonlarını dijital ortama taşımayı amaçlamaktadır.

Mevcut süreçler Excel dosyaları, telefon görüşmeleri ve WhatsApp üzerinden yürütülmektedir. İşlem hacminin artmasıyla birlikte stok takibi, sipariş yönetimi, kargo süreçleri ve satıcıların şirkete olan cari hesaplarının yönetimi zorlaşmış, manuel süreçler hata riskini artırmıştır.

Geliştirilecek web uygulaması sayesinde ürün yönetimi, merkezi stok, sipariş süreçleri, kargo takibi, ödeme kayıtları ve satıcı cari hesapları tek sistem üzerinden yönetilecektir.

---

# 1. Problem Tanımı

Şirket operasyonları şu anda aşağıdaki araçlarla yürütülmektedir:

- Excel dosyaları
- Telefon görüşmeleri
- WhatsApp yazışmaları

Bu durum aşağıdaki problemlere neden olmaktadır:

- Merkezi stok doğru takip edilememektedir.
- Satıcı bazlı satış performansı net görülememektedir.
- Sipariş süreçleri takip edilememektedir.
- Kargo süreçleri merkezi olarak yönetilememektedir.
- Satıcıların şirkete olan borç ve ödeme durumları karışmaktadır.
- Manuel işlemler hata riskini artırmaktadır.

---

# 2. Projenin Amacı

Firmanın tüm satış operasyonlarını tek merkezden yönetebileceği web tabanlı bir operasyon yönetim sistemi geliştirmek.

Sistem aşağıdaki süreçleri kapsamalıdır:

- Ürün yönetimi
- Merkezi stok yönetimi
- Satıcı yönetimi
- Sipariş yönetimi
- Kargo yönetimi
- Ödeme yönetimi
- Satıcı cari hesapları
- Yönetim paneli ve raporlama

## Hedefler

- Excel kullanımını ortadan kaldırmak
- Operasyonel hataları azaltmak
- Merkezi stok takibini kolaylaştırmak
- Satıcı performansını takip edebilmek
- Satıcıların şirkete olan cari hesaplarını anlık görüntüleyebilmek

---

# 3. Kullanıcı Rolleri

## Admin

Admin sistemin tamamına erişebilir.

### Yetkileri

- Ürün yönetimi
- Merkezi stok yönetimi
- Satıcı yönetimi
- Sipariş yönetimi
- Kargo yönetimi
- Ödeme kayıtları
- Dashboard
- Raporlar

---

## Satıcı

Satıcı yalnızca kendi verilerine erişebilir.

### Yetkileri

- Yeni sipariş oluşturma
- Kendi siparişlerini görüntüleme
- Kendi satışlarını görüntüleme
- Kendi ödeme geçmişini görüntüleme
- Şirkete olan güncel bakiyesini görüntüleme

---

# 4. Fonksiyonel Gereksinimler

## 4.1 Ürün Yönetimi

Her ürün aşağıdaki bilgileri içermelidir.

| Alan | Açıklama |
|------|----------|
| Ürün Adı | Ürün adı |
| Ürün Kodu | Sistem kodu |
| Satış Fiyatı | Güncel satış fiyatı |
| Güncel Stok | Depodaki mevcut stok |
| Durum | Aktif / Pasif |

### Desteklenen İşlemler

- Ürün ekleme
- Ürün düzenleme
- Ürün silme
- Ürün listeleme

---

## 4.2 Merkezi Stok Yönetimi

Şirkette tek bir ana depo bulunmaktadır.

Tüm satıcılar satışlarını aynı merkezi stok üzerinden gerçekleştirir.

Sistem aşağıdaki bilgileri takip etmelidir.

- Güncel stok
- Stok girişleri
- Stok çıkışları
- Stok hareket geçmişi

---

## 4.3 Satıcı Yönetimi

Her satıcı için aşağıdaki bilgiler tutulmalıdır.

- Ad Soyad
- Telefon
- E-posta
- Durum (Aktif / Pasif)

Sistem aşağıdaki bilgileri otomatik hesaplamalıdır.

- Toplam satış
- Toplam ödeme
- Güncel bakiye

---

## 4.4 Sipariş Yönetimi

Satıcı yeni sipariş oluşturabilir.

Her sipariş aşağıdaki bilgileri içermelidir.

- Doktor adı
- Hastane / Klinik
- Sipariş ürünleri
- Ürün miktarları
- Birim fiyatlar
- Toplam tutar
- Sipariş tarihi

> **Not:** Doktor sistem kullanıcısı değildir. Doktor bilgileri yalnızca sipariş referansı olarak tutulmaktadır.

---

## 4.5 Sipariş Durumları

Bir sipariş aşağıdaki durumlardan birinde olabilir.

- Bekliyor
- Hazırlanıyor
- Kargolandı
- Teslim Edildi
- İptal Edildi

---

## 4.6 Kargo Yönetimi

Hazırlanacak siparişler tek ekranda görüntülenebilmelidir.

Her sipariş için aşağıdaki bilgiler tutulmalıdır.

- Kargo firması
- Takip numarası
- Kargoya verilme tarihi
- Güncel durum

> **Not:** İlk sürümde kargo firmalarıyla API entegrasyonu yapılmayacaktır.

---

## 4.7 Satıcı Cari Hesabı

Her satıcının şirket ile olan finansal durumu sistem tarafından otomatik hesaplanmalıdır.

Gösterilecek bilgiler:

- Toplam satış
- Toplam ödeme
- Güncel bakiye

### Hesaplama

```text
Güncel Bakiye = Toplam Satış − Toplam Ödeme
```

---

## 4.8 Ödeme Yönetimi

Admin satıcılardan gelen ödemeleri sisteme kaydedebilir.

Her ödeme kaydı aşağıdaki alanları içermelidir.

- Satıcı
- Tutar
- Tarih
- Ödeme yöntemi
- Açıklama

### Desteklenen Ödeme Yöntemleri

- Nakit
- Havale / EFT
- Kredi Kartı
- Diğer

---

## 4.9 Dashboard

Admin panelinde aşağıdaki bilgiler gösterilmelidir.

- Toplam stok
- Kritik stok ürünleri
- Bugünkü sipariş sayısı
- Bekleyen siparişler
- Kargolanacak siparişler
- Toplam satış
- Toplam tahsilat
- Toplam bakiye
- Satıcı bazlı satış performansı

---

# 5. İş Akışı

```text
Admin
   │
   ▼
Ürünleri Sisteme Ekler
   │
   ▼
Satıcı Giriş Yapar
   │
   ▼
Sipariş Oluşturur
   │
   ▼
Sipariş Hazırlanır
   │
   ▼
Kargoya Verilir
   │
   ▼
Ödeme Kaydedilir
   │
   ▼
Satıcı Bakiyesi Güncellenir
```

---

# 6. MVP Kapsamı

İlk sürümde geliştirilecek modüller:

- Kullanıcı girişi
- Rol bazlı yetkilendirme
- Ürün yönetimi
- Merkezi stok yönetimi
- Satıcı yönetimi
- Sipariş oluşturma
- Sipariş takibi
- Kargo yönetimi
- Ödeme kayıtları
- Satıcı cari hesabı
- Dashboard

---

# 7. MVP Kapsamı Dışında Kalan Özellikler

İlk sürümde geliştirilmeyecek özellikler:

- Mobil uygulama
- Muhasebe entegrasyonu
- E-Fatura
- E-Arşiv
- Kargo API entegrasyonu
- SMS bildirimleri
- E-posta bildirimleri
- Çoklu depo desteği
- Çoklu şirket desteği
- Barkod sistemi
- QR kod sistemi
- Prim hesaplama
- Satış hedefleri
- Gelişmiş raporlama
- Bildirim merkezi

---

# 8. Başarı Kriterleri

MVP aşağıdaki kriterleri sağladığında başarılı kabul edilir.

- Ürünler sistem üzerinden yönetilebilmektedir.
- Merkezi stok doğru takip edilmektedir.
- Satıcılar sipariş oluşturabilmektedir.
- Sipariş süreci uçtan uca takip edilebilmektedir.
- Kargo süreçleri yönetilebilmektedir.
- Satıcıların şirkete olan bakiyeleri doğru hesaplanmaktadır.
- Excel tabanlı süreçler büyük ölçüde ortadan kaldırılmıştır.

---

# 9. Gelecek Sürümler

İlerleyen sürümlerde değerlendirilebilecek özellikler:

- Muhasebe entegrasyonu
- E-Fatura
- Barkod desteği
- Kargo entegrasyonu
- PDF ve Excel raporları
- Gelişmiş Dashboard
- Satış analizleri
- Bildirim sistemi
- Mobil uygulama