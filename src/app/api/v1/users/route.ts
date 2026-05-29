import { jsonError, jsonList, jsonSuccess } from '@/lib/api-response';
import { requireApiSession, isErrorResponse } from '@/lib/api-auth';
import { handleApiError } from '@/lib/handle-api-error';
import { adminCreateUserSchema } from '@/lib/validators/user';
import * as userService from '@/server/users/service';
import type { UserRole } from '@prisma/client';

export async function GET(req: Request) {
  const session = await requireApiSession(['DISPATCHER', 'ADMIN']);
  if (isErrorResponse(session)) return session;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const pageSize = Math.min(100, parseInt(searchParams.get('pageSize') ?? '20', 10));
  const role = searchParams.get('role') as UserRole | null;
  const search = searchParams.get('search') ?? undefined;

  try {
    const { data, total } = await userService.listUsers({
      page,
      pageSize,
      role: role ?? undefined,
      search,
    });
    return jsonList(data, { page, pageSize, total });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: Request) {
  const session = await requireApiSession(['ADMIN']);
  if (isErrorResponse(session)) return session;

  const body = adminCreateUserSchema.safeParse(await req.json());
  if (!body.success) {
    return jsonError(400, 'VALIDATION_ERROR', 'Invalid input', body.error.flatten());
  }

  try {
    const data = await userService.adminCreateUser(body.data);
    return jsonSuccess(data, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
