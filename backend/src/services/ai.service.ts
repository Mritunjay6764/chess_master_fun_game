import { Chess, Move } from 'chess.js';
import { createLogger } from '../utils/logger';

const logger = createLogger('ai-service');

const PIECE_VALUES: Record<string, number> = {
  p: 10, n: 30, b: 30, r: 50, q: 90, k: 900,
  P: -10, N: -30, B: -30, R: -50, Q: -90, K: -900,
};

// FIX TS2353: return type now includes optional promotion field
export interface AIMove {
  from: string;
  to: string;
  promotion?: string;
  evaluation: number;
}

class AIService {
  async getBestMove(fen: string, depth = 3, skillLevel = 5): Promise<AIMove | null> {
    const chess = new Chess(fen);
    if (chess.isGameOver()) return null;

    try {
      const moves = chess.moves({ verbose: true }) as Move[];
      if (moves.length === 0) return null;

      const actualDepth = Math.min(depth, Math.max(1, Math.floor(skillLevel / 2)));
      let bestMove: Move | null = null;
      let bestValue = -Infinity;

      for (const move of moves) {
        chess.move(move);
        const val = this.minimax(chess, actualDepth - 1, -Infinity, Infinity, false);
        chess.undo();
        if (val > bestValue) {
          bestValue = val;
          bestMove = move;
        }
      }

      if (bestMove) {
        // TS2353 FIX: spread only defined fields — promotion is optional in return type
        const result: AIMove = { from: bestMove.from, to: bestMove.to, evaluation: bestValue };
        if (bestMove.promotion) result.promotion = bestMove.promotion;
        return result;
      }

      // Fallback: random move
      const rand = moves[Math.floor(Math.random() * moves.length)];
      return { from: rand.from, to: rand.to, evaluation: 0 };
    } catch (error) {
      logger.error('getBestMove error', { error: (error as Error).message });
      return null;
    }
  }

  async getMoveSuggestions(
    fen: string,
    count = 3,
  ): Promise<Array<{ from: string; to: string; evaluation: number; variation: string }>> {
    const chess = new Chess(fen);
    if (chess.isGameOver()) return [];

    try {
      const moves = chess.moves({ verbose: true }) as Move[];
      const scored = moves.map(m => {
        chess.move(m);
        const evaluation = this.evaluateBoard(chess);
        chess.undo();
        return { from: m.from, to: m.to, evaluation, variation: m.san };
      });
      const turn = chess.turn();
      scored.sort((a, b) => (turn === 'w' ? b.evaluation - a.evaluation : a.evaluation - b.evaluation));
      return scored.slice(0, count);
    } catch (error) {
      logger.error('getMoveSuggestions error', { error: (error as Error).message });
      return [];
    }
  }

  private minimax(chess: Chess, depth: number, alpha: number, beta: number, isMax: boolean): number {
    if (depth === 0 || chess.isGameOver()) return this.evaluateBoard(chess);
    const moves = chess.moves({ verbose: true }) as Move[];
    if (moves.length === 0) return this.evaluateBoard(chess);

    if (isMax) {
      let best = -Infinity;
      for (const m of moves) {
        chess.move(m); const v = this.minimax(chess, depth - 1, alpha, beta, false); chess.undo();
        best = Math.max(best, v); alpha = Math.max(alpha, v);
        if (beta <= alpha) break;
      }
      return best;
    } else {
      let best = Infinity;
      for (const m of moves) {
        chess.move(m); const v = this.minimax(chess, depth - 1, alpha, beta, true); chess.undo();
        best = Math.min(best, v); beta = Math.min(beta, v);
        if (beta <= alpha) break;
      }
      return best;
    }
  }

  private evaluateBoard(chess: Chess): number {
    let score = 0;
    const board = chess.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p) {
          const key = p.color === 'w' ? p.type : p.type.toUpperCase();
          score += PIECE_VALUES[key] ?? 0;
        }
      }
    }
    if (chess.inCheck()) score += chess.turn() === 'w' ? -50 : 50;
    return score;
  }
}

export const aiService = new AIService();
