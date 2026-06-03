import { GAME_CONFIG } from '../constants/game';

const clockStore = new Map<string, number>();

export class ClockService {
  async initializeClock(gameId: string, userId: string): Promise<void> {
    clockStore.set(`clock:${gameId}:${userId}`, GAME_CONFIG.INITIAL_TIME);
  }
  async getTime(gameId: string, userId: string): Promise<number> {
    return clockStore.get(`clock:${gameId}:${userId}`) || GAME_CONFIG.INITIAL_TIME;
  }
  async updateClock(gameId: string, userId: string, newTime: number): Promise<void> {
    clockStore.set(`clock:${gameId}:${userId}`, newTime);
  }
  async deleteClock(gameId: string, userId: string): Promise<void> {
    clockStore.delete(`clock:${gameId}:${userId}`);
  }
}
export const clockService = new ClockService();