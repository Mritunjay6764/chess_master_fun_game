// src/hooks/useChessGame.ts — owns the chess.js instance; reinitialises on matchId change
//
// BUG-1 FIX: re-creates the Chess instance whenever the matchId changes, so a
// stale game can never bleed into a new one.
// BUG-3 FIX: board state is ALWAYS read from chess.board() — we never store
// piece positions in component state separately.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import {
  applyMove,
  capturedPieces,
  createChess,
  evaluateGameOver,
  findKingSquare,
  isLegalDestination,
  isPromotionMove,
  legalMovesFrom,
  materialAdvantage,
  piecesFromChess,
} from '@utils/chessHelpers';
import type { BoardPiece, ChessMove, Color, Square } from '@/types/index';

interface UseChessGameArgs {
  matchId: string | null;
  initialFen?: string;
  /** Replay every move from this list against a fresh instance (used after reconnect). */
  initialMoves?: ChessMove[];
}

export interface UseChessGameResult {
  chess: Chess;
  fen: string;
  pieces: BoardPiece[];
  turn: Color;
  history: ChessMove[];
  selectedSquare: Square | null;
  legalTargets: Square[];
  legalMoves: ChessMove[];
  pendingPromotion: { from: Square; to: Square } | null;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  isGameOver: boolean;
  checkSquare: Square | null;
  material: number;
  captured: { white: string[]; black: string[] };

  selectSquare: (sq: Square | null) => void;
  /** Attempt to move; returns the applied move (with san) or null. */
  tryMove: (from: Square, to: Square, promotion?: ChessMove['promotion']) => ChessMove | null;
  /** Apply a remote move authoritatively (no validation choice). Used on socket events. */
  applyRemote: (move: ChessMove) => ChessMove | null;
  /** Cancel an in-progress promotion choice. */
  cancelPromotion: () => void;
  /** Force a full reload from FEN — used on rejoin/state_sync. */
  loadFen: (fen: string, moves?: ChessMove[]) => void;
}

export function useChessGame({
  matchId,
  initialFen,
  initialMoves,
}: UseChessGameArgs): UseChessGameResult {
  const chessRef = useRef<Chess>(createChess(initialFen));
  // We bump this version counter to force re-derived memos when chess mutates.
  const [version, bump] = useState(0);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: Square;
    to: Square;
  } | null>(null);

  // BUG-1 FIX: full re-init on match change
  useEffect(() => {
    chessRef.current = createChess(initialFen);
    if (initialMoves && initialMoves.length) {
      for (const m of initialMoves) {
        chessRef.current.move({ from: m.from, to: m.to, promotion: m.promotion });
      }
    }
    setSelectedSquare(null);
    setPendingPromotion(null);
    bump((v) => v + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  const loadFen = useCallback((fen: string, moves?: ChessMove[]) => {
    chessRef.current = createChess(fen);
    if (moves) {
      // chess.js with FEN already at current position — only replay if no FEN was given
    }
    setSelectedSquare(null);
    setPendingPromotion(null);
    bump((v) => v + 1);
  }, []);

  const tryMove = useCallback<UseChessGameResult['tryMove']>((from, to, promotion) => {
    const chess = chessRef.current;
    if (!isLegalDestination(chess, from, to)) return null;
    // Promotion required but not provided yet → set pending and bail
    if (!promotion && isPromotionMove(chess, from, to)) {
      setPendingPromotion({ from, to });
      return null;
    }
    const result = applyMove(chess, from, to, promotion);
    if (result) {
      setSelectedSquare(null);
      setPendingPromotion(null);
      bump((v) => v + 1);
    }
    return result;
  }, []);

  const applyRemote = useCallback<UseChessGameResult['applyRemote']>((move) => {
    const result = applyMove(chessRef.current, move.from, move.to, move.promotion);
    if (result) bump((v) => v + 1);
    return result;
  }, []);

  const cancelPromotion = useCallback(() => setPendingPromotion(null), []);

  // ---- Derived board state (BUG-3 FIX: derived ONLY from chess.js) ----
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pieces = useMemo<BoardPiece[]>(() => piecesFromChess(chessRef.current), [version]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fen = useMemo(() => chessRef.current.fen(), [version]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const turn = useMemo<Color>(() => chessRef.current.turn(), [version]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const history = useMemo<ChessMove[]>(
    () =>
      chessRef.current.history({ verbose: true }).map((m) => ({
        from: m.from as Square,
        to: m.to as Square,
        promotion: m.promotion as ChessMove['promotion'],
        san: m.san,
        flags: m.flags,
        captured: m.captured,
        piece: m.piece,
        color: m.color,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version],
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const gameOver = useMemo(() => evaluateGameOver(chessRef.current), [version]);

  const legalTargets = useMemo<Square[]>(() => {
    if (!selectedSquare) return [];
    return legalMovesFrom(chessRef.current, selectedSquare).map((m) => m.to);
  }, [selectedSquare, version]);

  const checkSquare = useMemo<Square | null>(() => {
    if (!gameOver.isCheck) return null;
    return findKingSquare(chessRef.current, turn);
  }, [gameOver.isCheck, turn]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const captured = useMemo(() => capturedPieces(chessRef.current), [version]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const material = useMemo(() => materialAdvantage(chessRef.current), [version]);
  // All legal moves (for AI)
  const legalMoves = useMemo(() => {
    const moves = chessRef.current.moves({ verbose: true });
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
  }, [version]);

  return {
    chess: chessRef.current,
    fen,
    pieces,
    turn,
    history,
    selectedSquare,
    legalTargets,
    legalMoves,
    pendingPromotion,
    isCheck: gameOver.isCheck,
    isCheckmate: gameOver.isCheckmate,
    isStalemate: gameOver.isStalemate,
    isDraw: gameOver.isDraw,
    isGameOver: gameOver.isOver,
    checkSquare,
    material,
    captured,
    selectSquare: setSelectedSquare,
    tryMove,
    applyRemote,
    cancelPromotion,
    loadFen,
  };
}
