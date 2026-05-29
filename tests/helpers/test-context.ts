import type { UserRole, UserStatus } from '@prisma/client';
import { prisma } from '@/lib/db';

export type SeedContext = {
  user: { id: string; email: string };
  dispatcher: { id: string; email: string };
  collector: { id: string; email: string };
  admin: { id: string; email: string };
  addressId: string;
  wasteTypeId: string;
};

/** True when DATABASE_URL is set (CI and local Docker). */
export function shouldRunIntegrationTests(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export async function verifyDatabaseConnection(): Promise<boolean> {
  if (!process.env.DATABASE_URL) return false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export async function loadSeedContext(): Promise<SeedContext> {
  const [user, dispatcher, collector, admin, plastic] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { email: 'user1@greencollect.ma' } }),
    prisma.user.findUniqueOrThrow({ where: { email: 'dispatcher@greencollect.ma' } }),
    prisma.user.findUniqueOrThrow({ where: { email: 'collector1@greencollect.ma' } }),
    prisma.user.findUniqueOrThrow({ where: { email: 'admin@greencollect.ma' } }),
    prisma.wasteType.findUniqueOrThrow({ where: { code: 'PLASTIC' } }),
  ]);

  const address = await prisma.address.findFirst({
    where: { userId: user.id },
    orderBy: { isDefault: 'desc' },
  });
  if (!address) throw new Error('Seed address missing — run npm run db:seed');

  return {
    user: { id: user.id, email: user.email },
    dispatcher: { id: dispatcher.id, email: dispatcher.email },
    collector: { id: collector.id, email: collector.email },
    admin: { id: admin.id, email: admin.email },
    addressId: address.id,
    wasteTypeId: plastic.id,
  };
}

export function mockAuthSession(user: {
  id: string;
  email: string;
  role: UserRole;
  status?: UserStatus;
}) {
  return {
    user: {
      id: user.id,
      email: user.email,
      name: 'Test',
      role: user.role,
      status: user.status ?? 'ACTIVE',
      locale: 'fr' as const,
    },
  };
}

export async function parseJsonResponse<T = unknown>(res: Response): Promise<{
  status: number;
  body: T;
}> {
  const body = (await res.json()) as T;
  return { status: res.status, body };
}

/** Remove pickups created during a test (by notes marker). */
export async function cleanupTestPickups(marker: string) {
  await prisma.pickup.deleteMany({
    where: { notes: { contains: marker } },
  });
}
