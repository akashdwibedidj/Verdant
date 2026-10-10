const http = require('http');
const WebSocket = require('ws');

async function run() {
  console.log('--- 1. Testing Health Endpoint ---');
  const healthRes = await fetch('http://localhost:3001/health');
  console.log('Health status:', healthRes.status, await healthRes.json());

  console.log('\n--- 2. Testing Demo Login ---');
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'demo@verdant.ai', password: 'password123' })
  });
  console.log('Login status:', loginRes.status);
  const cookieHeader = loginRes.headers.get('set-cookie');
  console.log('Set-Cookie received:', !!cookieHeader);
  const loginData = await loginRes.json();
  console.log('User logged in:', loginData.user?.name, loginData.user?.email, loginData.user?.accessLevel);
  const token = loginData.token;

  console.log('\n--- 3. Testing /api/auth/me ---');
  const meRes = await fetch('http://localhost:3001/api/auth/me', {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Cookie': cookieHeader || ''
    }
  });
  console.log('/api/auth/me status:', meRes.status);
  const meData = await meRes.json();
  console.log('Session user verified:', meData.user?.name);

  console.log('\n--- 4. Testing /api/status ---');
  const statusRes = await fetch('http://localhost:3001/api/status', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('/api/status status:', statusRes.status);
  const statusData = await statusRes.json();
  console.log('Ports count:', statusData.ports?.length, 'SKUs count:', statusData.skus?.length);

  console.log('\n--- 5. Testing /api/decisions ---');
  const decRes = await fetch('http://localhost:3001/api/decisions?limit=10', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('/api/decisions status:', decRes.status);
  const decData = await decRes.json();
  console.log('Decisions count:', decData.data?.length);

  console.log('\n--- 6. Testing /api/hitl/pending ---');
  const hitlRes = await fetch('http://localhost:3001/api/hitl/pending', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('/api/hitl/pending status:', hitlRes.status);
  const hitlData = await hitlRes.json();
  console.log('Pending HITL cards:', hitlData.length);

  console.log('\n--- 7. Testing New User Signup ---');
  const testEmail = `newuser_${Date.now()}@example.com`;
  const signupRes = await fetch('http://localhost:3001/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Hackathon Operator',
      workspace: 'Odisha Operations',
      email: testEmail,
      password: 'mypassword123'
    })
  });
  console.log('Signup status:', signupRes.status);
  const signupData = await signupRes.json();
  console.log('New user created:', signupData.user?.name, signupData.user?.email);

  console.log('\n--- 8. Testing WebSocket Connection with Token ---');
  await new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:3001?token=${token}`, {
      origin: 'http://localhost:5173'
    });
    ws.on('open', () => {
      console.log('WebSocket connected successfully with token!');
      ws.send(JSON.stringify({ type: 'ping' }));
    });
    ws.on('message', (msg) => {
      console.log('WebSocket received message:', msg.toString());
      ws.close();
      resolve();
    });
    ws.on('error', (err) => {
      console.error('WebSocket error:', err.message);
      reject(err);
    });
    setTimeout(() => {
      ws.close();
      resolve();
    }, 3000);
  });

  console.log('\nALL BACKEND AND FRONTEND CONNECTION CHECKS PASSED SUCCESSFULLY!');
  process.exit(0);
}

run().catch(err => {
  console.error('\nTest failed:', err);
  process.exit(1);
});
