import { jsonError, jsonSuccess } from '@/lib/api-response';
import { requireApiSession, isErrorResponse } from '@/lib/api-auth';
import { handleApiError } from '@/lib/handle-api-error';
import { formatPickup } from '@/lib/format-pickup';
import { cancelPickupSchema } from '@/lib/validators/pickup';
import * as pickupService from '@/server/pickups/service';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireApiSession();
  if (isErrorResponse(session)) return session;
  const { id } = await params;
  try {
    const data = await pickupService.getPickup(id, session);
    return jsonSuccess(formatPickup(data as Record<string, unknown>));
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireApiSession();
  if (isErrorResponse(session)) return session;
  const { id } = await params;
  const body = cancelPickupSchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return jsonError(400, 'VALIDATION_ERROR', 'cancellationReason required');
  }
  try {
    const data = await pickupService.cancelPickup(id, session, body.data.cancellationReason);
    return jsonSuccess(formatPickup(data as Record<string, unknown>));
  } catch (e) {
    return handleApiError(e);
  }
}
