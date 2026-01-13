import express from 'express';
import { getProviderToken, hasProviderToken } from './connectorsStore.js';
import fs from 'fs';

const router = express.Router();

// List saved documents (server-side store)
router.get('/documents/list', (req, res) => {
  try {
    const path = './connectors_store.json';
    if (!fs.existsSync(path)) return res.json({ documents: [] });
    const raw = fs.readFileSync(path, 'utf8');
    const parsed = JSON.parse(raw || '{}');
    const docs = Object.keys(parsed).map((k) => ({ provider: k, tokenSaved: true }));
    return res.json({ documents: docs });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;
