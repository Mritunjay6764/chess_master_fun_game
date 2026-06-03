import { z } from 'zod';
export const registerDto = z.object({
  email: z.string().email('Invalid email'),
  username: z.string().min(3).max(20),
  password: z.string().min(6),
});
export type RegisterDto = z.infer<typeof registerDto>;