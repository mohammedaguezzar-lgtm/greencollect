import { jsonError, jsonSuccess } from '@/lib/api-response';
import { requireApiSession, isErrorResponse } from '@/lib/api-auth';
import { getAdminAnalytics } from '@/server/analytics/service';

export async function GET(req: Request) {
  const session = await requireApiSession(['ADMIN']);
  if (isErrorResponse(session)) return session;

  const { searchParams } = new URL(req.url);
  const fromStr = searchParams.get('from');
  const toStr = searchParams.get('to');
  if (!fromStr || !toStr) {
    return jsonError(400, 'VALIDATION_ERROR', 'from and to query params required');
  }

  const from = new Date(fromStr + 'T00:00:00.000Z');
  const to = new Date(toStr + 'T23:59:59.999Z');
  const data = await getAdminAnalytics(from, to);
  return jsonSuccess(data);
}
