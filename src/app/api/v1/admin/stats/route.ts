import { jsonSuccess } from '@/lib/api-response';
import { requireApiSession, isErrorResponse } from '@/lib/api-auth';
import { getAdminStats } from '@/server/analytics/service';

export async function GET() {
  const session = await requireApiSession(['DISPATCHER', 'ADMIN']);
  if (isErrorResponse(session)) return session;
  const data = await getAdminStats();
  return jsonSuccess(data);
}
