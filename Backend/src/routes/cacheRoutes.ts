import { Router } from "express";
import { getCacheHealth, flushAll, flushNamespace, getKey, setKey } from "../controllers/cacheController";

const router = Router();

router.get("/health", getCacheHealth);
router.post("/flush", flushAll);
router.post("/flush/:ns", flushNamespace);
router.get("/key/:key", getKey);
router.post("/key/:key", setKey);

export default router;
