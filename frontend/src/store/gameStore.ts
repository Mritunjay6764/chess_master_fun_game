// src/store/gameStore.ts — current match state. Reset on every new game.
import { create } from 'zustand';
import type {
  ChessMove,
  GameResult,
  PlayerInfo,
  ServerTimes,
  TimeControl,
  Color,
} from '@/types/index';

interface GameStoreState {
  matchId: string | null;
  white: PlayerInfo | null;
  black: PlayerInfo | null;
  myColor: Color | null;
  timeControl: TimeControl | null;
  fen: string;
  moves: ChessMove[];
  turn: Color;
  whiteTimeMs: number;
  blackTimeMs: number;
  lastServerSyncAt: number;
  result: GameResult | null;
  drawOfferedBy: Color | null;
  rematchOfferedBy: Color | null;
  boardFlipped: boolean;

  // Lifecycle
  startMatch: (args: {
    matchId: string;
    white: PlayerInfo;
    black: PlayerInfo;
    myColor: Color;
    timeControl: TimeControl;
    fen?: string;
  }) => void;
  applyServerMove: (args: { move: ChessMove; fen: string; turn: Color; times: ServerTimes }) => void;
  setResult: (result: GameResult) => void;
  setDrawOffered: (by: Color | null) => void;
  setRematchOffered: (by: Color | null) => void;
  toggleFlip: () => void;
  syncTimes: (times: ServerTimes) => void;
  resetGame: () => void;
}

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

// Snapshot of the "empty" state — re-applied on resetGame() to fully wipe (BUG-1)
const EMPTY_STATE = {
  matchId: null,
  white: null,
  black: null,
  myColor: null,
  timeControl: null,
  fen: INITIAL_FEN,
  moves: [],
  turn: 'w' as Color,
  whiteTimeMs: 0,
  blackTimeMs: 0,
  lastServerSyncAt: 0,
  result: null,
  drawOfferedBy: null,
  rematchOfferedBy: null,
  boardFlipped: false,
};

export const useGameStore = create<GameStoreState>((set, get) => ({
  ...EMPTY_STATE,

  startMatch: ({ matchId, white, black, myColor, timeControl, fen }) => {
    // BUG-1 FIX: nuke prior match state before installing the new one
    set({
      ...EMPTY_STATE,
      matchId,
      white,
      black,
      myColor,
      timeControl,
      fen: fen ?? INITIAL_FEN,
      turn: 'w',
      whiteTimeMs: timeControl.baseSeconds * 1000,
      blackTimeMs: timeControl.baseSeconds * 1000,
      lastServerSyncAt: Date.now(),
      // Board oriented with my pieces at the bottom
      boardFlipped: myColor === 'b',
    });
  },

  applyServerMove: ({ move, fen, turn, times }) => {
    const moves = [...get().moves, move];
    set({
      fen,
      turn,
      moves,
      whiteTimeMs: times.whiteMs,
      blackTimeMs: times.blackMs,
      lastServerSyncAt: times.serverTimestamp,
    });
  },

  setResult: (result) => set({ result }),
  setDrawOffered: (by) => set({ drawOfferedBy: by }),
  setRematchOffered: (by) => set({ rematchOfferedBy: by }),
  toggleFlip: () => set({ boardFlipped: !get().boardFlipped }),
  syncTimes: (times) =>
    set({
      whiteTimeMs: times.whiteMs,
      blackTimeMs: times.blackMs,
      lastServerSyncAt: times.serverTimestamp,
    }),

  resetGame: () => set({ ...EMPTY_STATE }),
}));
