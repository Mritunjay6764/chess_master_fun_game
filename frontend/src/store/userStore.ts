// src/store/userStore.ts — auth/user state, persisted to MMKV
import { create } from 'zustand';
import { Storage, STORAGE_KEYS } from '@utils/storage';
import type { PlayerInfo } from '@/types/index';

interface UserStoreState {
  user: PlayerInfo | null;
  token: string | null;
  isHydrated: boolean;
  setUser: (user: PlayerInfo, token?: string | null) => void;
  loginGuest: (username: string) => void;
  logout: () => void;
}

function loadUser(): PlayerInfo | null {
  return Storage.getObject<PlayerInfo>(STORAGE_KEYS.USER) ?? null;
}

function loadToken(): string | null {
  return Storage.getString(STORAGE_KEYS.AUTH_TOKEN) ?? null;
}

export const useUserStore = create<UserStoreState>((set) => ({
  user: loadUser(),
  token: loadToken(),
  isHydrated: true,
  setUser: (user, token) => {
    Storage.setObject(STORAGE_KEYS.USER, user);
    if (token !== undefined) {
      if (token) Storage.setString(STORAGE_KEYS.AUTH_TOKEN, token);
      else Storage.delete(STORAGE_KEYS.AUTH_TOKEN);
    }
    set({ user, token: token ?? null });
  },
  loginGuest: (username) => {
    const guest: PlayerInfo = {
      id: `guest_${Date.now().toString(36)}`,
      username,
      rating: 1200,
      isGuest: true,
    };
    Storage.setObject(STORAGE_KEYS.USER, guest);
    set({ user: guest, token: null });
  },
  logout: () => {
    Storage.delete(STORAGE_KEYS.USER);
    Storage.delete(STORAGE_KEYS.AUTH_TOKEN);
    set({ user: null, token: null });
  },
}));
