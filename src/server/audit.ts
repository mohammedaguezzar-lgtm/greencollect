import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

export async function writeAuditLog(params: {
  actorId?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string;
}) {
  await prisma.auditLog.create({
    data: {
      actorId: params.actorId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata ?? undefined,
      ipAddress: params.ipAddress,
    },
  });
}
