import { jsonSuccess } from '@/lib/api-response';
import { toNumber } from '@/lib/serialize';
import { prisma } from '@/lib/db';

export async function GET() {
  const data = await prisma.wasteType.findMany({
    where: { active: true },
    orderBy: { code: 'asc' },
  });
  return jsonSuccess(
    data.map((w) => ({
      ...w,
      flatFeeMad: toNumber(w.flatFeeMad),
      pricePerKgMad: toNumber(w.pricePerKgMad),
    })),
  );
}
