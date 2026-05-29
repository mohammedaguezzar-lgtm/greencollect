'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { MapPicker, CASABLANCA } from '@/components/map/map-picker';
import { SERVICE_CITY } from '@/lib/utils';

export default function AddressesPage() {
  const params = useParams();
  const locale = (params?.locale as string) ?? 'fr';
  const [list, setList] = useState<
    Array<{ id: string; line1: string; city: string; latitude: number; longitude: number }>
  >([]);
  const [form, setForm] = useState({
    line1: '',
    district: '',
    latitude: CASABLANCA.lat,
    longitude: CASABLANCA.lng,
  });
  const [geocodeQuery, setGeocodeQuery] = useState('');
  const [geocoding, setGeocoding] = useState(false);

  function load() {
    fetch('/api/v1/addresses')
      .then((r) => r.json())
      .then((j) => setList(j.data ?? []));
  }

  useEffect(() => {
    load();
  }, []);

  async function geocode() {
    if (geocodeQuery.length < 3) return;
    setGeocoding(true);
    const res = await fetch('/api/v1/geo/geocode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: `${geocodeQuery}, ${SERVICE_CITY}` }),
    });
    setGeocoding(false);
    if (res.ok) {
      const j = await res.json();
      setForm((f) => ({
        ...f,
        latitude: j.data.latitude,
        longitude: j.data.longitude,
      }));
    }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/v1/addresses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        city: SERVICE_CITY,
        isDefault: list.length === 0,
      }),
    });
    setForm({
      line1: '',
      district: '',
      latitude: CASABLANCA.lat,
      longitude: CASABLANCA.lng,
    });
    load();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="max-w-lg mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Adresses</h1>
        <ul className="space-y-2 mb-8">
          {list.map((a) => (
            <li key={a.id} className="bg-white border rounded-lg p-3 text-sm">
              {a.line1}, {a.city}
            </li>
          ))}
        </ul>
        <form onSubmit={add} className="space-y-4 bg-white border rounded-lg p-4">
          <div className="flex gap-2">
            <input
              placeholder="Rechercher adresse…"
              value={geocodeQuery}
              onChange={(e) => setGeocodeQuery(e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={geocode}
              disabled={geocoding}
              className="border px-3 py-2 rounded-lg text-sm"
            >
              {geocoding ? '…' : 'Geo'}
            </button>
          </div>
          <MapPicker
            latitude={form.latitude}
            longitude={form.longitude}
            onChange={(lat, lng) => setForm({ ...form, latitude: lat, longitude: lng })}
          />
          <input
            placeholder="Rue"
            required
            value={form.line1}
            onChange={(e) => setForm({ ...form, line1: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
          />
          <input
            placeholder="Quartier"
            value={form.district}
            onChange={(e) => setForm({ ...form, district: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
          />
          <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg">
            Ajouter
          </button>
        </form>
        <a href={`/${locale}/pickups/new`} className="text-green-600 text-sm mt-4 inline-block">
          ← Réserver
        </a>
      </div>
    </div>
  );
}
