import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { generateUserAnalytics } from '../controllers/analyticsController';
import mongoose from 'mongoose';

const router = express.Router();

// Simple SSE endpoint to stream analytics updates for the authenticated user
router.get('/analytics', protect, async (req, res) => {
  // Set headers for SSE
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });

  // Flush headers if available
  if ((res as any).flushHeaders) {
    (res as any).flushHeaders();
  }

  let closed = false;
  const userId = new mongoose.Types.ObjectId((req as any).user._id.toString());

  // Send a ping every 20s to keep connection alive
  const ping = setInterval(() => {
    try {
      res.write(`: ping\n\n`);
    } catch (err) {
      // ignore
    }
  }, 20000);

  // Keep previous snapshot to detect changes
  let previous: any = null;

  // Poll for analytics every 5 seconds (configurable)
  const pollInterval = 5000;
  const poll = async () => {
    try {
      const analytics = await generateUserAnalytics(userId, 'weekly');
      const payload = JSON.stringify(analytics);

      if (previous !== payload) {
        previous = payload;
        res.write(`event: analytics:update\n`);
        res.write(`data: ${payload}\n\n`);
      }
    } catch (err) {
      // send error event
      res.write(`event: analytics:error\n`);
      res.write(`data: ${JSON.stringify({ message: 'Failed to compute analytics' })}\n\n`);
    }

    if (!closed) setTimeout(poll, pollInterval);
  };

  // Start polling
  poll();

  // Cleanup on client close
  req.on('close', () => {
    closed = true;
    clearInterval(ping);
  });
});

export default router;
