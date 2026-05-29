import { jsonError, jsonSuccess } from '@/lib/api-response';
import { requireApiSession, isErrorResponse } from '@/lib/api-auth';
import { handleApiError } from '@/lib/handle-api-error';
import { toNumber } from '@/lib/serialize';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const patchSchema = z.object({
  flatFeeMad: z.number().positive().optional(),
  active: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireApiSession(['ADMIN']);
  if (isErrorResponse(session)) return session;
  const { id } = await params;
  const body = patchSchema.safeParse(await req.json());
  if (!body.success) {
    return jsonError(400, 'VALIDATION_ERROR', 'Invalid input', body.error.flatten());
  }
  try {
    const data = await prisma.wasteType.update({
      where: { id },
      data: body.data,
    });
    return jsonSuccess({
      ...data,
      flatFeeMad: toNumber(data.flatFeeMad),
      pricePerKgMad: toNumber(data.pricePerKgMad),
    });
  } catch {
    return jsonError(404, 'NOT_FOUND', 'Waste type not found');
  }
}
