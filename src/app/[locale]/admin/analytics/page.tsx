import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AppHeader } from '@/components/layout/app-header';
import { getAdminAnalytics } from '@/server/analytics/service';

export default async function AdminAnalyticsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect(`/${locale}/unauthorized`);
  }

  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - 1);

  const { summary, byWasteType } = await getAdminAnalytics(from, to);

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="flex justify-between">
          <h1 className="text-2xl font-bold">Analytics (30 jours)</h1>
          <Link href={`/${locale}/admin/dashboard`} className="text-green-600 text-sm">
            ← Admin
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Metric label="Collectes terminées" value={summary.pickupsCompleted} />
          <Metric label="kg recyclés" value={summary.totalWeightKg.toFixed(1)} />
          <Metric label="Revenu (MAD)" value={summary.revenueMad.toFixed(2)} />
          <Metric
            label="CO₂ évité (est.)"
            value={`${summary.co2SavedKg.toFixed(1)} kg`}
            hint="Estimation"
          />
        </div>

        <section>
          <h2 className="font-semibold mb-3">Par type de déchet</h2>
          <table className="w-full bg-white border rounded-lg text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="p-3">Type</th>
                <th className="p-3">Collectes</th>
                <th className="p-3">kg</th>
              </tr>
            </thead>
            <tbody>
              {byWasteType.map((row) => (
                <tr key={row.code} className="border-b">
                  <td className="p-3">{row.code}</td>
                  <td className="p-3">{row.pickupsCompleted}</td>
                  <td className="p-3">{row.totalWeightKg.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <p className="text-xs text-gray-500">
          Taux de complétion: {(summary.completionRate * 100).toFixed(0)}% — CO₂ basé sur
          facteurs documentés (estimation).
        </p>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="bg-white border rounded-lg p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xl font-bold">{value}</p>
      {hint && <p className="text-xs text-amber-600 mt-1">{hint}</p>}
    </div>
  );
}
