import { jsonError, jsonSuccess } from '@/lib/api-response';
import { requireApiSession, isErrorResponse } from '@/lib/api-auth';
import { handleApiError } from '@/lib/handle-api-error';
import { formatPickup } from '@/lib/format-pickup';
import { assignPickupSchema } from '@/lib/validators/pickup';
import * as pickupService from '@/server/pickups/service';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireApiSession(['DISPATCHER', 'ADMIN']);
  if (isErrorResponse(session)) return session;
  const { id } = await params;
  const body = assignPickupSchema.safeParse(await req.json());
  if (!body.success) {
    return jsonError(400, 'VALIDATION_ERROR', 'Invalid input', body.error.flatten());
  }
  try {
    const data = await pickupService.assignPickup(
      id,
      session,
      body.data.assignedCollectorId,
      body.data.routeId,
    );
    return jsonSuccess(formatPickup(data as Record<string, unknown>));
  } catch (e) {
    return handleApiError(e);
  }
}
