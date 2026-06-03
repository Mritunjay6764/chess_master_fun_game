import { Chess, Square } from 'chess.js';

// FIX: captured is string|undefined (the piece letter), not boolean
export interface ChessMoveResult {
  valid: boolean;
  fen?: string;
  pgn?: string;
  san?: string;
  flags?: string;          // e.g. 'n', 'b', 'e', 'c', 'k', 'q'
  captured?: string;       // piece letter: 'p','r','n','b','q' or undefined
  check?: boolean;
  checkmate?: boolean;
  stalemate?: boolean;
  draw?: boolean;
}

export const validateMove = (
  fen: string,
  from: string,
  to: string,
  promotion?: string,
): ChessMoveResult => {
  const chess = new Chess(fen);
  const move: any = { from: from as Square, to: to as Square, promotion };
  try {
    const result = chess.move(move);
    if (!result) return { valid: false };
    return {
      valid: true,
      fen: chess.fen(),
      pgn: chess.pgn(),
      san: result.san,
      flags: result.flags,                      // string like 'nc'
      captured: result.captured ?? undefined,   // string piece letter or undefined
      check: chess.inCheck(),
      checkmate: chess.isCheckmate(),
      stalemate: chess.isStalemate(),
      draw: chess.isDraw(),
    };
  } catch {
    return { valid: false };
  }
};

export const getLegalMoves = (fen: string, square: string): string[] => {
  const chess = new Chess(fen);
  return chess
    .moves({ square: square as Square, verbose: true })
    .map((m: any) => m.to);
};

export const isGameOver = (
  fen: string,
): { over: boolean; result?: string } => {
  const chess = new Chess(fen);
  if (!chess.isGameOver()) return { over: false };
  if (chess.isCheckmate()) return { over: true, result: 'checkmate' };
  if (chess.isStalemate()) return { over: true, result: 'stalemate' };
  if (chess.isDraw())      return { over: true, result: 'draw' };
  return { over: true, result: 'game_over' };
};

export const getInitialFen = () =>
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
