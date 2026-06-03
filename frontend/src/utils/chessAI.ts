// src/utils/chessAI.ts — Local chess AI using minimax with alpha-beta pruning
import { Chess } from 'chess.js';
import type { Square, ChessMove } from '@/types/index';

// Piece values for evaluation
const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Position tables for pieces (simplified from established chess engines)
const PAWN_TABLE = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5, 5, 10, 25, 25, 10, 5, 5],
  [0, 0, 0, 20, 20, 0, 0, 0],
  [5, -5, -10, 0, 0, -10, -5, 5],
  [10, 10, 20, -20, -20, 20, 10, 10],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

const KNIGHT_TABLE = [
  [-50, -40, -30, -30, -30, -30, -40, -50],
  [-40, -20, 0, 0, 0, 0, -20, -40],
  [-30, 0, 10, 15, 15, 10, 0, -30],
  [-30, 5, 15, 20, 20, 15, 5, -30],
  [-30, 0, 15, 20, 20, 15, 0, -30],
  [-30, 5, 10, 15, 15, 10, 5, -30],
  [-40, -20, 0, 5, 5, 0, -20, -40],
  [-50, -40, -30, -30, -30, -30, -40, -50],
];

const BISHOP_TABLE = [
  [-20, -10, -10, -10, -10, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 5, 10, 10, 5, 0, -10],
  [-10, 5, 5, 10, 10, 5, 5, -10],
  [-10, 0, 10, 10, 10, 10, 0, -10],
  [-10, 10, 10, 10, 10, 10, 10, -10],
  [-10, 5, 0, 0, 0, 0, 5, -10],
  [-20, -10, -10, -10, -10, -10, -10, -20],
];

const ROOK_TABLE = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [5, 10, 10, 10, 10, 10, 10, 5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [0, 0, 0, 5, 5, 0, 0, 0],
];

const QUEEN_TABLE = [
  [-20, -10, -10, -5, -5, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 5, 5, 5, 5, 0, -10],
  [-5, 0, 5, 5, 5, 5, 0, -5],
  [0, 0, 5, 5, 5, 5, 0, -5],
  [-10, 5, 5, 5, 5, 5, 0, -10],
  [-10, 0, 5, 0, 0, 0, 0, -10],
  [-20, -10, -10, -5, -5, -10, -10, -20],
];

const KING_TABLE = [
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-20, -30, -30, -40, -40, -30, -30, -20],
  [-10, -20, -20, -20, -20, -20, -20, -10],
  [20, 20, 0, 0, 0, 0, 20, 20],
  [20, 30, 10, 0, 0, 10, 30, 20],
];

function getTable(type: string): number[][] {
  switch (type) {
    case 'p': return PAWN_TABLE;
    case 'n': return KNIGHT_TABLE;
    case 'b': return BISHOP_TABLE;
    case 'r': return ROOK_TABLE;
    case 'q': return QUEEN_TABLE;
    case 'k': return KING_TABLE;
    default: return [];
  }
}

function squareToCoords(sq: Square): { file: number; rank: number } {
  const file = sq.charCodeAt(0) - 97; // 'a' = 0
  const rank = 8 - parseInt(sq[1], 10); // '8' = 0
  return { file, rank };
}

function evaluatePosition(chess: Chess): number {
  const board = chess.board();
  let score = 0;

  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const piece = board[r]?.[f];
      if (!piece) continue;

      const value = PIECE_VALUES[piece.type] || 0;
      const table = getTable(piece.type);

      if (table.length > 0) {
        const { file, rank } = squareToCoords((piece.square || '') as Square);
        const tableValue = table[rank]?.[file] || 0;
        score += piece.color === 'w' ? value + tableValue : -(value + tableValue);
      } else {
        score += piece.color === 'w' ? value : -value;
      }
    }
  }

  // Bonus for castling rights — use FEN since chess.js 1.x has no .castling() method
  const fen = chess.fen();
  const castling = fen.split(' ')[2] ?? '-';
  if (castling.includes('k')) score += 15;
  if (castling.includes('q')) score += 15;
  if (castling.includes('K')) score -= 15;
  if (castling.includes('Q')) score -= 15;

  // Penalty for exposed king (whose turn it is when in check)
  if (chess.inCheck()) score += chess.turn() === 'b' ? -50 : 50;

  return score;
}

function isDraw(chess: Chess): boolean {
  return chess.isStalemate() || chess.isThreefoldRepetition() || chess.isDraw();
}

function minimax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): number {
  if (depth === 0 || chess.isGameOver()) {
    return evaluatePosition(chess);
  }

  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) {
    return evaluatePosition(chess);
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      chess.move(move);
      const evalScore = minimax(chess, depth - 1, alpha, beta, false);
      chess.undo();
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      chess.move(move);
      const evalScore = minimax(chess, depth - 1, alpha, beta, true);
      chess.undo();
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

export function getBestMove(fen: string, difficulty: number = 5): ChessMove | null {
  const chess = new Chess(fen);

  // Depth based on difficulty (1-10)
  const depth = Math.max(1, Math.min(difficulty === 1 ? 1 : difficulty < 4 ? 2 : difficulty < 7 ? 3 : 4, 4));

  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) return null;

  let bestMove: typeof moves[0] | null = null;
  let bestScore = chess.turn() === 'w' ? -Infinity : Infinity;
  const isMaximizing = chess.turn() === 'w';

  // For higher difficulties, search more moves
  const searchMoves = difficulty > 5 ? moves : moves.slice(0, 10);

  for (const move of searchMoves) {
    chess.move(move);
    const score = minimax(chess, depth - 1, -Infinity, Infinity, !isMaximizing);
    chess.undo();

    if (isMaximizing) {
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    } else {
      if (score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
  }

  if (!bestMove) return null;

  return {
    from: bestMove.from as Square,
    to: bestMove.to as Square,
    promotion: bestMove.promotion as ChessMove['promotion'],
    san: bestMove.san,
    flags: bestMove.flags,
    captured: bestMove.captured,
    piece: bestMove.piece,
    color: bestMove.color,
  };
}