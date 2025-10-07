import { Request, Response } from "express";
import * as cs from "../utils/cacheService";

export const getCacheHealth = (_req: Request, res: Response) => {
  res.json({ ok: true, ...cs.health() });
};

export const flushAll = async (_req: Request, res: Response) => {
  const keys = await cs.keysByNamespace("");
  let count = 0;
  for (const k of keys) {
    await cs.del(k);
    count++;
  }
  res.json({ ok: true, cleared: count });
};

export const flushNamespace = async (req: Request, res: Response) => {
  const ns = String(req.params.ns || req.query.ns || "");
  const cleared = await cs.clearNamespace(ns);
  res.json({ ok: true, namespace: ns, cleared });
};

export const getKey = async (req: Request, res: Response) => {
  const key = String(req.params.key || req.query.key || "");
  const value = await cs.get(key);
  res.json({ key, value });
};

export const setKey = async (req: Request, res: Response) => {
  const key = String(req.params.key || req.body.key || "");
  const value = String(req.body?.value ?? "");
  const ttl = req.body?.ttlSec ? Number(req.body.ttlSec) : undefined;
  await cs.set(key, value, ttl);
  res.json({ ok: true, key, ttl });
};
