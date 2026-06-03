// src/api/client.ts — axios REST client with auth interceptor
import axios from 'axios';
import { API_CONFIG } from './config';
import { useUserStore } from '@store/userStore';

export const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT_MS,
});

api.interceptors.request.use((cfg) => {
  const token = useUserStore.getState().token;
  if (token) {
    cfg.headers = cfg.headers ?? {};
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

// Domain endpoints — keep thin; React Query will own caching/state
const API_PREFIX = '/api';

export const AuthApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: import('@/types/index').PlayerInfo }>(`${API_PREFIX}/auth/login`, {
      email,
      password,
    }),
  register: (email: string, password: string, username: string) =>
    api.post<{ token: string; user: import('@/types/index').PlayerInfo }>(`${API_PREFIX}/auth/register`, {
      email,
      password,
      username,
    }),
  me: () => api.get<import('@/types/index').PlayerInfo>(`${API_PREFIX}/auth/profile`),
};

export const GameApi = {
  dashboard: (windowHours = 34) =>
    api.get<import('@/types/index').DashboardResponse>(`${API_PREFIX}/game/dashboard`, {
      params: { windowHours },
    }),
  history: (userId: string, page = 1) =>
    api.get<any[]>(`${API_PREFIX}/game/history`, { params: { limit: 20, offset: (page - 1) * 20 } }),
  stats: (userId: string) =>
    api.get<{
      wins: number;
      losses: number;
      draws: number;
      rating: number;
      avgGameLengthMs: number;
      favouriteOpening?: string;
    }>(`${API_PREFIX}/user/stats`),
};

export const LeaderboardApi = {
  top: (limit = 50) => api.get<{ players: import('@/types/index').PlayerInfo[] }>(`${API_PREFIX}/leaderboard`, {
    params: { limit },
  }),
};

export const AIApi = {
  getMove: (fen: string, difficulty: number = 5) =>
    api.get<{ from: string; to: string; promotion?: string; evaluation: number }>(`${API_PREFIX}/ai/best-move`, {
      params: { fen, skillLevel: difficulty },
    }).then(res => ({
      data: {
        move: { from: res.data.from, to: res.data.to, promotion: res.data.promotion },
        evaluation: res.data.evaluation,
      },
    })),
};
