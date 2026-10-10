// WebSocket broadcast helper — agents use this to push events to frontend
function broadcast(wss, type, payload) {
  if (!wss) return;
  const msg = JSON.stringify({ type, payload, ts: new Date().toISOString() });
  wss.clients.forEach(client => {
    if (client.readyState === 1) { // OPEN
      client.send(msg);
    }
  });
}

module.exports = { broadcast };
