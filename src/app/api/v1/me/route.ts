import { jsonError, jsonSuccess } from '@/lib/api-response';
import { requireApiSession, isErrorResponse } from '@/lib/api-auth';
import { handleApiError } from '@/lib/handle-api-error';
import { updateMeSchema } from '@/lib/validators/user';
import * as userService from '@/server/users/service';

export async function GET() {
  const session = await requireApiSession();
  if (isErrorResponse(session)) return session;
  try {
    const data = await userService.getMe(session.id);
    return jsonSuccess(data);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PATCH(req: Request) {
  const session = await requireApiSession();
  if (isErrorResponse(session)) return session;
  const body = updateMeSchema.safeParse(await req.json());
  if (!body.success) {
    return jsonError(400, 'VALIDATION_ERROR', 'Invalid input', body.error.flatten());
  }
  try {
    const data = await userService.updateMe(session.id, body.data);
    return jsonSuccess(data);
  } catch (e) {
    return handleApiError(e);
  }
}
