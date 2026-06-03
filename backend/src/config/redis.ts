// Redis is optional - just use a mock for now
export default {
  get: async (key: string) => null,
  set: async (key: string, value: string) => {},
  del: async (key: string) => {},
  lpush: async (key: string, value: string) => {},
  lpop: async () => null,
  lrem: async () => {},
  lrange: async () => [],
  llen: async () => 0,
  on: () => {},
};