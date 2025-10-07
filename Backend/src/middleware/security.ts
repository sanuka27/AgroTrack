import { Request, Response, NextFunction } from "express";
import { cache } from "../config/redis";

export const requireAuth = (_req: Request, _res: Response, next: NextFunction) => {
  return next();
};

export const redis = {
  redis: cache as any
};

export default requireAuth;
