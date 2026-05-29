import { jsonError, jsonSuccess } from '@/lib/api-response';
import { requireApiSession, isErrorResponse } from '@/lib/api-auth';
import { handleApiError } from '@/lib/handle-api-error';
import { toNumber } from '@/lib/serialize';
import { createPaymentSchema } from '@/lib/validators/payment';
import * as paymentService from '@/server/payments/service';
import * as pickupService from '@/server/pickups/service';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireApiSession();
  if (isErrorResponse(session)) return session;
  const { id } = await params;
  try {
    await pickupService.getPickup(id, session);
    const data = await paymentService.listPayments(id);
    return jsonSuccess(
      data.map((p) => ({ ...p, amountMad: toNumber(p.amountMad) })),
    );
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireApiSession(['USER', 'DISPATCHER', 'ADMIN']);
  if (isErrorResponse(session)) return session;
  const { id } = await params;
  const body = createPaymentSchema.safeParse(await req.json());
  if (!body.success) {
    return jsonError(400, 'VALIDATION_ERROR', 'Invalid input', body.error.flatten());
  }
  try {
    await pickupService.getPickup(id, session);
    const data = await paymentService.recordPayment(id, session.id, body.data);
    return jsonSuccess({ ...data, amountMad: toNumber(data.amountMad) }, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
