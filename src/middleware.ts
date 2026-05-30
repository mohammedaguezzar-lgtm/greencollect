import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { routing } from '@/i18n/routing';
import { getMiddlewareSession } from '@/lib/middleware-auth';

const intlMiddleware = createMiddleware(routing);

const roleHome: Record<string, string> = {
  USER: '/dashboard',
  COLLECTOR: '/collector/dashboard',
  DISPATCHER: '/dispatcher/dashboard',
  ADMIN: '/admin/dashboard',
};

const protectedPrefixes = [
  '/dashboard',
  '/pickups',
  '/addresses',
  '/collector',
  '/dispatcher',
  '/admin',
];

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const localeMatch = pathname.match(/^\/(fr|ar|en)(\/|$)/);
  const locale = localeMatch?.[1] ?? 'fr';
  const pathWithoutLocale = pathname.replace(/^\/(fr|ar|en)/, '') || '/';

  const isProtected = protectedPrefixes.some(
    (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(`${p}/`),
  );

  if (isProtected) {
    const session = await getMiddlewareSession(request);
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }
    if (session.user.status === 'SUSPENDED') {
      return NextResponse.redirect(new URL(`/${locale}/login?suspended=1`, request.url));
    }
    const role = session.user.role;
    if (pathWithoutLocale.startsWith('/admin') && role !== 'ADMIN') {
      return NextResponse.redirect(new URL(`/${locale}/unauthorized`, request.url));
    }
    if (pathWithoutLocale.startsWith('/dispatcher') && !['DISPATCHER', 'ADMIN'].includes(role)) {
      return NextResponse.redirect(new URL(`/${locale}/unauthorized`, request.url));
    }
    if (pathWithoutLocale.startsWith('/collector') && !['COLLECTOR', 'ADMIN'].includes(role)) {
      return NextResponse.redirect(new URL(`/${locale}/unauthorized`, request.url));
    }
  }

  if (pathWithoutLocale === '/login' || pathWithoutLocale === '/register') {
    const session = await getMiddlewareSession(request);
    if (session?.user?.role) {
      const home = roleHome[session.user.role] ?? '/dashboard';
      return NextResponse.redirect(new URL(`/${locale}${home}`, request.url));
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
