const bcrypt = require('bcrypt');
const pool = require('./client');

async function seed() {
  const hash = await bcrypt.hash('password123', 12);
  await pool.query(
    `INSERT INTO users (email, name, workspace, password_hash, role)
     VALUES 
       ('demo@verdant.ai', 'Alex Morgan', 'Verdant Global', $1, 'administrator'),
       ('admin@verdant.ai', 'Operations Admin', 'Verdant Global', $1, 'administrator')
     ON CONFLICT (email) DO UPDATE 
     SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role`,
    [hash]
  );
  const res = await pool.query('SELECT email, role, password_hash FROM users WHERE email IN ($1, $2)', ['demo@verdant.ai', 'admin@verdant.ai']);
  console.log('Seeded users:', res.rows.map(r => ({ email: r.email, role: r.role, hashPrefix: r.password_hash.slice(0, 10) })));
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
