import Link from "next/link";
import type { Metadata } from "next";
import { buton } from "@/components/stil";

export const metadata: Metadata = {
  title: "Gizlilik Politikası — Medikal Satış Operasyon",
  description: "KVKK kapsamında kişisel verilerin işlenmesine ilişkin aydınlatma.",
};

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: "Hangi veriler tutuluyor?",
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li>
          <strong>Satıcı kullanıcıları:</strong> ad soyad, e-posta, telefon,
          şifre (yalnızca geri döndürülemez <em>hash</em> olarak).
        </li>
        <li>
          <strong>Sipariş kayıtları:</strong> doktor adı ve hastane/klinik
          bilgisi, sipariş kalemleri ve tutarları.
        </li>
        <li>
          <strong>Finansal kayıtlar:</strong> satıcı bazında ödeme ve cari
          hesap hareketleri.
        </li>
        <li>
          <strong>İşlem kayıtları (audit log):</strong> kritik işlemleri kimin,
          ne zaman yaptığı. Bu kayıtlarda şifre/gizli alanlar tutulmaz.
        </li>
      </ul>
    ),
  },
  {
    title: "İşlenme amacı",
    body: (
      <p>
        Veriler yalnızca medikal ürün satış ve operasyon sürecinin
        yürütülmesi amacıyla işlenir: sipariş, stok, kargo, ödeme ve satıcı cari
        hesap yönetimi. Pazarlama, profilleme veya üçüncü taraflara aktarım
        amacıyla kullanılmaz.
      </p>
    ),
  },
  {
    title: "Saklama süresi",
    body: (
      <p>
        Kayıtlar, operasyonel ve yasal yükümlülüklerin gerektirdiği süre boyunca
        saklanır. İlgili sürenin sonunda veya amaç ortadan kalktığında veriler
        silinir veya anonimleştirilir.
      </p>
    ),
  },
  {
    title: "Kimler erişebilir?",
    body: (
      <p>
        Verilere yalnızca yetkilendirilmiş sistem kullanıcıları erişebilir.
        Yönetici rolü tüm operasyonel verileri görürken, satıcı rolü yalnızca
        kendi siparişlerine ve cari hesabına erişir. Erişim, rol ve nesne
        düzeyinde kısıtlanmıştır.
      </p>
    ),
  },
  {
    title: "Güvenlik önlemleri",
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li>
          Şifreler bcrypt ile geri döndürülemez biçimde özetlenir (hash); düz
          metin tutulmaz.
        </li>
        <li>Oturumlar imzalı JWT ile yönetilir; rol bazlı yetkilendirme uygulanır.</li>
        <li>Başarısız giriş denemelerine karşı kaba kuvvet (brute-force) koruması.</li>
        <li>Kritik işlemler audit log ile kayıt altına alınır.</li>
        <li>Veritabanı düzenli olarak yedeklenir ve yedek bütünlüğü doğrulanır.</li>
      </ul>
    ),
  },
  {
    title: "İletişim",
    body: (
      <p>
        Kişisel verilerinize ilişkin talepleriniz (erişim, düzeltme, silme) için
        sistem yöneticinizle iletişime geçebilirsiniz.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-12">
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">
          Gizlilik Politikası
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          6698 sayılı KVKK kapsamında kişisel verilerin işlenmesine ilişkin
          aydınlatma metni.
        </p>

        <div className="mt-8 space-y-6">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="text-sm font-semibold text-slate-900">
                {s.title}
              </h2>
              <div className="mt-2 text-sm leading-relaxed text-slate-600">
                {s.body}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 border-t border-slate-200 pt-6">
          <Link
            href="/login"
            className={buton("metin")}
          >
            ← Girişe dön
          </Link>
        </div>
      </div>
    </main>
  );
}
