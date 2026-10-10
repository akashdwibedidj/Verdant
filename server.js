require('dotenv').config();
const express = require('express');
const http = require('http');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const { WebSocketServer } = require('ws');
const worldModel = require('./world/worldModel');
const { readToken } = require('./middleware/auth');

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));

const allowedOrigins = new Set((process.env.FRONTEND_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174').split(',').map((origin) => origin.trim()).filter(Boolean));

function isOriginAllowed(origin) {
  if (!origin) return true;
  if (allowedOrigins.has(origin)) return true;
  try {
    const url = new URL(origin);
    if ((url.hostname === 'localhost' || url.hostname === '127.0.0.1') && process.env.NODE_ENV !== 'production') {
      return true;
    }
  } catch {}
  return false;
}

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 600, standardHeaders: true, legacyHeaders: false }));

// Routes
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/status',    require('./routes/status'));
app.use('/api/decisions', require('./routes/decisions'));
app.use('/api/replay',    require('./routes/replay'));
app.use('/api/hitl',      require('./routes/hitl'));
app.use('/api/memory',    require('./routes/memory'));

// Health check (no auth)
app.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

const server = http.createServer(app);

// WebSocket server on same port
const wss = new WebSocketServer({ noServer: true });
global.wss = wss;

wss.on('connection', (ws) => {
  console.log('[WS] Client connected');
  ws.send(JSON.stringify({ type: 'connected', payload: { message: 'Supply Chain AI Agent backend ready' } }));

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.type === 'ping') ws.send(JSON.stringify({ type: 'pong' }));
    } catch {}
  });

  ws.on('close', () => console.log('[WS] Client disconnected'));
});

server.on('upgrade', async (request, socket, head) => {
  const origin = request.headers.origin;
  if (origin && !isOriginAllowed(origin)) {
    socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
    socket.destroy();
    return;
  }
  const cookies = {};
  for (const part of (request.headers.cookie || '').split(';')) {
    const separator = part.indexOf('=');
    if (separator <= 0) continue;
    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    try { cookies[decodeURIComponent(key)] = decodeURIComponent(value); } catch { /* Ignore malformed cookies. */ }
  }
  try {
    const token = readToken({ headers: request.headers, cookies, url: request.url });
    if (!token) throw new Error('Authentication required');
    const user = jwt.verify(token, process.env.JWT_SECRET);
    const pool = require('./db/client');
    const result = await pool.query('SELECT token_invalid_before FROM users WHERE id = $1', [user.sub]);
    const invalidBefore = result.rows[0]?.token_invalid_before;
    if (!result.rows[0] || (invalidBefore && user.iat * 1000 <= new Date(invalidBefore).getTime())) throw new Error('Session revoked');
  } catch {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }
  wss.handleUpgrade(request, socket, head, (ws) => wss.emit('connection', ws, request));
});

const PORT = process.env.PORT || 3001;

// Load world model then start server
worldModel.load().then(() => {
  server.listen(PORT, () => {
    console.log(`\n✅ Supply Chain AI Backend running on http://localhost:${PORT}`);
    console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
    console.log(`🏥 Health: http://localhost:${PORT}/health\n`);
  });
}).catch(err => {
  console.error('Failed to load world model:', err.message);
  process.exit(1);
});
