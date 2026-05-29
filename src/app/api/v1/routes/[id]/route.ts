import { jsonError, jsonSuccess } from '@/lib/api-response';
import { requireApiSession, isErrorResponse } from '@/lib/api-auth';
import { handleApiError } from '@/lib/handle-api-error';
import { updateRouteSchema } from '@/lib/validators/route';
import * as routeService from '@/server/routes/service';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireApiSession(['COLLECTOR', 'DISPATCHER', 'ADMIN']);
  if (isErrorResponse(session)) return session;
  const { id } = await params;
  const body = updateRouteSchema.safeParse(await req.json());
  if (!body.success) {
    return jsonError(400, 'VALIDATION_ERROR', 'Invalid input', body.error.flatten());
  }
  try {
    const data = await routeService.updateRoute(id, session, body.data);
    return jsonSuccess(data);
  } catch (e) {
    return handleApiError(e);
  }
}
