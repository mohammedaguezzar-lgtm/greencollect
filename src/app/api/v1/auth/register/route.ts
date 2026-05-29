import { jsonError, jsonSuccess } from '@/lib/api-response';
import { handleApiError } from '@/lib/handle-api-error';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import * as userService from '@/server/users/service';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
  phone: z
    .string()
    .regex(/^\+212[5-7]\d{8}$/)
    .optional(),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const limited = await rateLimit(`register:${ip}`, 5, 15 * 60_000);
  if (!limited.ok) {
    return jsonError(429, 'RATE_LIMITED', 'Too many registration attempts');
  }

  const body = registerSchema.safeParse(await req.json());
  if (!body.success) {
    return jsonError(400, 'VALIDATION_ERROR', 'Invalid input', body.error.flatten());
  }
  try {
    const data = await userService.registerUser(body.data);
    return jsonSuccess(data, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
