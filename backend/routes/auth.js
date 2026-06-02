import express from 'express';
import axios from 'axios';

const router = express.Router();

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

// Generate auth URL
router.get('/google-url', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/callback';

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.heart_rate.read openid profile email',
    access_type: 'offline'
  });

  const authUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;
  res.json({ authUrl });
});

// Exchange code for token
router.post('/exchange-code', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Code required' });
    }

    const response = await axios.post(GOOGLE_TOKEN_URL, {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/callback'
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Refresh token
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const response = await axios.post(GOOGLE_TOKEN_URL, {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
