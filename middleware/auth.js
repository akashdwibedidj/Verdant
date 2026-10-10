const jwt = require('jsonwebtoken');
const pool = require('../db/client');
require('dotenv').config();

function readToken(req) {
  const bearer = req?.headers?.authorization;
  if (bearer?.startsWith('Bearer ')) return bearer.slice(7);
  if (req?.cookies?.token) return req.cookies.token;
  if (req?.query?.token) return req.query.token;
  if (typeof req?.url === 'string' && req.url.includes('?')) {
    try {
      const url = new URL(req.url, 'http://localhost');
      const qToken = url.searchParams.get('token');
      if (qToken) return qToken;
    } catch {}
  }
  return null;
}

async function authMiddleware(req, res, next) {
  const token = readToken(req);
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query('SELECT token_invalid_before FROM users WHERE id = $1', [req.user.sub]);
    const invalidBefore = result.rows[0]?.token_invalid_before;
    if (!result.rows[0] || (invalidBefore && req.user.iat * 1000 <= new Date(invalidBefore).getTime())) {
      return res.status(401).json({ error: 'Session revoked or expired' });
    }
    next();
  } catch {
    res.clearCookie('token');
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = authMiddleware;
module.exports.readToken = readToken;
module.exports.requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ error: 'Insufficient permissions' });
  next();
};
