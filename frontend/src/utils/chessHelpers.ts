// src/utils/chessHelpers.ts — thin wrappers around chess.js for safe usage
import { Chess } from 'chess.js';
import type { Square, BoardPiece, ChessMove, Color } from '@/types/index';

/**
 * Create a fresh Chess instance. Pass a FEN to load mid-game state
 * (used on reconnect/replay). chess.js itself owns ALL move validation.
 */
export function createChess(fen?: string): Chess {
  return fen ? new Chess(fen) : new Chess();
}

/** Flatten chess.js .board() into a list of pieces with their squares. */
export function piecesFromChess(chess: Chess): BoardPiece[] {
  const board = chess.board();
  const pieces: BoardPiece[] = [];
  for (let r = 0; r < 8; r++) {
    const row = board[r];
    if (!row) continue;
    for (let f = 0; f < 8; f++) {
      const cell = row[f];
      if (cell) {
        pieces.push({ square: cell.square, type: cell.type, color: cell.color });
      }
    }
  }
  return pieces;
}

/** Squares reachable from `from` for the side to move. */
export function legalMovesFrom(chess: Chess, from: Square): ChessMove[] {
  const moves = chess.moves({ square: from, verbose: true });
  return moves.map((m) => ({
    from: m.from as Square,
    to: m.to as Square,
    promotion: m.promotion as ChessMove['promotion'],
    san: m.san,
    flags: m.flags,
    captured: m.captured,
    piece: m.piece,
    color: m.color,
  }));
}

/** True if at least one legal move from `from` ends at `to` (promotion ignored). */
export function isLegalDestination(chess: Chess, from: Square, to: Square): boolean {
  return legalMovesFrom(chess, from).some((m) => m.to === to);
}

/** True if the move requires a promotion choice (pawn reaching last rank). */
export function isPromotionMove(chess: Chess, from: Square, to: Square): boolean {
  const moves = legalMovesFrom(chess, from);
  return moves.some((m) => m.to === to && !!m.promotion);
}

/** Apply move; returns the resulting ChessMove or null if illegal. */
export function applyMove(
  chess: Chess,
  from: Square,
  to: Square,
  promotion?: ChessMove['promotion'],
): ChessMove | null {
  try {
    const result = chess.move({ from, to, promotion });
    if (!result) return null;
    return {
      from: result.from as Square,
      to: result.to as Square,
      promotion: result.promotion as ChessMove['promotion'],
      san: result.san,
      flags: result.flags,
      captured: result.captured,
      piece: result.piece,
      color: result.color,
    };
  } catch {
    return null;
  }
}

/** Returns the king's square for `color`, or null if missing (shouldn't happen). */
export function findKingSquare(chess: Chess, color: Color): Square | null {
  const pieces = piecesFromChess(chess);
  const k = pieces.find((p) => p.type === 'k' && p.color === color);
  return k?.square ?? null;
}

/** Game-over evaluation derived purely from chess.js. */
export function evaluateGameOver(chess: Chess): {
  isOver: boolean;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  isThreefold: boolean;
  isInsufficient: boolean;
} {
  return {
    isOver: chess.isGameOver(),
    isCheck: chess.inCheck(),
    isCheckmate: chess.isCheckmate(),
    isStalemate: chess.isStalemate(),
    isDraw: chess.isDraw(),
    isThreefold: chess.isThreefoldRepetition(),
    isInsufficient: chess.isInsufficientMaterial(),
  };
}

/** Square → [file 0..7, rank 0..7] where rank 0 is rank 1. */
export function squareToCoords(square: Square): [number, number] {
  const file = square.charCodeAt(0) - 'a'.charCodeAt(0);
  const rank = parseInt(square[1] as string, 10) - 1;
  return [file, rank];
}

export function coordsToSquare(file: number, rank: number): Square {
  const f = String.fromCharCode('a'.charCodeAt(0) + file);
  return (f + (rank + 1)) as Square;
}

/** Captured pieces for both sides derived from move history. */
export function capturedPieces(chess: Chess): { white: string[]; black: string[] } {
  // Pieces captured BY white (i.e. black pieces captured) and vice-versa
  const captured = { white: [] as string[], black: [] as string[] };
  for (const m of chess.history({ verbose: true })) {
    if (m.captured) {
      if (m.color === 'w') captured.white.push(m.captured);
      else captured.black.push(m.captured);
    }
  }
  return captured;
}

const PIECE_VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

/** +N material advantage for white, negative for black. */
export function materialAdvantage(chess: Chess): number {
  const cap = capturedPieces(chess);
  const whiteScore = cap.white.reduce((s, p) => s + (PIECE_VALUES[p] ?? 0), 0);
  const blackScore = cap.black.reduce((s, p) => s + (PIECE_VALUES[p] ?? 0), 0);
  return whiteScore - blackScore;
}
