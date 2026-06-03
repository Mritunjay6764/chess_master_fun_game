// src/utils/storage.ts — synchronous in-memory cache backed by AsyncStorage.
// On app launch we hydrate the cache; writes persist async in the background.
import AsyncStorage from '@react-native-async-storage/async-storage';

// In-memory cache for synchronous reads (populated on hydrate)
const cache = new Map<string, string>();
let hydrated = false;

/** Call once at app start (before stores read). Populates the sync cache. */
export async function hydrateStorage(): Promise<void> {
  if (hydrated) return;
  const keys = await AsyncStorage.getAllKeys();
  if (keys.length > 0) {
    const entries = await AsyncStorage.multiGet(keys);
    for (const [k, v] of entries) {
      if (k && v !== null) cache.set(k, v);
    }
  }
  hydrated = true;
}

export const Storage = {
  setString(key: string, value: string): void {
    cache.set(key, value);
    AsyncStorage.setItem(key, value).catch(() => {});
  },
  getString(key: string): string | undefined {
    return cache.get(key);
  },
  setObject<T>(key: string, value: T): void {
    const json = JSON.stringify(value);
    cache.set(key, json);
    AsyncStorage.setItem(key, json).catch(() => {});
  },
  getObject<T>(key: string): T | undefined {
    const raw = cache.get(key);
    if (!raw) return undefined;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return undefined;
    }
  },
  setBool(key: string, value: boolean): void {
    Storage.setString(key, value ? '1' : '0');
  },
  getBool(key: string): boolean | undefined {
    const v = cache.get(key);
    if (v === undefined) return undefined;
    return v === '1';
  },
  delete(key: string): void {
    cache.delete(key);
    AsyncStorage.removeItem(key).catch(() => {});
  },
  clearAll(): void {
    cache.clear();
    AsyncStorage.clear().catch(() => {});
  },
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth.token',
  USER: 'auth.user',
  SETTINGS: 'settings',
  RECENT_GAMES: 'recent.games',
} as const;
