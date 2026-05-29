'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

export function AppHeader() {
  const params = useParams();
  const locale = (params?.locale as string) ?? 'fr';
  const { data: session } = useSession();

  return (
    <header className="border-b bg-white px-6 py-4 flex justify-between items-center">
      <Link href={`/${locale}/dashboard`} className="font-semibold text-green-600 text-xl">
        GreenCollect
      </Link>
      <div className="flex items-center gap-4 text-sm">
        {session?.user && (
          <>
            <span className="text-gray-600 hidden sm:inline">{session.user.email}</span>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: `/${locale}` })}
              className="text-gray-600 hover:text-gray-900"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
}
