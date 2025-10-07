import { cache } from "../config/redis";
import { logger } from "../config/logger";

const inMemory = new Map<string, { v: string; exp?: number }>();
const now = () => Date.now();
const isExpired = (exp?: number) => (typeof exp === "number" ? now() > exp : false);

const getFromMemory = (k: string) => {
  const rec = inMemory.get(k);
  if (!rec) return null;
  if (isExpired(rec.exp)) {
    inMemory.delete(k);
    return null;
  }
  return rec.v;
};

const setToMemory = (k: string, v: string, ttlSec?: number) => {
  const exp = ttlSec ? now() + ttlSec * 1000 : undefined;
  inMemory.set(k, { v, exp });
};

export const get = async (key: string): Promise<string | null> => {
  try {
    if (cache.isHealthy() && cache.get) {
      return await cache.get(key);
    }
  } catch (e) {
    logger.warn("cache.get failed, using memory", { key, e });
  }
  return getFromMemory(key);
};

export const set = async (key: string, value: string, ttlSec?: number): Promise<void> => {
  try {
    if (cache.isHealthy() && cache.set) {
      await cache.set(key, value, ttlSec);
      return;
    }
  } catch (e) {
    logger.warn("cache.set failed, using memory", { key, e });
  }
  setToMemory(key, value, ttlSec);
};

export const del = async (key: string): Promise<void> => {
  try {
    if (cache.isHealthy() && (cache as any).del) {
      await (cache as any).del(key);
      return;
    }
  } catch (e) {
    logger.warn("cache.del failed, using memory", { key, e });
  }
  inMemory.delete(key);
};

export const setJSON = async (key: string, obj: unknown, ttlSec?: number) =>
  set(key, JSON.stringify(obj), ttlSec);

export const getJSON = async <T = unknown>(key: string): Promise<T | null> => {
  const s = await get(key);
  if (!s) return null;
  try { return JSON.parse(s) as T; } catch { return null; }
};

export const keysByNamespace = async (ns: string): Promise<string[]> => {
  const prefix = ns.endsWith(":") ? ns : `${ns}:`;
  return Array.from(inMemory.keys()).filter(k => k.startsWith(prefix));
};

export const clearNamespace = async (ns: string): Promise<number> => {
  const keys = await keysByNamespace(ns);
  keys.forEach(k => inMemory.delete(k));
  return keys.length;
};

export const health = () => ({
  redisEnabled: cache.isHealthy(),
  inMemorySize: inMemory.size
});
