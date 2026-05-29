import { jsonError, jsonSuccess } from '@/lib/api-response';
import { requireApiSession, isErrorResponse } from '@/lib/api-auth';
import { handleApiError } from '@/lib/handle-api-error';
import { toNumber } from '@/lib/serialize';
import { updateAddressSchema } from '@/lib/validators/address';
import * as addressService from '@/server/addresses/service';

function formatAddress(a: {
  latitude: unknown;
  longitude: unknown;
  [key: string]: unknown;
}) {
  return {
    ...a,
    latitude: toNumber(a.latitude as never),
    longitude: toNumber(a.longitude as never),
  };
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireApiSession(['USER', 'ADMIN']);
  if (isErrorResponse(session)) return session;
  const { id } = await params;
  const body = updateAddressSchema.safeParse(await req.json());
  if (!body.success) {
    return jsonError(400, 'VALIDATION_ERROR', 'Invalid input', body.error.flatten());
  }
  try {
    const data = await addressService.updateAddress(
      session.id,
      id,
      body.data,
      session.role === 'ADMIN',
    );
    return jsonSuccess(formatAddress(data));
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireApiSession(['USER', 'ADMIN']);
  if (isErrorResponse(session)) return session;
  const { id } = await params;
  try {
    await addressService.deleteAddress(session.id, id, session.role === 'ADMIN');
    return jsonSuccess({ deleted: true });
  } catch (e) {
    return handleApiError(e);
  }
}
