import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { ASGARI_UZUNLUK } from "@/lib/parola";
import LogoutButton from "@/components/LogoutButton";
import ParolaForm from "./ParolaForm";

/**
 * Geçici parolanın değiştirildiği tek sayfa (E-2 §(2)/(3), E-2-7). `requireSession()` geçici
 * parolalı kullanıcıyı buraya gönderir; bu sayfa o guard'ı kullanmaz (döngü olurdu).
 */
export default async function ParolaDegistirPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.user.mustChangePassword) redirect("/");

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">Parolanızı değiştirin</h1>
        <p className="mt-1 mb-6 text-sm text-slate-500">
          Hesabınız geçici parolayla açıldı. Devam etmek için kendi parolanızı belirleyin.
        </p>
        <ParolaForm asgari={ASGARI_UZUNLUK} />
        <div className="mt-4 flex justify-center">
          <LogoutButton />
        </div>
      </div>
    </main>
  );
}
