require('dotenv').config();
const jwt = require('jsonwebtoken');
const { WebSocket } = require('ws');

const BASE_URL = `http://localhost:${process.env.PORT || 3001}`;
const WS_URL = `ws://localhost:${process.env.PORT || 3001}`;

// Generate valid test JWT token
const testToken = jwt.sign(
  { sub: 'test_admin', role: 'operator', name: 'Hackathon Evaluator' },
  process.env.JWT_SECRET || 'replace_with_frontend_secret',
  { expiresIn: '1h' }
);

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${testToken}`
};

async function api(path, method = 'GET', body = null) {
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, options);
  const data = await res.json();
  return { status: res.status, data };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
  console.log('========================================================');
  console.log('🚀 PS1 Supply Chain AI Agent Network - Live Test Runner');
  console.log('========================================================\n');

  // 1. Health Check
  console.log('1️⃣ Checking Server Health (/health)...');
  const healthRes = await fetch(`${BASE_URL}/health`);
  const health = await healthRes.json();
  console.log('   Health response:', health);

  // 2. World Model Status
  console.log('\n2️⃣ Querying Shared World Model (/api/status)...');
  const status = await api('/api/status');
  console.log(`   Suppliers: ${status.data.suppliers?.length}`);
  console.log(`   Ports: ${status.data.ports?.length}`);
  console.log(`   SKUs: ${status.data.skus?.length}`);

  // 3. Connect to WebSocket
  console.log('\n3️⃣ Connecting to WebSocket Stream (ws://localhost:3001)...');
  const ws = new WebSocket(WS_URL);
  let eventCount = 0;

  ws.on('open', () => {
    console.log('   🟢 WebSocket connected successfully!');
  });

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      eventCount++;
      console.log(`   📡 [WS EVENT #${eventCount}] Type: ${msg.type}`);
      if (msg.type === 'replayed_event') {
        console.log(`      ⚡ Notice: ${msg.payload.type} at ${msg.payload.port} (lead time +${msg.payload.lead_time_penalty_days}d)`);
      } else if (msg.type === 'market_assessment') {
        console.log(`      🧠 Market Sensing: Risk Factor ${msg.payload.assessment?.risk_factor}, Penalty: +${msg.payload.assessment?.lead_time_penalty_days}d`);
      } else if (msg.type === 'inventory_forecast') {
        console.log(`      📦 Inventory Forecast: ${msg.payload.high_risk_count} SKUs at high stockout risk`);
      } else if (msg.type === 'hitl_card') {
        console.log(`      ⚠️  HITL ESCALATION: [${msg.payload.agent}] ${msg.payload.action_type} - $${msg.payload.cost_estimate}`);
        console.log(`         Reason: ${msg.payload.reason}`);
      } else if (msg.type === 'orchestrator_decision') {
        console.log(`      🎯 Meta-Orchestrator: "${msg.payload.arbitration?.final_decision}" (Est: $${msg.payload.arbitration?.total_cost})`);
      } else if (msg.type === 'lesson_written') {
        console.log(`      📝 Self-Evolution Lesson: [${msg.payload.agent}] ${msg.payload.lesson}`);
      } else if (msg.type === 'champion_updated') {
        console.log(`      🏆 Champion Evolved: ${msg.payload.old_version} ➔ ${msg.payload.new_version}`);
      }
    } catch (e) {
      console.log('   Raw WS:', raw.toString());
    }
  });

  await sleep(1000);

  // 4. Start Replay Simulation
  console.log('\n4️⃣ Starting Panama Canal Replay Simulation (/api/replay/start)...');
  const replayStart = await api('/api/replay/start', 'POST');
  console.log('   Replay start response:', replayStart.data);

  // 5. Let agents process events
  console.log('\n⏳ Running agent cycles over accelerated clock (~12 seconds)...');
  await sleep(12000);

  // 6. Check Pending HITL Cards
  console.log('\n5️⃣ Checking Pending HITL Cards (/api/hitl/pending)...');
  const hitlPending = await api('/api/hitl/pending');
  console.log(`   Pending approvals count: ${hitlPending.data?.length || 0}`);
  if (hitlPending.data && hitlPending.data.length > 0) {
    const card = hitlPending.data[0];
    console.log(`   Approving first HITL card (${card.id}) for $${card.cost_estimate}...`);
    const approveRes = await api(`/api/hitl/${card.id}/approve`, 'POST');
    console.log('   Approval result:', approveRes.data);
  }

  // 7. Stop Replay
  console.log('\n6️⃣ Stopping Replay (/api/replay/stop)...');
  const replayStop = await api('/api/replay/stop', 'POST');
  console.log('   Stop response:', replayStop.data);
  await sleep(2000);

  // 8. Inspect Decision Log
  console.log('\n7️⃣ Inspecting Audit Decision Log (/api/decisions?limit=5)...');
  const decisions = await api('/api/decisions?limit=5');
  console.log(`   Total decisions queried: ${decisions.data?.data?.length}`);
  decisions.data?.data?.slice(0, 3).forEach((d, i) => {
    console.log(`   [${i+1}] Agent: ${d.agent.padEnd(14)} | Event: ${d.event_type.padEnd(8)} | Level: ${d.autonomy_level} | Outcome: ${d.predicted_outcome}`);
  });

  // 9. Inspect Memory & Self-Evolution Chart Data
  console.log('\n8️⃣ Querying Self-Evolution "Prove-It" Chart Data (/api/memory/chart)...');
  const chartData = await api('/api/memory/chart');
  console.log('   Evolution chart data across replay phases:', chartData.data);

  console.log('\n9️⃣ Querying Stored Agent Lessons (/api/memory)...');
  const memoryLessons = await api('/api/memory');
  console.log(`   Stored lessons in episodic memory: ${memoryLessons.data?.length}`);
  if (memoryLessons.data?.length > 0) {
    console.log(`   Latest lesson: "${memoryLessons.data[0].lesson}"`);
  }

  console.log('\n🔟 Querying Champion / Challenger Version History (/api/memory/versions)...');
  const versions = await api('/api/memory/versions');
  console.log('   Versions:', versions.data);

  ws.close();
  console.log('\n========================================================');
  console.log('✅ All Tests Completed Successfully!');
  console.log('========================================================\n');
}

runTest().catch(err => {
  console.error('❌ Test failed with error:', err);
});
