import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { AppHeader } from '@/components/layout/app-header';
import { PickupStatusBadge } from '@/components/pickup/status-badge';
import * as pickupService from '@/server/pickups/service';
import { getSessionUser } from '@/lib/permissions';
import { toNumber } from '@/lib/serialize';

export default async function PickupDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);

  const user = getSessionUser(session);
  if (!user) redirect(`/${locale}/login`);

  const t = await getTranslations('pickup.status');

  let pickup;
  try {
    pickup = await pickupService.getPickup(id, user);
  } catch {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="max-w-lg mx-auto p-6 space-y-6">
        <div className="flex justify-between items-start">
          <h1 className="text-2xl font-bold">Collecte</h1>
          <PickupStatusBadge status={pickup.status} label={t(pickup.status)} />
        </div>
        <dl className="bg-white border rounded-lg p-4 space-y-2 text-sm">
          <div>
            <dt className="text-gray-500">Adresse</dt>
            <dd>{pickup.address.line1}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Date</dt>
            <dd>
              {pickup.scheduledDate.toISOString().slice(0, 10)} · {pickup.timeWindowStart}–
              {pickup.timeWindowEnd}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Frais</dt>
            <dd>{toNumber(pickup.feeAmountMad)} MAD · {pickup.paymentStatus}</dd>
          </div>
        </dl>
        <section>
          <h2 className="font-semibold mb-2">Historique</h2>
          <ul className="space-y-2">
            {pickup.statusHistory.map((h) => (
              <li key={h.id} className="text-sm text-gray-600 border-l-2 border-green-400 pl-3">
                {h.fromStatus ?? '—'} → {h.toStatus}
                <span className="text-gray-400 ml-2">
                  {h.createdAt.toISOString().slice(0, 16).replace('T', ' ')}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
