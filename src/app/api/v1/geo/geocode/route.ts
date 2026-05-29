import { jsonError, jsonSuccess } from '@/lib/api-response';
import { requireApiSession, isErrorResponse } from '@/lib/api-auth';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import { geocodeQuery } from '@/server/geo/nominatim';
import { z } from 'zod';

const schema = z.object({ query: z.string().min(3).max(300) });

export async function POST(req: Request) {
  const session = await requireApiSession();
  if (isErrorResponse(session)) return session;

  const ip = getClientIp(req);
  const limited = await rateLimit(`geocode:${session.id}:${ip}`, 10, 60_000);
  if (!limited.ok) {
    return jsonError(429, 'RATE_LIMITED', 'Too many geocode requests');
  }

  const body = schema.safeParse(await req.json());
  if (!body.success) {
    return jsonError(400, 'VALIDATION_ERROR', 'Invalid query');
  }

  const result = await geocodeQuery(body.data.query);
  if (!result) {
    return jsonError(404, 'NOT_FOUND', 'No results in Morocco');
  }

  return jsonSuccess(result);
}
