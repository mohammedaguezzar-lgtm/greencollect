import { jsonError, jsonSuccess } from '@/lib/api-response';
import { requireApiSession, isErrorResponse } from '@/lib/api-auth';
import { handleApiError } from '@/lib/handle-api-error';
import { adminUpdateUserSchema } from '@/lib/validators/user';
import { writeAuditLog } from '@/server/audit';
import * as userService from '@/server/users/service';
import { prisma } from '@/lib/db';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireApiSession(['DISPATCHER', 'ADMIN']);
  if (isErrorResponse(session)) return session;
  const { id } = await params;
  try {
    const data = await prisma.user.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        locale: true,
        createdAt: true,
      },
    });
    return jsonSuccess(data);
  } catch {
    return jsonError(404, 'NOT_FOUND', 'User not found');
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireApiSession(['ADMIN']);
  if (isErrorResponse(session)) return session;
  const { id } = await params;
  const body = adminUpdateUserSchema.safeParse(await req.json());
  if (!body.success) {
    return jsonError(400, 'VALIDATION_ERROR', 'Invalid input', body.error.flatten());
  }
  try {
    const data = await userService.adminUpdateUser(id, body.data);
    const action =
      body.data.status === 'SUSPENDED'
        ? 'USER_SUSPENDED'
        : body.data.status === 'ACTIVE'
          ? 'USER_ACTIVATED'
          : 'USER_UPDATED';

    await writeAuditLog({
      actorId: session.id,
      action,
      entityType: 'User',
      entityId: id,
      metadata: body.data,
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
    });
    return jsonSuccess(data);
  } catch (e) {
    return handleApiError(e);
  }
}
