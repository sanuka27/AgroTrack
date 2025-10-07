import { logger } from "./logger";

type CacheLike = {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isHealthy: () => boolean;
  get?: (k: string) => Promise<string | null>;
  set?: (k: string, v: string, ttlSec?: number) => Promise<void>;
  del?: (...keys: string[]) => Promise<number>;
  keys?: (pattern: string) => Promise<string[]>;
  deleteByPattern?: (pattern: string) => Promise<number>;
  flushAll?: () => Promise<boolean>;
  exists?: (key: string) => Promise<boolean>;
  ttl?: (key: string) => Promise<number>;
  getStats?: () => any;
  resetStats?: () => void;
};

let healthy = false;
const disabled = (process.env.DISABLE_REDIS ?? "true") === "true";
let client: any = null;

export const cache: CacheLike = {
  async connect() {
    if (disabled) {
      logger.info("Redis disabled by DISABLE_REDIS=true");
      healthy = false;
      return;
    }
    const { createClient } = await import("redis");
    client = createClient();
    client.on("error", (err: any) => logger.warn("Redis error", { err }));
    await client.connect();
    healthy = true;
    logger.info("Redis connected");
    this.get = async (k: string) => (await client.get(k)) as string | null;
    this.set = async (k: string, v: string, ttlSec?: number) => {
      if (ttlSec) await client.setEx(k, ttlSec, v);
      else await client.set(k, v);
    };
    this.del = async (...keys: string[]) => await client.del(keys);
    this.keys = async (pattern: string) => await client.keys(pattern);
    this.deleteByPattern = async (pattern: string) => {
      const keys = await client.keys(pattern);
      if (keys.length > 0) return await client.del(keys);
      return 0;
    };
    this.flushAll = async () => { await client.flushAll(); return true; };
    this.exists = async (key: string) => (await client.exists(key)) > 0;
    this.ttl = async (key: string) => await client.ttl(key);
    this.getStats = () => ({ hits: 0, misses: 0, keys: 0 });
    this.resetStats = () => {};
  },
  async disconnect() {
    try { if (client) await client.quit(); } finally { healthy = false; }
  },
  isHealthy() { return healthy; }
};

export const CacheHelper = {
  generateKey(...parts: string[]) { return parts.join(':'); },
  parseCacheTime(time: string) { return parseInt(time) || 300; }
};

export default cache;
