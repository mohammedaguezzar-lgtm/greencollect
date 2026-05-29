import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { AppHeader } from '@/components/layout/app-header';
import { PickupStatusBadge } from '@/components/pickup/status-badge';
import { getUserImpact } from '@/server/analytics/service';
import { prisma } from '@/lib/db';
export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);

  const role = session.user.role;
  if (role === 'COLLECTOR') redirect(`/${locale}/collector/dashboard`);
  if (role === 'DISPATCHER') redirect(`/${locale}/dispatcher/dashboard`);
  if (role === 'ADMIN') redirect(`/${locale}/admin/dashboard`);

  const t = await getTranslations('pickup.status');
  const nav = await getTranslations('nav');

  const [pickups, impact] = await Promise.all([
    prisma.pickup.findMany({
      where: { customerId: session.user.id },
      orderBy: { scheduledDate: 'asc' },
      take: 5,
      include: { wasteType: true },
    }),
    getUserImpact(session.user.id),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{nav('dashboard')}</h1>
          <Link
            href={`/${locale}/pickups/new`}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            {nav('book')}
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <StatCard title="Collectes" value={impact.pickupsCompleted} />
          <StatCard title="kg recyclés" value={impact.totalWeightKg.toFixed(1)} />
          <StatCard title="CO₂ estimé (kg)" value={impact.co2SavedKg.toFixed(1)} />
        </div>

        <section>
          <h2 className="font-semibold mb-3">{nav('pickups')}</h2>
          {pickups.length === 0 ? (
            <p className="text-gray-600">Aucune collecte — réservez votre première.</p>
          ) : (
            <ul className="space-y-3">
              {pickups.map((p) => (
                <li key={p.id} className="bg-white border rounded-lg p-4 flex justify-between">
                  <div>
                    <p className="font-medium">{p.wasteType.nameKey}</p>
                    <p className="text-sm text-gray-500">
                      {p.scheduledDate.toISOString().slice(0, 10)} · {p.timeWindowStart}–
                      {p.timeWindowEnd}
                    </p>
                  </div>
                  <PickupStatusBadge status={p.status} label={t(p.status)} />
                </li>
              ))}
            </ul>
          )}
          <Link href={`/${locale}/pickups`} className="text-green-600 text-sm mt-2 inline-block">
            Voir tout →
          </Link>
        </section>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-white border rounded-lg p-4">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-green-700">{value}</p>
    </div>
  );
}
