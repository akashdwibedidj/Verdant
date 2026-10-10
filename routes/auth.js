const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const pool = require('../db/client');
const auth = require('../middleware/auth');

const credentialsSchema = z.object({ email: z.string().trim().email().max(254), password: z.string().min(8).max(128) });
const signupSchema = credentialsSchema.extend({ name: z.string().trim().min(1).max(100), workspace: z.string().trim().min(1).max(120) });
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many login attempts. Try again in 15 minutes.' } });

function initialsFor(name) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || 'U';
}

function userResponse(user) {
  const administrator = user.role === 'administrator';
  return {
    id: user.id,
    name: user.name, initials: initialsFor(user.name), email: user.email,
    title: administrator ? 'Workspace administrator' : 'Supply chain lead',
    team: 'Global Operations', accessLevel: administrator ? 'Workspace administrator' : 'Workspace operator',
    workspace: user.workspace, timeZone: 'Asia/Kolkata (UTC+05:30)', accountStatus: 'Active',
    permissions: administrator ? ['Approve agent recommendations', 'Manage network units', 'Review decision logs'] : ['Review network units', 'Review decision logs'],
  };
}

function issueSession(res, user) {
  const token = jwt.sign({ sub: user.id, email: user.email, name: user.name, role: user.role, workspace: user.workspace }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
  res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 8 * 60 * 60 * 1000 });
  const u = userResponse(user);
  u.token = token;
  return { user: u, token };
}

router.post('/signup', async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Name, workspace, email, and password are required' });
  try {
    const { name, workspace, email, password } = parsed.data;
    const result = await pool.query(
      `INSERT INTO users (email, name, workspace, password_hash, role) VALUES ($1, $2, $3, $4, 'administrator') RETURNING id, email, name, workspace, role`,
      [email.toLowerCase(), name, workspace, await bcrypt.hash(password, 12)],
    );
    res.status(201).json(issueSession(res, result.rows[0]));
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'An account with this email already exists' });
    console.error('Signup error:', error.message);
    res.status(500).json({ error: 'Unable to create account' });
  }
});

router.post('/login', loginLimiter, async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'A valid email and password are required' });
  try {
    const { email, password } = parsed.data;
    const result = await pool.query('SELECT id, email, name, workspace, role, password_hash FROM users WHERE email = $1', [email.toLowerCase()]);
    const user = result.rows[0];
    const matches = user ? await bcrypt.compare(password, user.password_hash) : await bcrypt.hash(password, 12).then(() => false);
    if (!user || !matches) return res.status(401).json({ error: 'Invalid email or password' });
    res.json(issueSession(res, user));
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Unable to sign in' });
  }
});

router.post('/logout', async (req, res) => {
  const token = req.cookies?.token;
  if (token) {
    try {
      const user = jwt.verify(token, process.env.JWT_SECRET);
      await pool.query('UPDATE users SET token_invalid_before = NOW() WHERE id = $1', [user.sub]);
    } catch {
      // Clearing the cookie is sufficient for malformed or expired sessions.
    }
  }
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  res.json({ loggedOut: true });
});

router.get('/me', auth, async (req, res) => {
  const result = await pool.query('SELECT id, email, name, workspace, role FROM users WHERE id = $1', [req.user.sub]);
  if (!result.rows[0]) return res.status(401).json({ error: 'Session user no longer exists' });
  res.json({ user: userResponse(result.rows[0]) });
});

module.exports = router;
