import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const userController = {
  async getStats(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          elo: true,
          wins: true,
          losses: true,
          draws: true,
          gamesPlayed: true,
        },
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Calculate average game length from recent games
      const recentGames = await prisma.game.findMany({
        where: {
          OR: [{ whitePlayerId: userId }, { blackPlayerId: userId }],
          status: { not: 'IN_PROGRESS' },
          completedAt: { not: null },
        },
        orderBy: { completedAt: 'desc' },
        take: 10,
      });

      let avgGameLengthMs = 0;
      if (recentGames.length > 0) {
        const totalDuration = recentGames.reduce((sum, game) => {
          const duration = game.completedAt && game.createdAt
            ? game.completedAt.getTime() - game.createdAt.getTime()
            : 0;
          return sum + duration;
        }, 0);
        avgGameLengthMs = Math.round(totalDuration / recentGames.length);
      }

      res.json({
        rating: user.elo,
        wins: user.wins,
        losses: user.losses,
        draws: user.draws,
        avgGameLengthMs,
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },

  async getUserById(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          elo: true,
          wins: true,
          losses: true,
          draws: true,
          gamesPlayed: true,
          createdAt: true,
        },
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },

  async updateProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { username, fcmToken } = req.body;

      const updateData: Record<string, any> = {};

      if (username) {
        // Check if username is taken
        const existing = await prisma.user.findFirst({
          where: { username, NOT: { id: userId } },
        });
        if (existing) {
          res.status(400).json({ error: 'Username already taken' });
          return;
        }
        updateData.username = username;
      }

      if (fcmToken) {
        updateData.fcmToken = fcmToken;
      }

      if (Object.keys(updateData).length === 0) {
        res.status(400).json({ error: 'No fields to update' });
        return;
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          username: true,
          elo: true,
          wins: true,
          losses: true,
          draws: true,
          gamesPlayed: true,
        },
      });

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },
};