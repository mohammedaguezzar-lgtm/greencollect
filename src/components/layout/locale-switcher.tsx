'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';

const locales = ['fr', 'ar', 'en'] as const;

export function LocaleSwitcher() {
  const pathname = usePathname();
  const params = useParams();
  const current = (params?.locale as string) ?? 'fr';

  return (
    <div className="flex gap-2 text-sm">
      {locales.map((loc) => {
        const href = pathname.replace(`/${current}`, `/${loc}`);
        return (
          <Link
            key={loc}
            href={href}
            className={
              loc === current
                ? 'font-semibold text-green-600'
                : 'text-gray-500 hover:text-gray-800'
            }
          >
            {loc.toUpperCase()}
          </Link>
        );
      })}
    </div>
  );
}
