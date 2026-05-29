'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { PickupMap, type MapPin } from '@/components/map/pickup-map';

type Collector = { id: string; name: string | null; email: string };
type Pickup = {
  id: string;
  status: string;
  address: { line1: string; latitude: number; longitude: number };
  customer: { name: string | null };
};

export default function DispatcherRoutesPage() {
  const params = useParams();
  const locale = (params?.locale as string) ?? 'fr';

  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [collectorId, setCollectorId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [available, setAvailable] = useState<Pickup[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/v1/collectors')
      .then((r) => r.json())
      .then((j) => setCollectors(j.data ?? []));
  }, []);

  useEffect(() => {
    if (!date) return;
    fetch(
      `/api/v1/pickups?scheduledDate=${date}&status=CONFIRMED&pageSize=50`,
    )
      .then((r) => r.json())
      .then((j) => setAvailable(j.data ?? []));
  }, [date]);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function moveUp(index: number) {
    if (index === 0) return;
    setSelected((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }

  async function createRoute() {
    if (!collectorId || selected.length === 0) {
      setMessage('Sélectionnez un collecteur et au moins une collecte.');
      return;
    }
    setLoading(true);
    setMessage('');
    const res = await fetch('/api/v1/routes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collectorId, date, pickupIds: selected }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setMessage(j?.error?.message ?? 'Erreur création tournée');
      return;
    }
    setMessage('Tournée créée.');
    setSelected([]);
  }

  const ordered = selected
    .map((id) => available.find((p) => p.id === id))
    .filter(Boolean) as Pickup[];

  const pins: MapPin[] = ordered.map((p, i) => ({
    id: p.id,
    latitude: Number(p.address.latitude),
    longitude: Number(p.address.longitude),
    label: `${i + 1}. ${p.address.line1}`,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Créer une tournée</h1>
          <Link href={`/${locale}/dispatcher/pickups`} className="text-green-600 text-sm">
            ← File d&apos;attente
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mt-1"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Collecteur</label>
            <select
              value={collectorId}
              onChange={(e) => setCollectorId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mt-1"
            >
              <option value="">Choisir…</option>
              {collectors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name ?? c.email}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <h2 className="font-semibold mb-2">Collectes confirmées</h2>
            <ul className="space-y-2 max-h-96 overflow-y-auto">
              {available.map((p) => (
                <li key={p.id}>
                  <label className="flex items-start gap-2 bg-white border rounded-lg p-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selected.includes(p.id)}
                      onChange={() => toggle(p.id)}
                    />
                    <span>
                      <span className="font-medium block">{p.address.line1}</span>
                      <span className="text-xs text-gray-500">
                        {p.customer.name ?? 'Client'}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-semibold mb-2">Ordre de visite</h2>
            {ordered.length === 0 ? (
              <p className="text-sm text-gray-500">Cochez des collectes à gauche.</p>
            ) : (
              <ol className="space-y-2 mb-4">
                {ordered.map((p, i) => (
                  <li
                    key={p.id}
                    className="flex justify-between items-center bg-white border rounded-lg px-3 py-2"
                  >
                    <span>
                      {i + 1}. {p.address.line1}
                    </span>
                    <button
                      type="button"
                      onClick={() => moveUp(i)}
                      disabled={i === 0}
                      className="text-xs text-green-600 disabled:opacity-30"
                    >
                      ↑
                    </button>
                  </li>
                ))}
              </ol>
            )}
            {pins.length > 0 && <PickupMap pins={pins} />}
          </div>
        </div>

        {message && <p className="text-sm text-center text-gray-700">{message}</p>}
        <button
          type="button"
          disabled={loading}
          onClick={createRoute}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-medium disabled:opacity-50"
        >
          {loading ? '…' : 'Créer la tournée'}
        </button>
      </div>
    </div>
  );
}
