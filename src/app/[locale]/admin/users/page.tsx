'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';

type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
};

export default function AdminUsersPage() {
  const params = useParams();
  const locale = (params?.locale as string) ?? 'fr';
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState({
    email: '',
    name: '',
    password: '',
    role: 'COLLECTOR',
  });
  const [msg, setMsg] = useState('');

  function load() {
    fetch('/api/v1/users?pageSize=50')
      .then((r) => r.json())
      .then((j) => setUsers(j.data ?? []));
  }

  useEffect(() => {
    load();
  }, []);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/v1/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      setMsg('Erreur création');
      return;
    }
    setMsg('Utilisateur créé');
    setForm({ email: '', name: '', password: '', role: 'COLLECTOR' });
    load();
  }

  async function patchUser(id: string, status: string) {
    await fetch(`/api/v1/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    load();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="flex justify-between">
          <h1 className="text-2xl font-bold">Utilisateurs</h1>
          <Link href={`/${locale}/admin/dashboard`} className="text-green-600 text-sm">
            ← Admin
          </Link>
        </div>

        <form onSubmit={createUser} className="bg-white border rounded-lg p-4 grid md:grid-cols-2 gap-3">
          <h2 className="md:col-span-2 font-semibold">Nouveau compte</h2>
          <input
            placeholder="E-mail"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="border rounded-lg px-3 py-2"
          />
          <input
            placeholder="Nom"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border rounded-lg px-3 py-2"
          />
          <input
            placeholder="Mot de passe"
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="border rounded-lg px-3 py-2"
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="border rounded-lg px-3 py-2"
          >
            <option value="USER">USER</option>
            <option value="COLLECTOR">COLLECTOR</option>
            <option value="DISPATCHER">DISPATCHER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <button type="submit" className="md:col-span-2 bg-green-600 text-white py-2 rounded-lg">
            Créer
          </button>
          {msg && <p className="md:col-span-2 text-sm text-gray-600">{msg}</p>}
        </form>

        <table className="w-full bg-white border rounded-lg text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              <th className="p-3">E-mail</th>
              <th className="p-3">Rôle</th>
              <th className="p-3">Statut</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b">
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.role}</td>
                <td className="p-3">{u.status}</td>
                <td className="p-3">
                  {u.status === 'ACTIVE' ? (
                    <button
                      type="button"
                      className="text-red-600"
                      onClick={() => patchUser(u.id, 'SUSPENDED')}
                    >
                      Suspendre
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="text-green-600"
                      onClick={() => patchUser(u.id, 'ACTIVE')}
                    >
                      Activer
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
