import { Request, Response, NextFunction } from "express";
import * as cs from "../utils/cacheService";

/**
 * Usage: app.get('/path', cacheResponse(60, req => `ns:items:${req.params.id}`), handler)
 */
export const cacheResponse =
  (ttlSec = 60, makeKey?: (req: Request) => string) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = makeKey ? makeKey(req) : `route:${req.method}:${req.originalUrl}`;
      const hit = await cs.get(key);
      if (hit) {
        res.setHeader("X-Cache", "HIT");
        res.type("application/json").send(hit);
        return;
      }
      // monkey-patch res.json to store payload
      const _json = res.json.bind(res);
      res.json = (body: any) => {
        try { cs.set(key, JSON.stringify(body), ttlSec).catch(() => {}); } catch {
        // Ignore cache errors
      }
        res.setHeader("X-Cache", "MISS");
        return _json(body);
      };
      next();
    } catch {
      next(); // never block request due to cache
    }
  };
