import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('landing');
  const auth = await getTranslations('auth');

  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b bg-white px-6 py-4 flex justify-between items-center">
        <span className="font-semibold text-green-600 text-xl">GreenCollect</span>
        <nav className="flex gap-4 text-sm">
          <Link href={`/${locale}/login`} className="text-gray-600 hover:text-gray-900">
            {auth('login')}
          </Link>
          <Link
            href={`/${locale}/register`}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            {auth('register')}
          </Link>
        </nav>
      </header>
      <section className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6">
        <h1 className="text-4xl md:text-5xl font-bold max-w-2xl">{t('hero')}</h1>
        <p className="text-gray-600 max-w-lg">
          Plateforme de collecte des déchets recyclables — Casablanca
        </p>
        <Link
          href={`/${locale}/register`}
          className="bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-green-700"
        >
          {t('cta')}
        </Link>
      </section>
      <footer className="py-6 text-center text-sm text-gray-500">
        <Link href={`/${locale}/legal/privacy`} className="hover:text-green-600 mx-2">
          {locale === 'ar' ? 'الخصوصية' : 'Confidentialité'}
        </Link>
        · © GreenCollect Morocco
      </footer>
    </main>
  );
}
