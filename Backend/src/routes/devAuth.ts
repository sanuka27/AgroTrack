import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

const router = express.Router();

router.post('/dev-login', async (req, res) => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ success: false, error: 'Disabled outside development' });
    }

    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'email required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ success: false, error: 'JWT_SECRET not configured on server' });
    }

    // Sign with { userId } payload to match auth middleware decode
    const token = jwt.sign({ userId: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '2h' });
    return res.json({ success: true, token, user: { id: user._id.toString(), email: user.email } });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e?.message || String(e) });
  }
});

export default router;
