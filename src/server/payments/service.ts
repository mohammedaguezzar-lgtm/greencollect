import { prisma } from '@/lib/db';
import { writeAuditLog } from '@/server/audit';
import type { CreatePaymentInput } from '@/lib/validators/payment';

export async function recordPayment(
  pickupId: string,
  actorId: string,
  input: CreatePaymentInput,
) {
  const pickup = await prisma.pickup.findUnique({ where: { id: pickupId } });
  if (!pickup) throw new Error('NOT_FOUND');

  const payment = await prisma.$transaction(async (tx) => {
    const p = await tx.payment.create({
      data: {
        pickupId,
        amountMad: input.amountMad,
        provider: input.provider,
        status: 'PAID',
      },
    });

    await tx.pickup.update({
      where: { id: pickupId },
      data: { paymentStatus: 'PAID' },
    });

    return p;
  });

  await writeAuditLog({
    actorId,
    action: 'PAYMENT_RECORDED',
    entityType: 'Pickup',
    entityId: pickupId,
    metadata: { provider: input.provider, amountMad: input.amountMad },
  });

  return payment;
}

export async function listPayments(pickupId: string) {
  return prisma.payment.findMany({
    where: { pickupId },
    orderBy: { createdAt: 'desc' },
  });
}
