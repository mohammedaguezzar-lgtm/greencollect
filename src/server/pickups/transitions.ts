import type { PickupStatus, UserRole } from '@prisma/client';

type TransitionKey = `${PickupStatus | 'null'}->${PickupStatus}`;

const transitions: Partial<Record<TransitionKey, UserRole[]>> = {
  'REQUESTED->CONFIRMED': ['DISPATCHER', 'ADMIN'],
  'REQUESTED->CANCELLED': ['USER', 'DISPATCHER', 'ADMIN'],
  'CONFIRMED->ASSIGNED': ['DISPATCHER', 'ADMIN'],
  'CONFIRMED->CANCELLED': ['USER', 'DISPATCHER', 'ADMIN'],
  'ASSIGNED->EN_ROUTE': ['COLLECTOR', 'ADMIN'],
  'EN_ROUTE->ARRIVED': ['COLLECTOR', 'ADMIN'],
  'ARRIVED->COMPLETED': ['COLLECTOR', 'ADMIN'],
  'ARRIVED->NO_SHOW': ['COLLECTOR', 'DISPATCHER', 'ADMIN'],
  'ASSIGNED->CANCELLED': ['DISPATCHER', 'ADMIN'],
};

export class InvalidStatusTransitionError extends Error {
  constructor(message = 'Invalid status transition') {
    super(message);
    this.name = 'InvalidStatusTransitionError';
  }
}

export function assertTransition(
  role: UserRole,
  from: PickupStatus,
  to: PickupStatus,
): void {
  const key = `${from}->${to}` as TransitionKey;
  const allowed = transitions[key];
  if (!allowed?.includes(role)) {
    throw new InvalidStatusTransitionError(
      `Role ${role} cannot transition ${from} → ${to}`,
    );
  }
}

export function isValidTransition(from: PickupStatus, to: PickupStatus): boolean {
  const key = `${from}->${to}` as TransitionKey;
  return key in transitions;
}
