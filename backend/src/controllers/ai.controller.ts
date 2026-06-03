import { Request, Response } from 'express';
import { aiService } from '../services/ai.service';
import { Chess } from 'chess.js';

export const aiController = {
  async getBestMove(req: Request, res: Response) {
    try {
      const { fen, depth, skillLevel } = req.query;

      if (!fen || typeof fen !== 'string') {
        res.status(400).json({ error: 'FEN position required' });
        return;
      }

      // Validate FEN by trying to create a Chess instance
      let chess: Chess;
      try {
        chess = new Chess(fen);
      } catch {
        res.status(400).json({ error: 'Invalid FEN string' });
        return;
      }

      const move = await aiService.getBestMove(
        fen,
        depth ? parseInt(depth as string, 10) : 3,
        skillLevel ? parseInt(skillLevel as string, 10) : 5
      );

      if (!move) {
        res.status(400).json({ error: 'No move available' });
        return;
      }

      res.json(move);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },

  async getMoveSuggestions(req: Request, res: Response) {
    try {
      const { fen, count } = req.query;

      if (!fen || typeof fen !== 'string') {
        res.status(400).json({ error: 'FEN position required' });
        return;
      }

      let chess2: Chess;
      try {
        chess2 = new Chess(fen);
      } catch {
        res.status(400).json({ error: 'Invalid FEN string' });
        return;
      }

      const suggestions = await aiService.getMoveSuggestions(
        fen,
        count ? parseInt(count as string, 10) : 3
      );

      res.json({ suggestions });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },
};