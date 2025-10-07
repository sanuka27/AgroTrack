import { Router } from "express";
import { cacheResponse } from "../middleware/cacheResponse";

const router = Router();

router.get("/", cacheResponse(20, req => `search:${req.originalUrl}`), (req, res) => {
  const q = String(req.query.q || "");
  res.json({ ok: true, query: q, results: [] });
});

export default router;
