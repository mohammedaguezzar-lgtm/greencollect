import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { AppHeader } from '@/components/layout/app-header';
import { PickupStatusBadge } from '@/components/pickup/status-badge';
import { prisma } from '@/lib/db';

export default async function PickupsListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);

  const t = await getTranslations('pickup.status');
  const pickups = await prisma.pickup.findMany({
    where: { customerId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: { wasteType: true, address: true },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold">Mes collectes</h1>
          <Link
            href={`/${locale}/pickups/new`}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm"
          >
            Nouvelle
          </Link>
        </div>
        <ul className="space-y-3">
          {pickups.map((p) => (
            <li key={p.id}>
              <Link
                href={`/${locale}/pickups/${p.id}`}
                className="block bg-white border rounded-lg p-4 hover:border-green-300"
              >
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">{p.address.line1}</p>
                    <p className="text-sm text-gray-500">
                      {p.scheduledDate.toISOString().slice(0, 10)} · {Number(p.feeAmountMad)} MAD
                    </p>
                  </div>
                  <PickupStatusBadge status={p.status} label={t(p.status)} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
