import { Request, Response } from 'express';
import { eloService } from '../services/elo.service';

export const leaderboardController = {
  async getLeaderboard(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const players = await eloService.getLeaderboard(limit);
      res.json({ players });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },
  async getUserRank(req: Request, res: Response) {
    try {
      const leaderboard = await eloService.getLeaderboard(1000);
      const rank = leaderboard.findIndex((u: any) => u.id === req.params.userId);
      if (rank === -1) { res.status(404).json({ error: 'User not found' }); return; }
      res.json({ rank: rank + 1 });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },
};