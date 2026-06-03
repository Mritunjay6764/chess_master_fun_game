import { Router } from 'express';
import authRoutes from './auth.routes';
import gameRoutes from './game.routes';
import leaderboardRoutes from './leaderboard.routes';
import aiRoutes from './ai.routes';
import userRoutes from './user.routes';

const router = Router();
router.use('/auth', authRoutes);
router.use('/game', gameRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/ai', aiRoutes);
router.use('/user', userRoutes);
router.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
export default router;