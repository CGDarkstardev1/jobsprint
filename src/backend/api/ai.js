import express from 'express';
const router = express.Router();

// Simple AI health endpoint (mock)
router.get('/ai/health', (req, res) =>
  res.json({ ok: true, provider: 'puter', models: ['claude-sonnet-4-5'] })
);

export default router;
