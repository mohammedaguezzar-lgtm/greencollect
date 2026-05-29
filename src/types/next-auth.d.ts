import type { Locale, UserRole, UserStatus } from '@prisma/client';
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: UserRole;
      status: UserStatus;
      locale: Locale;
    };
  }

  interface User {
    role: UserRole;
    status: UserStatus;
    locale: Locale;
  }
}
