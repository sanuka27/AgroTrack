import express from 'express';
import { BugReport } from '../models/BugReport';

const router = express.Router();

// Development-only: list bug reports without auth so we can verify DB contents quickly
router.get('/bugreports-raw', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ success: false, error: 'Disabled outside development' });
  }

  try {
    const reports = await BugReport.find().sort({ createdAt: -1 }).limit(200).lean();
    return res.json({ success: true, count: reports.length, reports });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e?.message || String(e) });
  }
});

export default router;
