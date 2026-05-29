'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { LocaleSwitcher } from '@/components/layout/locale-switcher';

export default function RegisterPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? 'fr';

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [consent, setConsent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) {
      setError('Veuillez accepter la politique de confidentialité');
      return;
    }
    setLoading(true);
    setError('');
    const res = await fetch('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        phone: form.phone || undefined,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j?.error?.message ?? 'Registration failed');
      return;
    }
    router.push(`/${locale}/login?registered=1`);
  }

  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b px-6 py-4 flex justify-between items-center">
        <Link href={`/${locale}`} className="font-semibold text-green-600">
          GreenCollect
        </Link>
        <LocaleSwitcher />
      </header>
      <div className="flex-1 flex items-center justify-center p-6">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-md space-y-4 bg-white p-8 rounded-lg border shadow-sm"
        >
          <h1 className="text-2xl font-bold">Créer un compte</h1>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {['name', 'email', 'password'].map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium mb-1 capitalize">{field}</label>
              <input
                type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                required={field !== 'phone'}
                minLength={field === 'password' ? 8 : undefined}
                value={form[field as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium mb-1">Téléphone (+212…)</label>
            <input
              type="tel"
              placeholder="+212612345678"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <label className="flex items-start gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1"
            />
            <span>
              J&apos;accepte la{' '}
              <Link href={`/${locale}/legal/privacy`} className="text-green-600 underline">
                politique de confidentialité
              </Link>
            </span>
          </label>
          <button
            type="submit"
            disabled={loading || !consent}
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? '…' : "S'inscrire"}
          </button>
          <p className="text-sm text-center text-gray-600">
            Déjà inscrit ?{' '}
            <Link href={`/${locale}/login`} className="text-green-600 hover:underline">
              Connexion
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
