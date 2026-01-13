/* Mock connectors for cloud providers (Google Drive, Dropbox, OneDrive)
 * Exposes endpoints for: /connect/:provider/start, /connect/:provider/callback, /files/:provider/list
 * This is mock-first and returns fake file lists for development and testing.
 */

import express from 'express';
const router = express.Router();

// Mock auth start
router.get('/connect/:provider/start', (req, res) => {
  const provider = req.params.provider;
  // In production redirect to provider-specific OAuth URL
  res.json({ authUrl: `https://mock.oauth/${provider}/authorize?client_id=MOCK` });
});

// Mock callback
router.get('/connect/:provider/callback', (req, res) => {
  const provider = req.params.provider;
  // In production exchange code for tokens and store them securely
  res.json({ success: true, provider, token: `mock_token_${provider}_${Date.now()}` });
});

// List files (mock)
router.get('/files/:provider/list', (req, res) => {
  const provider = req.params.provider;
  const files = [
    {
      id: `${provider}_1`,
      name: `Resume - ${provider} - resume.pdf`,
      kind: 'resume',
      path: `/root/resume-${provider}.pdf`,
      modifiedAt: new Date().toISOString(),
    },
    {
      id: `${provider}_2`,
      name: `CoverLetter - ${provider} - cover.docx`,
      kind: 'cover',
      path: `/root/cover-${provider}.docx`,
      modifiedAt: new Date().toISOString(),
    },
    {
      id: `${provider}_3`,
      name: `Portfolio - ${provider} - portfolio.pdf`,
      kind: 'portfolio',
      path: `/root/portfolio-${provider}.pdf`,
      modifiedAt: new Date().toISOString(),
    },
  ];

  res.json({ provider, files });
});

export default router;
