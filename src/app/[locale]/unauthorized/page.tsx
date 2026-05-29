import Link from 'next/link';

export default async function UnauthorizedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Accès refusé</h1>
      <Link href={`/${locale}`} className="text-green-600 hover:underline">
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
