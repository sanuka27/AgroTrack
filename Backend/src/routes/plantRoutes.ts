import { Router } from "express";
import { cacheResponse } from "../middleware/cacheResponse";

const router = Router();

router.get("/", cacheResponse(30), (_req, res) => {
  res.json({ ok: true, service: "plants", items: [] });
});

router.get("/:id", cacheResponse(60, req => `plant:${req.params.id}`), (req, res) => {
  res.json({ ok: true, id: req.params.id, name: "Demo Plant" });
});

export default router;
