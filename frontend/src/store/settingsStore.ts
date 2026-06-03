// src/store/settingsStore.ts — Zustand store persisted in MMKV
import { create } from 'zustand';
import { Storage, STORAGE_KEYS } from '@utils/storage';
import type {
  SettingsState,
  BoardThemeKey,
  PieceThemeKey,
} from '@/types/index';

interface SettingsActions {
  setSoundEnabled: (v: boolean) => void;
  setVolume: (v: number) => void;
  setHapticsEnabled: (v: boolean) => void;
  setBoardTheme: (k: BoardThemeKey) => void;
  setPieceTheme: (k: PieceThemeKey) => void;
  setShowLegalMoves: (v: boolean) => void;
  setShowLastMove: (v: boolean) => void;
  reset: () => void;
}

const DEFAULTS: SettingsState = {
  soundEnabled: true,
  volume: 0.8,
  hapticsEnabled: true,
  boardTheme: 'classic',
  pieceTheme: 'merida',
  showLegalMoves: true,
  showLastMove: true,
};

function loadInitial(): SettingsState {
  const stored = Storage.getObject<SettingsState>(STORAGE_KEYS.SETTINGS);
  return { ...DEFAULTS, ...(stored ?? {}) };
}

function persist(state: SettingsState): void {
  Storage.setObject(STORAGE_KEYS.SETTINGS, state);
}

export const useSettingsStore = create<SettingsState & SettingsActions>((set, get) => ({
  ...loadInitial(),
  setSoundEnabled: (v) => {
    set({ soundEnabled: v });
    persist(get());
  },
  setVolume: (v) => {
    set({ volume: Math.max(0, Math.min(1, v)) });
    persist(get());
  },
  setHapticsEnabled: (v) => {
    set({ hapticsEnabled: v });
    persist(get());
  },
  setBoardTheme: (k) => {
    set({ boardTheme: k });
    persist(get());
  },
  setPieceTheme: (k) => {
    set({ pieceTheme: k });
    persist(get());
  },
  setShowLegalMoves: (v) => {
    set({ showLegalMoves: v });
    persist(get());
  },
  setShowLastMove: (v) => {
    set({ showLastMove: v });
    persist(get());
  },
  reset: () => {
    set({ ...DEFAULTS });
    persist(get());
  },
}));
