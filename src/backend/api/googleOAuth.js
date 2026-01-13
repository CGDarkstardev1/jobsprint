import express from 'express';
import { google } from 'googleapis';
import crypto from 'crypto';

const router = express.Router();
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_OAUTH_REDIRECT // e.g. https://app.jobsprint.com/api/v1/connect/google/callback
);

// Generate a URL for user consent (server-side code flow)
router.get('/connect/google/start', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  // Save state to session for CSRF protection (demo: return state)
  const scopes = [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
  ];
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    state,
  });
  res.json({ authUrl: url, state });
});

// Callback to exchange code for tokens
router.get('/connect/google/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code) return res.status(400).json({ error: 'Missing code' });

  try {
    const { tokens } = await oauth2Client.getToken(String(code));
    // Persist tokens server-side in secure storage
    try {
      const { saveProviderToken } = await import('./connectorsStore.js');
      saveProviderToken('google', tokens);
      // Broadcast event for websocket listeners (if any)
      process.emit('jobEvent', { type: 'CONNECTOR_CONNECTED', provider: 'google', timestamp: new Date().toISOString() });
    } catch (e) {
      console.warn('save token failed', e?.message || e);
    }

    // Respond with a small HTML page that notifies opener window and closes
    const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Google Connect</title></head><body>
<script>
  try {
    if (window.opener) {
      window.opener.postMessage({ type: 'CONNECTOR_CALLBACK', provider: 'google', success: true }, '*');
      window.close();
    } else {
      document.body.innerHTML = '<h3>Google connect successful. You can close this window.</h3>';
    }
  } catch (e) {
    document.body.innerHTML = '<h3>Google connect complete.</h3>';
  }
</script>
</body></html>`;

    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (err) {
    console.error('Google callback error', err);
    res.status(500).json({ success: false, error: String(err) });
  }
});
  } catch (err) {
    console.error('Google callback error', err);
    res.status(500).json({ success: false, error: String(err) });
  }
});

// List files using stored token (demo expects token in query for simplicity)
router.get('/files/google/list2', async (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(400).json({ error: 'Missing token' });

  try {
    oauth2Client.setCredentials({ access_token: String(token) });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const result = await drive.files.list({
      pageSize: 50,
      fields: 'files(id,name,mimeType,modifiedTime)',
    });
    res.json({ files: result.data.files });
  } catch (err) {
    console.error('list drive error', err);
    res.status(500).json({ error: String(err) });
  }
});

export default router;
