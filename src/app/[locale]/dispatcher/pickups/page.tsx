'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppHeader } from '@/components/layout/app-header';

type Pickup = {
  id: string;
  status: string;
  scheduledDate: string;
  customer: { name: string | null; email: string };
  wasteType: { nameKey: string };
};
type Collector = { id: string; name: string | null; email: string };

export default function DispatcherPickupsPage() {
  const params = useParams();
  const locale = (params?.locale as string) ?? 'fr';
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [assigning, setAssigning] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/pickups?status=REQUESTED&pageSize=50')
      .then((r) => r.json())
      .then((j) => setPickups(j.data ?? []));
    fetch('/api/v1/collectors')
      .then((r) => r.json())
      .then((j) => setCollectors(j.data ?? []));
  }, []);

  async function confirm(id: string) {
    await fetch(`/api/v1/pickups/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CONFIRMED' }),
    });
    location.reload();
  }

  async function assign(pickupId: string, collectorId: string) {
    setAssigning(pickupId);
    await fetch(`/api/v1/pickups/${pickupId}/assign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignedCollectorId: collectorId }),
    });
    setAssigning(null);
    location.reload();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">File d&apos;attente</h1>
          <Link href={`/${locale}/dispatcher/routes`} className="text-green-600 text-sm">
            Créer tournée →
          </Link>
        </div>
        <div className="space-y-4">
          {pickups.map((p) => (
            <div key={p.id} className="bg-white border rounded-lg p-4">
              <div className="flex justify-between flex-wrap gap-2">
                <div>
                  <p className="font-medium">{p.customer.name ?? p.customer.email}</p>
                  <p className="text-sm text-gray-500">
                    {p.wasteType.nameKey} · {p.scheduledDate?.slice?.(0, 10) ?? p.scheduledDate}
                  </p>
                  <p className="text-xs text-gray-400">{p.status}</p>
                </div>
                <div className="flex gap-2 items-center">
                  {p.status === 'REQUESTED' && (
                    <button
                      type="button"
                      onClick={() => confirm(p.id)}
                      className="text-sm border px-3 py-1 rounded-lg"
                    >
                      Confirmer
                    </button>
                  )}
                  <select
                    className="border rounded-lg text-sm px-2 py-1"
                    defaultValue=""
                    disabled={assigning === p.id}
                    onChange={(e) => e.target.value && assign(p.id, e.target.value)}
                  >
                    <option value="">Assigner…</option>
                    {collectors.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name ?? c.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
