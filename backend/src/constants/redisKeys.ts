export const REDIS_KEYS = {
  MATCHMAKING_QUEUE: 'matchmaking:queue',
  GAME_SESSION: (gameId: string) => `game:${gameId}`,
  PLAYER_CLOCK: (gameId: string, userId: string) => `clock:${gameId}:${userId}`,
  PLAYER_PRESENCE: (userId: string) => `presence:${userId}`,
  USER_SOCKET: (userId: string) => `user_socket:${userId}`,
};