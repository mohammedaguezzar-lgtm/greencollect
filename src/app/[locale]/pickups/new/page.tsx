'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { SERVICE_CITY } from '@/lib/utils';

type WasteType = { id: string; code: string; nameKey: string; flatFeeMad: number };
type Address = { id: string; line1: string; isDefault: boolean };

export default function NewPickupPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? 'fr';

  const [step, setStep] = useState(1);
  const [wasteTypes, setWasteTypes] = useState<WasteType[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [form, setForm] = useState({
    wasteTypeId: '',
    addressId: '',
    scheduledDate: '',
    timeWindowStart: '09:00',
    timeWindowEnd: '12:00',
    estimatedWeightKg: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/waste-types').then((r) => r.json()),
      fetch('/api/v1/addresses').then((r) => r.json()),
    ]).then(([w, a]) => {
      setWasteTypes(w.data ?? []);
      setAddresses(a.data ?? []);
      if (a.data?.[0]) setForm((f) => ({ ...f, addressId: a.data[0].id }));
    });
  }, []);

  const selectedWaste = wasteTypes.find((w) => w.id === form.wasteTypeId);

  async function submit() {
    setLoading(true);
    setError('');
    const res = await fetch('/api/v1/pickups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        estimatedWeightKg: form.estimatedWeightKg
          ? parseFloat(form.estimatedWeightKg)
          : undefined,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j?.error?.message ?? 'Erreur');
      return;
    }
    const j = await res.json();
    router.push(`/${locale}/pickups/${j.data.id}`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="max-w-lg mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Réserver — étape {step}/3</h1>
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Type de déchet</p>
            {wasteTypes.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => setForm({ ...form, wasteTypeId: w.id })}
                className={`w-full text-left border rounded-lg p-4 ${
                  form.wasteTypeId === w.id ? 'border-green-600 bg-green-50' : ''
                }`}
              >
                <span className="font-medium">{w.nameKey}</span>
                <span className="float-right">{w.flatFeeMad} MAD</span>
              </button>
            ))}
            <button
              type="button"
              disabled={!form.wasteTypeId}
              onClick={() => setStep(2)}
              className="w-full bg-green-600 text-white py-2 rounded-lg disabled:opacity-50"
            >
              Continuer
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Adresse ({SERVICE_CITY})</p>
            {addresses.length === 0 ? (
              <p className="text-sm">
                <a href={`/${locale}/addresses`} className="text-green-600 underline">
                  Ajoutez une adresse
                </a>{' '}
                d&apos;abord.
              </p>
            ) : (
              addresses.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setForm({ ...form, addressId: a.id })}
                  className={`w-full text-left border rounded-lg p-4 ${
                    form.addressId === a.id ? 'border-green-600 bg-green-50' : ''
                  }`}
                >
                  {a.line1}
                </button>
              ))
            )}
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(1)} className="flex-1 border py-2 rounded-lg">
                Retour
              </button>
              <button
                type="button"
                disabled={!form.addressId}
                onClick={() => setStep(3)}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg disabled:opacity-50"
              >
                Continuer
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Date</label>
              <input
                type="date"
                required
                value={form.scheduledDate}
                onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm">Début</label>
                <input
                  type="time"
                  value={form.timeWindowStart}
                  onChange={(e) => setForm({ ...form, timeWindowStart: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="text-sm">Fin</label>
                <input
                  type="time"
                  value={form.timeWindowEnd}
                  onChange={(e) => setForm({ ...form, timeWindowEnd: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>
            {selectedWaste && (
              <p className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
                Total: <strong>{selectedWaste.flatFeeMad} MAD</strong> TTC
              </p>
            )}
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(2)} className="flex-1 border py-2 rounded-lg">
                Retour
              </button>
              <button
                type="button"
                disabled={loading || !form.scheduledDate}
                onClick={submit}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg disabled:opacity-50"
              >
                {loading ? '…' : 'Confirmer'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
