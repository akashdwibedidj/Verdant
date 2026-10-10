require('dotenv').config();
const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const worldModel = require('./world/worldModel');

const app = express();
app.use(express.json());

// CORS — allow frontend on any origin during development
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Routes
app.use('/api/status',    require('./routes/status'));
app.use('/api/decisions', require('./routes/decisions'));
app.use('/api/replay',    require('./routes/replay'));
app.use('/api/hitl',      require('./routes/hitl'));
app.use('/api/memory',    require('./routes/memory'));

// Health check (no auth)
app.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

const server = http.createServer(app);

// WebSocket server on same port
const wss = new WebSocketServer({ server });
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
