import { Router } from 'express';
import { leaderboardController } from '../controllers/leaderboard.controller';
const router = Router();
router.get('/', leaderboardController.getLeaderboard);
router.get('/rank/:userId', leaderboardController.getUserRank);
export default router;