import { jsonError } from '@/lib/api-response';
import { PermissionError } from '@/lib/permissions';
import { InvalidStatusTransitionError } from '@/server/pickups/transitions';

export function handleApiError(err: unknown): Response {
  if (err instanceof PermissionError) {
    return jsonError(403, err.code, err.message);
  }
  if (err instanceof InvalidStatusTransitionError) {
    return jsonError(409, 'INVALID_STATUS_TRANSITION', err.message);
  }
  if (err instanceof Error) {
    const map: Record<string, [number, string]> = {
      NOT_FOUND: [404, 'NOT_FOUND'],
      ADDRESS_NOT_FOUND: [404, 'NOT_FOUND'],
      WASTE_TYPE_NOT_FOUND: [404, 'NOT_FOUND'],
      COLLECTOR_NOT_FOUND: [404, 'NOT_FOUND'],
      VALIDATION_ERROR: [400, 'VALIDATION_ERROR'],
      INVALID_DATE: [400, 'VALIDATION_ERROR'],
      WEIGHT_REQUIRED: [400, 'VALIDATION_ERROR'],
      ADDRESS_IN_USE: [409, 'ADDRESS_IN_USE'],
      EMAIL_EXISTS: [409, 'EMAIL_EXISTS'],
      FORBIDDEN: [403, 'FORBIDDEN'],
    };
    const entry = map[err.message];
    if (entry) return jsonError(entry[0], entry[1], err.message);
  }
  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  } else {
    console.error('[api-error]', err instanceof Error ? err.name : 'UnknownError');
  }
  return jsonError(500, 'INTERNAL_ERROR', 'Internal server error');
}
