'use strict';
require('dotenv').config();

const express      = require('express');
const helmet       = require('helmet');
const cookieParser = require('cookie-parser');
const bcrypt       = require('bcrypt');
const jwt          = require('jsonwebtoken');
const rateLimit    = require('express-rate-limit');
const path         = require('path');
const https        = require('https');

const pool        = require('./db');
const requireAuth = require('./middleware/auth');

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "'unsafe-inline'"],
      styleSrc:   ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc:    ["'self'", 'https://fonts.gstatic.com'],
      imgSrc:     ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'"],
    },
  },
}));

// ── Body / cookie parsing ─────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));   // images come as base64 in JSON
app.use(cookieParser());

// ── Static files ──────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Rate limiter for login ────────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const BCRYPT_COST = 12;

function issueToken(res, userId, username) {
  const token = jwt.sign(
    { id: userId, username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 2 * 60 * 60 * 1000,  // 2 hours in ms
  });
}

function validateCredentials(username, password) {
  if (!username || typeof username !== 'string') return 'Username is required';
  if (username.length < 3 || username.length > 50) return 'Username must be 3–50 characters';
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Username may only contain letters, numbers, underscores';
  if (!password || typeof password !== 'string') return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (password.length > 128) return 'Password too long';
  return null;
}

// ── Auth routes ───────────────────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  const err = validateCredentials(username, password);
  if (err) return res.status(400).json({ error: err });

  try {
    const existing = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Username already taken' });
    }
    const hash = await bcrypt.hash(password, BCRYPT_COST);
    const result = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id',
      [username, hash]
    );
    issueToken(res, result.rows[0].id, username);
    return res.status(201).json({ message: 'Account created', username });
  } catch (e) {
    console.error('Register error:', e.message);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;
  const err = validateCredentials(username, password);
  if (err) return res.status(400).json({ error: err });

  try {
    const result = await pool.query('SELECT id, password FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      // constant-time response to prevent user enumeration
      await bcrypt.hash('dummy', BCRYPT_COST);
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid username or password' });

    issueToken(res, user.id, username);
    return res.json({ message: 'Logged in', username });
  } catch (e) {
    console.error('Login error:', e.message);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'strict' });
  return res.json({ message: 'Logged out' });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  return res.json({ username: req.user.username });
});

// ── Scan route ────────────────────────────────────────────────────────────────
app.post('/api/scan', requireAuth, async (req, res) => {
  const { imageBase64, mimeType, audioBase64, audioMimeType } = req.body;

  if (!imageBase64 || typeof imageBase64 !== 'string') {
    return res.status(400).json({ error: 'No image provided' });
  }
  if (!mimeType || !['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
    return res.status(400).json({ error: 'Unsupported image type. Use JPEG, PNG, or WebP.' });
  }

  const hasAudio = audioBase64 && typeof audioBase64 === 'string' &&
                   audioMimeType && ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/wav'].includes(audioMimeType);

  const prompt = hasAudio
    ? `You are a GI craft SEO expert. The artisan has described their craft in the audio. Transcribe what they said, then analyze the image together with that description. Return ONLY valid JSON:
{
  "craft_type": "name of the craft",
  "authenticity_notes": "brief note on craft authenticity, materials, or technique from image and audio",
  "artisan_description": "English translation/transcription of what the artisan said",
  "listings": {
    "en": { "title": "max 80 chars", "description": "max 200 chars using artisan details", "tags": ["tag1","tag2","tag3","tag4","tag5"], "price_range": "USD range" },
    "ja": { "title": "max 80 chars", "description": "max 200 chars", "tags": ["tag1","tag2","tag3","tag4","tag5"], "price_range": "USD range" },
    "de": { "title": "max 80 chars", "description": "max 200 chars", "tags": ["tag1","tag2","tag3","tag4","tag5"], "price_range": "USD range" }
  }
}
Return ONLY the JSON object. No markdown, no explanation.`
    : `Analyze this handcraft image. Return ONLY valid JSON:
{
  "craft_type": "name of the craft",
  "authenticity_notes": "brief note on craft authenticity or style",
  "listings": {
    "en": { "title": "max 80 chars", "description": "max 200 chars", "tags": ["tag1","tag2","tag3","tag4","tag5"], "price_range": "USD range" },
    "ja": { "title": "max 80 chars", "description": "max 200 chars", "tags": ["tag1","tag2","tag3","tag4","tag5"], "price_range": "USD range" },
    "de": { "title": "max 80 chars", "description": "max 200 chars", "tags": ["tag1","tag2","tag3","tag4","tag5"], "price_range": "USD range" }
  }
}
Return ONLY the JSON object. No markdown, no explanation.`;

  // Build parts: always include prompt + image; add audio if provided
  const parts = [
    { text: prompt },
    { inline_data: { mime_type: mimeType, data: imageBase64 } }
  ];
  if (hasAudio) {
    parts.push({ inline_data: { mime_type: audioMimeType, data: audioBase64 } });
  }

  const requestBody = JSON.stringify({
    contents: [{ parts }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 1024 }
  });

  const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(requestBody) }
  };

  const geminiReq = https.request(options, (geminiRes) => {
    let data = '';
    geminiRes.on('data', chunk => { data += chunk; });
    geminiRes.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        if (parsed.error) {
          console.error('Gemini API error:', parsed.error.message);
          return res.status(502).json({ error: 'AI service error: ' + parsed.error.message });
        }
        const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        // strip markdown code fences if Gemini wraps the JSON anyway
        const clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        const listing = JSON.parse(clean);
        return res.json(listing);
      } catch (e) {
        console.error('Parse error:', e.message);
        return res.status(502).json({ error: 'Could not analyze image. Please try a clearer photo.' });
      }
    });
  });

  geminiReq.on('error', (e) => {
    console.error('Gemini request error:', e.message);
    return res.status(502).json({ error: 'Could not reach AI service. Check your connection.' });
  });

  geminiReq.write(requestBody);
  geminiReq.end();
});

// ── Page routes ───────────────────────────────────────────────────────────────
// Serve login/register as static files from /public
// Main app — redirect to login if not authed (handled client-side via /api/auth/me)
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'public', 'register.html')));

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`KalaSEO running at http://localhost:${PORT}`);
});
