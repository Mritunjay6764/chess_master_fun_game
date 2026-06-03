import { z } from 'zod';
export const moveDto = z.object({
  gameId: z.string().uuid(),
  from: z.string().length(2),
  to: z.string().length(2),
  promotion: z.enum(['q','r','b','n']).optional(),
});
export type MoveDto = z.infer<typeof moveDto>;