import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AppHeader } from '@/components/layout/app-header';
import { prisma } from '@/lib/db';

export default async function CollectorDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);

  const today = new Date();
  today.setUTCHours(12, 0, 0, 0);

  const pickups = await prisma.pickup.findMany({
    where: { assignedCollectorId: session.user.id, scheduledDate: today },
    include: { address: true, wasteType: true },
    orderBy: { timeWindowStart: 'asc' },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="max-w-lg mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Aujourd&apos;hui</h1>
        <p className="text-gray-600 mb-6">{pickups.length} collecte(s)</p>
        <Link
          href={`/${locale}/collector/route`}
          className="block text-center bg-green-600 text-white py-3 rounded-lg mb-6"
        >
          Voir la tournée
        </Link>
        <ul className="space-y-3">
          {pickups.map((p) => (
            <li key={p.id} className="bg-white border rounded-lg p-4">
              <p className="font-medium">{p.address.line1}</p>
              <p className="text-sm text-gray-500">
                {p.timeWindowStart}–{p.timeWindowEnd} · {p.status}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
