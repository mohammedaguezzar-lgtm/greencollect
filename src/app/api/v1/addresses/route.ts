import { jsonError, jsonSuccess } from '@/lib/api-response';
import { requireApiSession, isErrorResponse } from '@/lib/api-auth';
import { handleApiError } from '@/lib/handle-api-error';
import { toNumber } from '@/lib/serialize';
import { createAddressSchema } from '@/lib/validators/address';
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

export async function GET(req: Request) {
  const session = await requireApiSession();
  if (isErrorResponse(session)) return session;

  const { searchParams } = new URL(req.url);
  const userId =
    session.role === 'ADMIN' && searchParams.get('userId')
      ? searchParams.get('userId')!
      : session.id;

  try {
    const data = await addressService.listAddresses(userId);
    return jsonSuccess(data.map(formatAddress));
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: Request) {
  const session = await requireApiSession(['USER', 'ADMIN']);
  if (isErrorResponse(session)) return session;

  const body = createAddressSchema.safeParse(await req.json());
  if (!body.success) {
    return jsonError(400, 'VALIDATION_ERROR', 'Invalid input', body.error.flatten());
  }

  try {
    const data = await addressService.createAddress(session.id, body.data);
    return jsonSuccess(formatAddress(data), 201);
  } catch (e) {
    return handleApiError(e);
  }
}
