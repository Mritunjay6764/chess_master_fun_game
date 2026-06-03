import { Request, Response } from 'express';
import { gameService } from '../services/game.service';
import { matchmakingService } from '../services/matchmaking.service';
import { createLogger } from '../utils/logger';

const logger = createLogger('game-controller');

export const gameController = {
  async test(req: Request, res: Response) {
    try {
      res.json({ success: true, message: 'Backend is reachable', timestamp: new Date().toISOString() });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },

  async joinQueue(req: Request, res: Response) {
    try {
      const userId   = (req as any).user!.userId;
      const { username, elo } = req.body;
      if (!username || elo === undefined) {
        res.status(400).json({ error: 'Missing username or elo' });
        return;
      }
      await matchmakingService.removeFromQueue(userId);
      const added = await matchmakingService.addToQueue({
        userId, username, elo, timestamp: Date.now(),
      });
      if (!added) { res.status(400).json({ error: 'Failed to join queue' }); return; }
      const position = await matchmakingService.getQueuePosition(userId);
      res.json({ message: 'Joined queue', position });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },

  async leaveQueue(req: Request, res: Response) {
    try {
      await matchmakingService.removeFromQueue((req as any).user!.userId);
      res.json({ message: 'Left queue' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },

  async getQueueStatus(req: Request, res: Response) {
    try {
      const queueLength = await matchmakingService.getQueueLength();
      const position    = req.query.userId
        ? await matchmakingService.getQueuePosition(req.query.userId as string)
        : -1;
      res.json({ queueLength, position });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },

  async getDashboard(req: Request, res: Response) {
    try {
      const windowHours = parseInt(req.query.windowHours as string, 10) || 34;
      const dashboard = await gameService.getDashboard(windowHours);
      res.json(dashboard);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },

  async getGame(req: Request, res: Response) {
    try {
      const session = await gameService.getGameSession(req.params.gameId);
      if (!session) { res.status(404).json({ error: 'Game not found' }); return; }
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },

  // FIX: makeMove no longer returns .session — just returns success/error
  async makeMove(req: Request, res: Response) {
    try {
      const result = await gameService.makeMove(
        req.params.gameId,
        (req as any).user!.userId,
        req.body.from,
        req.body.to,
        req.body.promotion,
      );
      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }
      // Return the updated session for REST clients
      const session = await gameService.getGameSession(req.params.gameId);
      res.json(session ?? { success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },

  async resign(req: Request, res: Response) {
    try {
      const result = await gameService.resign(req.params.gameId, (req as any).user!.userId);
      if (!result.success) { res.status(400).json({ error: result.error }); return; }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },

  async getHistory(req: Request, res: Response) {
    try {
      const history = await gameService.getGameHistory(
        (req as any).user!.userId,
        parseInt(req.query.limit  as string) || 20,
        parseInt(req.query.offset as string) || 0,
      );
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },

  async getActiveGame(req: Request, res: Response) {
    try {
      const session = await gameService.getActiveGame((req as any).user!.userId);
      if (!session) { res.status(404).json({ error: 'No active game' }); return; }
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },

  async getQueueDebug(req: Request, res: Response) {
    try {
      // FIX: method is getQueueInfo(), not getQueue()
      const queueInfo   = await matchmakingService.getQueueInfo();
      const queueLength = await matchmakingService.getQueueLength();
      res.json({
        queueLength,
        players: queueInfo.map(p => ({ userId: p.userId, username: p.username, elo: p.elo })),
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },
};
