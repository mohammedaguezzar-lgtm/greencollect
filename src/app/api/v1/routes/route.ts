import { jsonError, jsonSuccess } from '@/lib/api-response';
import { requireApiSession, isErrorResponse } from '@/lib/api-auth';
import { handleApiError } from '@/lib/handle-api-error';
import { createRouteSchema } from '@/lib/validators/route';
import * as routeService from '@/server/routes/service';

export async function GET(req: Request) {
  const session = await requireApiSession(['COLLECTOR', 'DISPATCHER', 'ADMIN']);
  if (isErrorResponse(session)) return session;
  const date = new URL(req.url).searchParams.get('date') ?? undefined;
  try {
    const data = await routeService.listRoutes(session, date ?? undefined);
    return jsonSuccess(data);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: Request) {
  const session = await requireApiSession(['DISPATCHER', 'ADMIN']);
  if (isErrorResponse(session)) return session;
  const body = createRouteSchema.safeParse(await req.json());
  if (!body.success) {
    return jsonError(400, 'VALIDATION_ERROR', 'Invalid input', body.error.flatten());
  }
  try {
    const data = await routeService.createRoute(body.data);
    return jsonSuccess(data, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
