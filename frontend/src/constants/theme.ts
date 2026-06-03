// src/constants/theme.ts — visual tokens (colors, board themes, piece themes)
import type { BoardThemeKey, PieceThemeKey } from '@/types/index';

export interface BoardTheme {
  light: string;
  dark: string;
  border: string;
  selected: string; // semi-transparent overlay
  legalDot: string;
  lastMove: string;
  check: string;
  coordinate: string;
}

export const BOARD_THEMES: Record<BoardThemeKey, BoardTheme> = {
  classic: {
    light: '#F0D9B5',
    dark: '#B58863',
    border: '#6B4C2A',
    selected: 'rgba(246, 246, 105, 0.5)',
    legalDot: 'rgba(0, 0, 0, 0.2)',
    lastMove: 'rgba(205, 209, 110, 0.4)',
    check: 'rgba(255, 0, 0, 0.45)',
    coordinate: '#8A7B6A',
  },
  green: {
    light: '#EEEED2',
    dark: '#769656',
    border: '#3D5A2C',
    selected: 'rgba(246, 246, 105, 0.5)',
    legalDot: 'rgba(0, 0, 0, 0.2)',
    lastMove: 'rgba(205, 209, 110, 0.4)',
    check: 'rgba(255, 0, 0, 0.45)',
    coordinate: '#5C6B4E',
  },
  blue: {
    light: '#DEE3E6',
    dark: '#788FA1',
    border: '#3E5363',
    selected: 'rgba(246, 246, 105, 0.5)',
    legalDot: 'rgba(0, 0, 0, 0.2)',
    lastMove: 'rgba(205, 209, 110, 0.4)',
    check: 'rgba(255, 0, 0, 0.45)',
    coordinate: '#4F6373',
  },
};

export const PIECE_THEMES: Record<PieceThemeKey, { displayName: string }> = {
  merida: { displayName: 'Merida' },
  alpha: { displayName: 'Alpha' },
  neo: { displayName: 'Neo' },
};

// Midnight royal palette
export const COLORS = {
  background: '#F6F8FC',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF3FF',
  surfaceContainer: '#FFFFFF',
  surfaceContainerLow: '#FAFBFE',
  surfaceContainerHigh: '#F2F5FA',
  surfaceVariant: '#E7ECF5',
  primary: '#E8C77B',
  primaryDark: '#C8A95E',
  onPrimary: '#172033',
  secondary: '#2F5BFF',
  secondaryFixedDim: '#5A7BFF',
  onSecondary: '#FFFFFF',
  onSecondaryFixed: '#162456',
  accent: '#7D96E8',
  danger: '#FEE2E2',
  errorContainer: '#FECACA',
  onError: '#7F1D1D',
  onPrimaryContainer: '#5D4820',
  onSecondaryContainer: '#2346C8',
  secondaryContainer: '#E6EDFF',
  surfaceBright: '#FFFFFF',
  surfaceContainerLowest: '#FFFFFF',
  textPrimary: '#192235',
  textSecondary: '#5E6C87',
  textMuted: '#8390A8',
  border: '#D9E0EB',
  outline: '#91A0B8',
  outlineVariant: '#B7C2D5',
  timerGreen: '#5FAD6F',
  timerAmber: '#D99428',
  timerRed: '#DD5B5B',
  overlay: 'rgba(15, 23, 42, 0.35)',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const RADIUS = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
};

export const TYPOGRAPHY = {
  h1: { fontSize: 28, fontWeight: '700' as const },
  h2: { fontSize: 22, fontWeight: '700' as const },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '500' as const },
  mono: { fontSize: 14, fontFamily: 'Menlo' },
};
