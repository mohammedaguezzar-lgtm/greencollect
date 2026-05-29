import { prisma } from '@/lib/db';
import { WasteTypeCode } from '@prisma/client';

const CO2_FACTORS: Record<WasteTypeCode, number> = {
  PLASTIC: 2.0,
  PAPER: 1.5,
  METAL: 3.0,
  GLASS: 0.8,
  ELECTRONIC: 4.0,
  MIXED: 1.8,
};

function startOfDayCasablanca(date: Date): Date {
  return new Date(date.toISOString().slice(0, 10) + 'T00:00:00.000Z');
}

export async function getAdminStats() {
  const now = new Date();
  const today = startOfDayCasablanca(now);
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  const [
    pickupsToday,
    pickupsCompletedToday,
    pendingRequests,
    activeCollectors,
    paymentsToday,
  ] = await Promise.all([
    prisma.pickup.count({
      where: { scheduledDate: { gte: today, lt: tomorrow } },
    }),
    prisma.pickup.count({
      where: {
        status: 'COMPLETED',
        updatedAt: { gte: today, lt: tomorrow },
      },
    }),
    prisma.pickup.count({
      where: { status: { in: ['REQUESTED', 'CONFIRMED'] } },
    }),
    prisma.user.count({ where: { role: 'COLLECTOR', status: 'ACTIVE' } }),
    prisma.payment.aggregate({
      where: {
        status: 'PAID',
        createdAt: { gte: today, lt: tomorrow },
      },
      _sum: { amountMad: true },
    }),
  ]);

  return {
    pickupsToday,
    pickupsCompletedToday,
    pendingRequests,
    activeCollectors,
    revenueTodayMad: Number(paymentsToday._sum.amountMad ?? 0),
  };
}

export async function getAdminAnalytics(from: Date, to: Date) {
  const completed = await prisma.pickup.findMany({
    where: {
      status: 'COMPLETED',
      updatedAt: { gte: from, lte: to },
    },
    include: { wasteType: true },
  });

  let totalWeightKg = 0;
  let co2SavedKg = 0;
  let revenueMad = 0;

  for (const p of completed) {
    const weight = Number(p.actualWeightKg ?? p.estimatedWeightKg ?? 0);
    totalWeightKg += weight;
    co2SavedKg += weight * CO2_FACTORS[p.wasteType.code];
  }

  const payments = await prisma.payment.aggregate({
    where: { status: 'PAID', createdAt: { gte: from, lte: to } },
    _sum: { amountMad: true },
  });
  revenueMad = Number(payments._sum.amountMad ?? 0);

  const cancelled = await prisma.pickup.count({
    where: {
      status: { in: ['CANCELLED', 'NO_SHOW'] },
      updatedAt: { gte: from, lte: to },
    },
  });

  const completionRate =
    completed.length + cancelled > 0
      ? completed.length / (completed.length + cancelled)
      : 0;

  const byWasteType = Object.keys(CO2_FACTORS).map((code) => {
    const items = completed.filter((p) => p.wasteType.code === code);
    return {
      code,
      pickupsCompleted: items.length,
      totalWeightKg: items.reduce(
        (s, p) => s + Number(p.actualWeightKg ?? p.estimatedWeightKg ?? 0),
        0,
      ),
    };
  });

  return {
    summary: {
      pickupsCompleted: completed.length,
      totalWeightKg,
      revenueMad,
      co2SavedKg,
      completionRate,
    },
    byWasteType,
  };
}

export async function getUserImpact(userId: string) {
  const completed = await prisma.pickup.findMany({
    where: { customerId: userId, status: 'COMPLETED' },
    include: { wasteType: true },
  });

  let totalWeightKg = 0;
  let co2SavedKg = 0;
  for (const p of completed) {
    const weight = Number(p.actualWeightKg ?? p.estimatedWeightKg ?? 0);
    totalWeightKg += weight;
    co2SavedKg += weight * CO2_FACTORS[p.wasteType.code];
  }

  return {
    pickupsCompleted: completed.length,
    totalWeightKg,
    co2SavedKg,
  };
}
