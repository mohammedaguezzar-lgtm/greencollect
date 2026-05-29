import { jsonError, jsonList, jsonSuccess } from '@/lib/api-response';
import { requireApiSession, isErrorResponse } from '@/lib/api-auth';
import { handleApiError } from '@/lib/handle-api-error';
import { formatPickup } from '@/lib/format-pickup';
import { createPickupSchema } from '@/lib/validators/pickup';
import * as pickupService from '@/server/pickups/service';
import type { PickupStatus } from '@prisma/client';

export async function GET(req: Request) {
  const session = await requireApiSession();
  if (isErrorResponse(session)) return session;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const pageSize = Math.min(100, parseInt(searchParams.get('pageSize') ?? '20', 10));
  const status = searchParams.get('status') as PickupStatus | null;
  const scheduledDate = searchParams.get('scheduledDate') ?? undefined;
  const collectorId = searchParams.get('collectorId') ?? undefined;

  try {
    const { data, total } = await pickupService.listPickups(session, {
      page,
      pageSize,
      status: status ?? undefined,
      scheduledDate,
      collectorId,
    });
    return jsonList(
      data.map((p) => formatPickup(p as Record<string, unknown>)),
      { page, pageSize, total },
    );
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: Request) {
  const session = await requireApiSession(['USER', 'ADMIN']);
  if (isErrorResponse(session)) return session;

  const body = createPickupSchema.safeParse(await req.json());
  if (!body.success) {
    return jsonError(400, 'VALIDATION_ERROR', 'Invalid input', body.error.flatten());
  }

  try {
    const data = await pickupService.createPickup(session.id, body.data);
    return jsonSuccess(formatPickup(data as Record<string, unknown>), 201);
  } catch (e) {
    return handleApiError(e);
  }
}
