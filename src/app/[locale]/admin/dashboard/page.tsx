import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AppHeader } from '@/components/layout/app-header';
import { getAdminStats } from '@/server/analytics/service';

export default async function AdminDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);

  const stats = await getAdminStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Admin</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {[
            ['Collectes aujourd\'hui', stats.pickupsToday],
            ['Terminées', stats.pickupsCompletedToday],
            ['En attente', stats.pendingRequests],
            ['Collecteurs actifs', stats.activeCollectors],
            ['Revenu MAD', stats.revenueTodayMad],
          ].map(([label, value]) => (
            <div key={label as string} className="bg-white border rounded-lg p-4">
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-2xl font-bold">{value}</p>
            </div>
          ))}
        </div>
        <nav className="flex flex-wrap gap-4 text-green-600">
          <Link href={`/${locale}/dispatcher/pickups`}>File pickups</Link>
          <Link href={`/${locale}/dispatcher/routes`}>Tournées</Link>
          <Link href={`/${locale}/admin/users`}>Utilisateurs</Link>
          <Link href={`/${locale}/admin/waste-types`}>Tarifs</Link>
          <Link href={`/${locale}/admin/analytics`}>Analytics</Link>
        </nav>
      </div>
    </div>
  );
}
