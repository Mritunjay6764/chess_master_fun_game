// src/types/index.ts — core domain types shared across the app
import type { Square, PieceSymbol, Color } from 'chess.js';

export type { Square, PieceSymbol, Color };

/** A piece on the board as produced by chess.js .board(). */
export interface BoardPiece {
  square: Square;
  type: PieceSymbol;
  color: Color;
}

/** Move metadata used both locally and over the wire. */
export interface ChessMove {
  from: Square;
  to: Square;
  promotion?: 'q' | 'r' | 'b' | 'n';
  san?: string;
  flags?: string;
  captured?: PieceSymbol;
  piece?: PieceSymbol;
  color?: Color;
}

/** Time control presets supported by the matchmaker. */
export type TimeControlKey = 'bullet' | 'blitz3' | 'blitz5' | 'rapid' | 'classical';

export interface TimeControl {
  key: TimeControlKey;
  label: string;
  baseSeconds: number;
  incrementSeconds: number;
}

export interface PlayerInfo {
  id: string;
  username: string;
  rating: number;
  avatarUrl?: string;
  isGuest?: boolean;
}

export interface DashboardActivityPoint {
  label: string;
  count: number;
}

export interface DashboardTopPlayer {
  id: string;
  username: string;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface DashboardSummary {
  gamesPlayed: number;
  currentlyPlaying: number;
  activeGames: number;
  playersSearching: number;
  registeredPlayers: number;
}

export interface DashboardResponse {
  windowHours: number;
  summary: DashboardSummary;
  activity: DashboardActivityPoint[];
  topPlayers: DashboardTopPlayer[];
}

export interface MatchState {
  matchId: string;
  white: PlayerInfo;
  black: PlayerInfo;
  timeControl: TimeControl;
  fen: string;
  moves: ChessMove[];
  turn: Color;
  whiteTimeMs: number;
  blackTimeMs: number;
  lastServerSyncAt: number; // epoch ms — used to compute local drift
  result?: GameResult;
}

export type GameResultKind = 'win' | 'lose' | 'draw';
export type GameOverReason =
  | 'checkmate'
  | 'resignation'
  | 'timeout'
  | 'stalemate'
  | 'draw_agreed'
  | 'threefold_repetition'
  | 'insufficient_material'
  | 'fifty_move_rule'
  | 'opponent_left';

export interface GameResult {
  kind: GameResultKind;
  reason: GameOverReason;
  winnerColor?: Color;
}

/** Snapshot persisted/sent on reconnect. */
export interface GameSnapshot {
  matchId: string;
  fen: string;
  moves: ChessMove[];
  whiteTimeMs: number;
  blackTimeMs: number;
  turn: Color;
}

/** Server "times" payload on every move. */
export interface ServerTimes {
  whiteMs: number;
  blackMs: number;
  serverTimestamp: number;
}

/** Settings persisted in MMKV. */
export interface SettingsState {
  soundEnabled: boolean;
  volume: number; // 0..1
  hapticsEnabled: boolean;
  boardTheme: BoardThemeKey;
  pieceTheme: PieceThemeKey;
  showLegalMoves: boolean;
  showLastMove: boolean;
}

export type BoardThemeKey = 'classic' | 'green' | 'blue';
export type PieceThemeKey = 'merida' | 'alpha' | 'neo';
