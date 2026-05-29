'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';

type WasteType = {
  id: string;
  code: string;
  nameKey: string;
  flatFeeMad: number;
  active: boolean;
};

export default function AdminWasteTypesPage() {
  const params = useParams();
  const locale = (params?.locale as string) ?? 'fr';
  const [types, setTypes] = useState<WasteType[]>([]);
  const [editing, setEditing] = useState<Record<string, string>>({});

  function load() {
    fetch('/api/v1/waste-types')
      .then((r) => r.json())
      .then((j) => setTypes(j.data ?? []));
  }

  useEffect(() => {
    load();
  }, []);

  async function save(id: string) {
    const fee = parseFloat(editing[id]);
    if (Number.isNaN(fee)) return;
    await fetch(`/api/v1/waste-types/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flatFeeMad: fee }),
    });
    load();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="max-w-lg mx-auto p-6">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold">Tarifs déchets</h1>
          <Link href={`/${locale}/admin/dashboard`} className="text-green-600 text-sm">
            ← Admin
          </Link>
        </div>
        <ul className="space-y-3">
          {types.map((w) => (
            <li key={w.id} className="bg-white border rounded-lg p-4 flex justify-between items-center gap-4">
              <div>
                <p className="font-medium">{w.code}</p>
                <p className="text-xs text-gray-500">{w.nameKey}</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  defaultValue={w.flatFeeMad}
                  onChange={(e) => setEditing({ ...editing, [w.id]: e.target.value })}
                  className="w-24 border rounded-lg px-2 py-1 text-sm"
                />
                <span className="text-sm">MAD</span>
                <button
                  type="button"
                  onClick={() => save(w.id)}
                  className="text-sm bg-green-600 text-white px-3 py-1 rounded-lg"
                >
                  OK
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
