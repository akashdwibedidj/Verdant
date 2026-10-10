const replayData = require('../data/panama_replay');
const { broadcast } = require('../lib/broadcast');
const MarketSensingAgent = require('../agents/marketSensingAgent');
const MetaOrchestrator = require('../agents/metaOrchestrator');

// 72 hours replayed in 3 minutes = 1440x speed
// Each hour = 125ms real time
const REAL_MS_PER_REPLAY_HOUR = 125;

class ReplayEngine {
  constructor() {
    this.running = false;
    this.timer = null;
    this.currentPhase = 1;
  }

  async start(wss) {
    if (this.running) return { error: 'Already running' };
    this.running = true;
    this.wss = wss;

    // Get current replay phase
    const pool = require('../db/client');
    const res = await pool.query('SELECT COALESCE(MAX(replay_phase), 0) + 1 AS phase FROM decision_log');
    this.currentPhase = parseInt(res.rows[0].phase);

    console.log(`[ReplayEngine] Starting replay phase ${this.currentPhase}`);
    broadcast(wss, 'replay_started', { phase: this.currentPhase, total_events: replayData.length });

    let idx = 0;

    const scheduleNext = () => {
      if (!this.running || idx >= replayData.length) {
        this.stop();
        return;
      }

      const item = replayData[idx];
      const delay = item.t_hours * REAL_MS_PER_REPLAY_HOUR;
      const prev = idx > 0 ? replayData[idx - 1].t_hours : 0;
      const waitMs = (item.t_hours - prev) * REAL_MS_PER_REPLAY_HOUR;

      this.timer = setTimeout(async () => {
        console.log(`[ReplayEngine] Emitting event at t+${item.t_hours}h: ${item.event.type}`);
        broadcast(wss, 'replayed_event', item.event);

        // Fire agent pipeline
        try {
          const assessment = await MarketSensingAgent.process(item.event, this.currentPhase);
          await MetaOrchestrator.process(assessment, item.event, this.currentPhase);
        } catch (err) {
          console.error('[ReplayEngine] Agent error:', err.message);
        }

        idx++;
        scheduleNext();
      }, waitMs);
    };

    scheduleNext();
    return { started: true, phase: this.currentPhase };
  }

  stop() {
    this.running = false;
    if (this.timer) clearTimeout(this.timer);
    console.log('[ReplayEngine] Stopped');
    broadcast(this.wss, 'replay_stopped', { phase: this.currentPhase });

    // Trigger lesson writing after replay ends
    const LessonWriter = require('../memory/lessonWriter');
    LessonWriter.writeLessons(this.currentPhase).catch(console.error);
  }
}

module.exports = new ReplayEngine();
