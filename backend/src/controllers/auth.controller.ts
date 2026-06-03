import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { createLogger } from '../utils/logger';
const logger = createLogger('auth-controller');

export const authController = {
  async register(req: Request, res: Response) {
    try { const result = await authService.register(req.body); res.status(201).json(result); }
    catch (error) { logger.error('Registration failed', { error: (error as Error).message }); res.status(400).json({ error: (error as Error).message }); }
  },

  async login(req: Request, res: Response) {
    try { const result = await authService.login(req.body); res.json(result); }
    catch (error) { logger.error('Login failed', { error: (error as Error).message }); res.status(401).json({ error: (error as Error).message }); }
  },

  async getProfile(req: Request, res: Response) {
    try { const user = await authService.getProfile((req as any).user!.userId); res.json(user); }
    catch (error) { logger.error('Get profile failed', { error: (error as Error).message }); res.status(404).json({ error: (error as Error).message }); }
  },

  async logout(req: Request, res: Response) {
    logger.info('User logged out', { userId: (req as any).user?.userId });
    res.json({ success: true, message: 'Logged out successfully' });
  },
};