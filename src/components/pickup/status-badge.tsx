import { cn } from '@/lib/utils';
import type { PickupStatus } from '@prisma/client';

const styles: Record<PickupStatus, string> = {
  REQUESTED: 'bg-gray-100 text-gray-700',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  ASSIGNED: 'bg-indigo-100 text-indigo-800',
  EN_ROUTE: 'bg-amber-100 text-amber-800',
  ARRIVED: 'bg-orange-100 text-orange-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-600',
  NO_SHOW: 'bg-red-200 text-red-800',
};

export function PickupStatusBadge({
  status,
  label,
}: {
  status: PickupStatus;
  label: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        styles[status],
      )}
    >
      {label}
    </span>
  );
}
