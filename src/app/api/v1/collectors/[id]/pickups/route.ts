import { jsonList } from '@/lib/api-response';
import { requireApiSession, isErrorResponse } from '@/lib/api-auth';
import { handleApiError } from '@/lib/handle-api-error';
import { formatPickup } from '@/lib/format-pickup';
import * as pickupService from '@/server/pickups/service';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireApiSession(['COLLECTOR', 'DISPATCHER', 'ADMIN']);
  if (isErrorResponse(session)) return session;
  const { id } = await params;

  if (session.role === 'COLLECTOR' && session.id !== id) {
    return handleApiError(new Error('FORBIDDEN'));
  }

  const { searchParams } = new URL(req.url);
  const scheduledDate =
    searchParams.get('scheduledDate') ??
    new Date().toISOString().slice(0, 10);

  const collectorSession =
    session.role === 'COLLECTOR'
      ? session
      : { ...session, role: 'DISPATCHER' as const };

  try {
    const { data, total } = await pickupService.listPickups(collectorSession, {
      page: 1,
      pageSize: 100,
      collectorId: id,
      scheduledDate,
    });
    return jsonList(
      data.map((p) => formatPickup(p as Record<string, unknown>)),
      { page: 1, pageSize: 100, total },
    );
  } catch (e) {
    return handleApiError(e);
  }
}
