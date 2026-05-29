import { toNumber } from '@/lib/serialize';

export function formatPickup<T extends Record<string, unknown>>(pickup: T): T {
  const p = { ...pickup } as Record<string, unknown>;
  if ('feeAmountMad' in p) p.feeAmountMad = toNumber(p.feeAmountMad as never);
  if ('estimatedWeightKg' in p && p.estimatedWeightKg != null) {
    p.estimatedWeightKg = toNumber(p.estimatedWeightKg as never);
  }
  if ('actualWeightKg' in p && p.actualWeightKg != null) {
    p.actualWeightKg = toNumber(p.actualWeightKg as never);
  }
  if ('address' in p && p.address && typeof p.address === 'object') {
    const a = p.address as Record<string, unknown>;
    p.address = {
      ...a,
      latitude: toNumber(a.latitude as never),
      longitude: toNumber(a.longitude as never),
    };
  }
  if ('wasteType' in p && p.wasteType && typeof p.wasteType === 'object') {
    const w = p.wasteType as Record<string, unknown>;
    p.wasteType = {
      ...w,
      flatFeeMad: toNumber(w.flatFeeMad as never),
    };
  }
  return p as T;
}
