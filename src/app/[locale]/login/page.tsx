'use client';

import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Suspense, useState } from 'react';
import { LocaleSwitcher } from '@/components/layout/locale-switcher';

function LoginForm() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? 'fr';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError('Invalid email or password');
      return;
    }
    router.push(`/${locale}/dashboard`);
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-md space-y-4 bg-white p-8 rounded-lg border shadow-sm"
    >
      <h1 className="text-2xl font-bold">Connexion</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div>
        <label className="block text-sm font-medium mb-1">E-mail</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Mot de passe</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? '…' : 'Se connecter'}
      </button>
      <p className="text-sm text-center text-gray-600">
        Pas de compte ?{' '}
        <Link href={`/${locale}/register`} className="text-green-600 hover:underline">
          Créer un compte
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  const params = useParams();
  const locale = (params?.locale as string) ?? 'fr';

  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b px-6 py-4 flex justify-between items-center">
        <Link href={`/${locale}`} className="font-semibold text-green-600">
          GreenCollect
        </Link>
        <LocaleSwitcher />
      </header>
      <div className="flex-1 flex items-center justify-center p-6">
        <Suspense fallback={<p>…</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
