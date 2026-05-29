import { jsonSuccess } from '@/lib/api-response';
import { requireApiSession, isErrorResponse } from '@/lib/api-auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await requireApiSession(['DISPATCHER', 'ADMIN']);
  if (isErrorResponse(session)) return session;

  const today = new Date();
  today.setUTCHours(12, 0, 0, 0);

  const collectors = await prisma.user.findMany({
    where: { role: 'COLLECTOR', status: 'ACTIVE' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      _count: {
        select: {
          pickupsAsCollector: {
            where: { scheduledDate: today },
          },
        },
      },
    },
  });

  return jsonSuccess(
    collectors.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      pickupsToday: c._count.pickupsAsCollector,
    })),
  );
}
