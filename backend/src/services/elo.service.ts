import prisma from '../config/prisma';
import { GAME_CONFIG } from '../constants/game';

export class EloService {
  calculateExpected(playerElo: number, opponentElo: number): number {
    return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  }
  calculateKFactor(elo: number): number { return elo < GAME_CONFIG.ELO_THRESHOLD ? GAME_CONFIG.K_FACTOR_LOW : GAME_CONFIG.K_FACTOR_HIGH; }
  calculateEloChange(playerElo: number, opponentElo: number, actual: number): number {
    const expected = this.calculateExpected(playerElo, opponentElo);
    return Math.round(this.calculateKFactor(playerElo) * (actual - expected));
  }
  async updateElo(winnerId: string | null, loserId: string | null, isDraw: boolean, whiteId: string, blackId: string, whiteElo: number, blackElo: number) {
    let whiteChange = 0, blackChange = 0;
    if (isDraw) {
      whiteChange = this.calculateEloChange(whiteElo, blackElo, 0.5);
      blackChange = this.calculateEloChange(blackElo, whiteElo, 0.5);
    } else if (winnerId === whiteId) {
      whiteChange = this.calculateEloChange(whiteElo, blackElo, 1);
      blackChange = this.calculateEloChange(blackElo, whiteElo, 0);
    } else if (winnerId === blackId) {
      whiteChange = this.calculateEloChange(whiteElo, blackElo, 0);
      blackChange = this.calculateEloChange(blackElo, whiteElo, 1);
    }
    const newWhiteElo = Math.max(GAME_CONFIG.MIN_ELO, whiteElo + whiteChange);
    const newBlackElo = Math.max(GAME_CONFIG.MIN_ELO, blackElo + blackChange);
    await prisma.user.update({ where: { id: whiteId }, data: { elo: newWhiteElo, wins: winnerId === whiteId ? { increment: 1 } : undefined, losses: loserId === whiteId ? { increment: 1 } : undefined, draws: isDraw ? { increment: 1 } : undefined, gamesPlayed: { increment: 1 } } });
    await prisma.user.update({ where: { id: blackId }, data: { elo: newBlackElo, wins: winnerId === blackId ? { increment: 1 } : undefined, losses: loserId === blackId ? { increment: 1 } : undefined, draws: isDraw ? { increment: 1 } : undefined, gamesPlayed: { increment: 1 } } });
    return { whiteElo: newWhiteElo, blackElo: newBlackElo, whiteChange, blackChange };
  }
  async getLeaderboard(limit = 50) {
    return prisma.user.findMany({ orderBy: { elo: 'desc' }, take: limit, select: { id: true, username: true, elo: true, wins: true, losses: true, draws: true, gamesPlayed: true } });
  }
}
export const eloService = new EloService();