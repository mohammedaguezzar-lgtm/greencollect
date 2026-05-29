import { prisma } from '@/lib/db';
import type { CreateAddressInput, UpdateAddressInput } from '@/lib/validators/address';

export async function listAddresses(userId: string) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function createAddress(userId: string, input: CreateAddressInput) {
  return prisma.$transaction(async (tx) => {
    if (input.isDefault) {
      await tx.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const count = await tx.address.count({ where: { userId } });
    return tx.address.create({
      data: {
        userId,
        ...input,
        isDefault: input.isDefault ?? count === 0,
      },
    });
  });
}

export async function updateAddress(
  userId: string,
  addressId: string,
  input: UpdateAddressInput,
  isAdmin: boolean,
) {
  const address = await prisma.address.findFirst({
    where: isAdmin ? { id: addressId } : { id: addressId, userId },
  });
  if (!address) throw new Error('NOT_FOUND');

  return prisma.$transaction(async (tx) => {
    if (input.isDefault) {
      await tx.address.updateMany({
        where: { userId: address.userId },
        data: { isDefault: false },
      });
    }
    return tx.address.update({
      where: { id: addressId },
      data: input,
    });
  });
}

export async function deleteAddress(userId: string, addressId: string, isAdmin: boolean) {
  const address = await prisma.address.findFirst({
    where: isAdmin ? { id: addressId } : { id: addressId, userId },
  });
  if (!address) throw new Error('NOT_FOUND');

  const openPickups = await prisma.pickup.count({
    where: {
      addressId,
      status: { notIn: ['COMPLETED', 'CANCELLED', 'NO_SHOW'] },
    },
  });
  if (openPickups > 0) throw new Error('ADDRESS_IN_USE');

  await prisma.address.delete({ where: { id: addressId } });
}
