'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { AppHeader } from '@/components/layout/app-header';

const NEXT_STATUS: Record<string, string> = {
  ASSIGNED: 'EN_ROUTE',
  EN_ROUTE: 'ARRIVED',
  ARRIVED: 'COMPLETED',
};

export default function CollectorRoutePage() {
  const { data: session } = useSession();
  const [pickups, setPickups] = useState<Array<{ id: string; status: string; address: { line1: string } }>>([]);

  const today = new Date().toISOString().slice(0, 10);

  function load() {
    if (!session?.user?.id) return;
    fetch(`/api/v1/collectors/${session.user.id}/pickups?scheduledDate=${today}`)
      .then((r) => r.json())
      .then((j) => setPickups(j.data ?? []));
  }

  useEffect(() => {
    load();
  }, [session?.user?.id]);

  async function advance(id: string, status: string) {
    const next = NEXT_STATUS[status];
    if (!next) return;
    const body: Record<string, unknown> = { status: next };
    if (next === 'COMPLETED') body.actualWeightKg = 5;
    await fetch(`/api/v1/pickups/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    load();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="max-w-lg mx-auto p-6 space-y-4">
        <h1 className="text-2xl font-bold">Tournée</h1>
        {pickups.map((p) => (
          <div key={p.id} className="bg-white border rounded-lg p-4">
            <p className="font-medium">{p.address.line1}</p>
            <p className="text-sm text-gray-500 mb-3">{p.status}</p>
            {NEXT_STATUS[p.status] && (
              <button
                type="button"
                onClick={() => advance(p.id, p.status)}
                className="w-full bg-green-600 text-white py-3 rounded-lg text-lg font-medium"
              >
                → {NEXT_STATUS[p.status]}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
