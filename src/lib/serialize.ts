import type { Decimal } from '@prisma/client/runtime/library';

export function toNumber(value: Decimal | number | null | undefined): number | null {
  if (value == null) return null;
  return typeof value === 'number' ? value : Number(value);
}

export function serializeDecimalFields<T extends Record<string, unknown>>(
  obj: T,
  fields: (keyof T)[],
): T {
  const out = { ...obj };
  for (const field of fields) {
    const v = out[field];
    if (v != null && typeof v === 'object' && 'toNumber' in (v as object)) {
      (out as Record<string, unknown>)[field as string] = Number(v);
    } else if (v != null) {
      (out as Record<string, unknown>)[field as string] = Number(v);
    }
  }
  return out;
}
