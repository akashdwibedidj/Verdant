# Verdant — Technical Project Brief

## 1. Overview

Verdant is a Node.js/Express service that replays a fixed set of supply-chain disruption events, evaluates their impact on inventory and logistics, proposes procurement or routing actions, and records the resulting decisions in PostgreSQL. A market-sensing agent, inventory agent, logistics agent, procurement agent, and meta-orchestrator form the decision pipeline. Google Gemini is used for market assessment, logistics/procurement proposals, and final arbitration; deterministic fallbacks are used when Gemini fails. The service exposes authenticated HTTP APIs and an authenticated WebSocket stream, while the tracked React/Vite frontend provides dashboard views for the same data. The project also contains a separate `security/` application for a craft-image listing prototype; it is not connected to the root application.

**Evidence:** `server.js` (`worldModel.load`, route mounting, WebSocket upgrade), `world/replayEngine.js` (`start`), `agents/*.js`, `db/schema.sql`, `frontend/src/App.jsx`, `security/server.js`.

## 2. File map

### Root files

| Path | Purpose |
|---|---|
| `server.js` | Root Express API, CORS/origin handling, rate limiting, authenticated WebSocket server, and startup. |
| `package.json` | Root runtime dependencies; it has no npm scripts. |
| `package-lock.json` | Root dependency lockfile. |
| `.env.example` | Names of root runtime configuration variables; values are intentionally not reproduced here. |
| `.gitignore` | Ignores dependencies, environment files, build output, logs, and editor metadata. |
| `test_all.js` | Intended end-to-end replay/API/WebSocket smoke runner. |
| `test_connection.js` | Intended health, login, API, signup, and WebSocket connection smoke runner. |
| `README.md` | Repository documentation. |
| `TECHNICAL_PROJECT_BRIEF.md` | This code-based technical brief. |
| `.txt` | Unnamed root note; not runtime code. |
| `PS1_logic.txt` | Design notes about shared world state, typed messages, autonomy, memory, and replay. |
| `PS1 - Self-Evolving AI Agent Networks for Global Supply Chains.pdf` | Reference/design document. |
| `PS2 - Autonomous Enterprise AI Architecture Plan.pdf` | Reference/design document. |

### Backend folders

| Folder/file | Purpose |
|---|---|
| `agents/marketSensingAgent.js` | Validates replay events, retrieves lessons, and produces a risk assessment. |
| `agents/inventoryAgent.js` | Computes SKU stockout forecasts deterministically. |
| `agents/logisticsAgent.js` | Uses Gemini to propose a reroute or supplier switch and applies autonomy thresholds. |
| `agents/procurementAgent.js` | Uses Gemini to propose procurement action for high-risk SKUs and applies autonomy thresholds. |
| `agents/metaOrchestrator.js` | Runs specialist agents and arbitrates their proposals with Gemini. |
| `data/panama_replay.js` | Seven static replay events covering a 72-hour illustrative Panama Canal scenario. |
| `db/client.js` | Creates the root PostgreSQL connection pool from environment variables. |
| `db/schema.sql` | PostgreSQL tables, indexes, trigger, seed rows, and initial world-model data. |
| `db/seed_users.js` | Rehashes and seeds the two demo users. |
| `lib/gemini.js` | Direct HTTPS client for Gemini and markdown-fenced JSON parsing. |
| `lib/schemas.js` | Zod schemas for events, forecasts, plans, actions, and Gemini plans. |
| `lib/broadcast.js` | Broadcasts JSON events to connected WebSocket clients. |
| `middleware/auth.js` | Reads JWTs from bearer headers, cookies, or query tokens; verifies sessions and roles. |
| `memory/memoryStore.js` | Writes lessons and retrieves similar lessons with PostgreSQL full-text search. |
| `memory/lessonWriter.js` | Summarizes each replay phase into memory and triggers evaluation every third phase. |
| `memory/evaluator.js` | Creates a threshold/budget challenger and may promote it over the champion. |
| `world/worldModel.js` | Singleton cache of suppliers, ports, routes, and SKUs loaded from PostgreSQL. |
| `world/replayEngine.js` | Schedules replay events, invokes the agent pipeline, and starts lesson writing on stop. |
| `routes/auth.js` | Root signup, login, logout, and current-user routes. |
| `routes/status.js` | Authenticated world-model snapshot route. |
| `routes/decisions.js` | Authenticated paginated decision-log route. |
| `routes/replay.js` | Authenticated replay start/stop routes. |
| `routes/hitl.js` | Pending HITL list and administrator approval/rejection routes. |
| `routes/memory.js` | Lesson, chart, and agent-version routes. |

### Frontend folder

The following frontend files are tracked in `HEAD` but are marked deleted in the current worktree (`git status` reports `D frontend/...`). They are therefore part of the repository history, but cannot run from the current checkout until restored.

| Path | Purpose |
|---|---|
| `frontend/package.json` | Vite/React/Leaflet dependency manifest and `dev`, `build`, and `preview` scripts. |
| `frontend/package-lock.json` | Frontend dependency lockfile. |
| `frontend/index.html` | Vite HTML entrypoint. |
| `frontend/src/main.jsx` | React DOM bootstrap. |
| `frontend/src/App.jsx` | Authenticated shell, navigation, command center, agent network, replay controls, and WebSocket event count. |
| `frontend/src/AuthPage.jsx` | Login and signup form. |
| `frontend/src/GlobalMap.jsx` | Leaflet map of port/world-model units. |
| `frontend/src/MarketSignals.jsx` | Direct GDELT news retrieval, headline classification, filters, and signal details. |
| `frontend/src/DecisionLogs.jsx` | Decision-log list and detail view with approval/rejection UI state. |
| `frontend/src/SettingsPage.jsx` | Frontend theme/settings view. |
| `frontend/src/components/LoadingState.jsx` | Loading/status component. |
| `frontend/src/data/api.js` | Backend HTTP adapter and authenticated WebSocket connector. |
| `frontend/src/data/authApi.js` | Login/signup wrappers. |
| `frontend/src/data/mockApi.js` | Backend adapters with synthetic fallback data and simulated latency. |
| `frontend/src/data/mockData.js` | Static dashboard, agent-network, notification, and map data. |
| `frontend/src/styles.css` | Frontend styles. |
| `frontend/tailwind.config.js` | Tailwind configuration. |
| `frontend/postcss.config.js` | PostCSS configuration. |

### Separate `security/` folder

| Path | Purpose |
|---|---|
| `security/package.json` | Separate `kalaseo` Express application manifest. |
| `security/package-lock.json` | Separate application lockfile. |
| `security/server.js` | Separate cookie-authenticated craft image/audio scan server and static-page server. |
| `security/auth.js` | Cookie-only JWT middleware for that application. |
| `security/db.js` | PostgreSQL pool using `DATABASE_URL`. |
| `security/public/` | Referenced by `security/server.js`, but not present in the repository. |
| `security/middleware/auth.js` | Referenced by `security/server.js`, but not present in the repository; `security/auth.js` exists instead. |

## 3. Data flow

### Root replay flow

1. An authenticated client sends `POST /api/replay/start` to `routes/replay.js`, which calls `replayEngine.start(global.wss)`.
2. `ReplayEngine.start` reads the next replay phase from `decision_log`, broadcasts `replay_started`, and schedules items from `data/panama_replay.js` using `REAL_MS_PER_REPLAY_HOUR = 125`.
3. For each scheduled item, `ReplayEngine.start` broadcasts `replayed_event` and calls `MarketSensingAgent.process(item.event, phase)`.
4. `marketSensingAgent.process` validates the event with `Event.parse`, calls `memoryStore.getSimilarLessons`, calls `callGemini`, parses with `parseGeminiJSON`, logs a `market_sensing` decision, broadcasts `market_assessment`, and returns `{ event, assessment }`.
5. `MetaOrchestrator.process` calls `getChampion`, then runs `InventoryAgent.process` and `LogisticsAgent.process` concurrently with `Promise.all`.
6. `InventoryAgent.process` reads `worldModel.skus`, computes adjusted stockout hours/risk, logs an `inventory` decision, broadcasts `inventory_forecast`, and returns `{ forecasts, highRisk }`.
7. `LogisticsAgent.process` reads `worldModel.ports`, retrieves lessons, calls Gemini, validates the result with `GeminiPlan.parse`, applies the champion budget/risk rule, logs a decision, optionally inserts a `hitl_cards` row, broadcasts `agent_decision`, and returns its plan/autonomy level.
8. If `highRisk.length > 0`, `MetaOrchestrator.process` calls `ProcurementAgent.process`. Procurement reads approved suppliers, retrieves lessons, calls/validates Gemini, applies the same autonomy rule, optionally creates a HITL card, broadcasts its decision, and returns its plan/autonomy level.
9. `MetaOrchestrator.process` builds a proposal object and calls Gemini once more to produce arbitration. It logs the arbitration to `decision_log`, broadcasts `orchestrator_decision`, and returns the arbitration.
10. When the replay ends or `POST /api/replay/stop` calls `ReplayEngine.stop`, `LessonWriter.writeLessons(phase)` groups decisions by agent, writes one `agent_memory` lesson per agent, broadcasts `lesson_written`, and calls `Evaluator.evaluate` when `phase % 3 === 0`.

### Other inputs

- `GET /api/status` calls `worldModel.snapshot` and returns the in-memory database-loaded model.
- `GET /api/decisions` reads `decision_log` directly.
- `GET /api/hitl/pending`, approval, and rejection routes read/update `hitl_cards` and related `decision_log` rows.
- `GET /api/memory`, `/chart`, and `/versions` read lessons, aggregate scores, or agent versions.
- The frontend `MarketSignals` page independently calls the external GDELT endpoint every five minutes; that path does not enter the backend agent pipeline (`frontend/src/MarketSignals.jsx`, `refresh`).
- The separate `security/server.js` accepts an image and optional audio at `POST /api/scan`, builds a multimodal Gemini request, and returns parsed craft listings. It is not mounted by root `server.js`.

## 4. Agents

| Agent | Job and trigger | Reads | Returns | LLM? | Coordination |
|---|---|---|---|---|---|
| Market sensing — `agents/marketSensingAgent.js`, `process` | Triggered once per replay event by `ReplayEngine.start`. | Raw replay event, `agent_memory` lessons through `memoryStore.getSimilarLessons`. | `{ event, assessment }`; assessment contains risk factor, lead-time penalty, affected routes, and reasoning. | Yes, one Gemini call; fallback maps event severity/penalty directly. | First agent in the pipeline; its assessment is passed to the orchestrator. |
| Inventory — `agents/inventoryAgent.js`, `process` | Triggered by `MetaOrchestrator.process` for every event. | `worldModel.skus`, market assessment. | Forecast per SKU plus `highRisk` forecasts where `stockout_risk > 0.5`. | No. | Runs in parallel with logistics. Its `highRisk` result gates procurement. |
| Logistics — `agents/logisticsAgent.js`, `process` | Triggered by the orchestrator for every event. | Event, assessment, champion version, `worldModel.ports`, similar lessons. | A validated plan and `autonomyLevel` (`autonomous` or `hitl_required`). | Yes, one Gemini call plus Zod validation; fallback reroute plan on error. | Runs in parallel with inventory; sends HITL card if thresholds fail. |
| Procurement — `agents/procurementAgent.js`, `process` | Triggered only when inventory reports at least one high-risk SKU. | Forecasts, assessment, champion version, approved suppliers, similar lessons. | A validated plan and `autonomyLevel`; may create a HITL card. | Yes, one Gemini call plus Zod validation; fallback emergency PO on error. | Runs after inventory and is skipped when no SKU is high risk. |
| Meta-orchestrator — `agents/metaOrchestrator.js`, `process` | Triggered after market sensing for each event. | Specialist outputs, event assessment, current champion version. | Gemini arbitration containing final decision, total cost, lead-time impact, and confidence. | Yes, one Gemini call; fallback creates a textual summary and cost sum. | Coordinates all agents; it does not implement a formal conflict vote. It gives Gemini all proposals and lets the final arbitration choose the result. |

No agent directly executes a purchase, shipment reroute, supplier switch, or inventory mutation. The code logs and broadcasts recommendations.

## 5. LLM usage

### Provider and model

`lib/gemini.js` sends HTTPS POST requests to Google’s Generative Language API using the model path `gemini-3.5-flash-lite:generateContent`. The separate `security/server.js` uses the same model path for craft image/audio analysis.

### Root prompts

The prompts are assembled as template strings in each agent:

- Market sensing: `"You are a supply chain market sensing agent. Your job is to assess a disruption event and output a risk assessment."` It appends retrieved lessons and requires `"Output ONLY valid JSON"` with `risk_factor`, `lead_time_penalty_days`, `affected_routes`, and `reasoning`.
- Logistics: `"You are a supply chain logistics routing agent. Your job is to propose the best rerouting action given a port disruption."` It appends lessons and available ports and requires a `reroute` or `supplier_switch` plan.
- Procurement: `"You are a supply chain procurement agent. Your job is to propose ONE procurement action to address stockout risk."` It appends lessons and approved suppliers and requires an `emergency_po`, `buffer_stock`, or `supplier_switch` plan.
- Orchestrator: `"You are the supply chain meta-orchestrator. Your job is to review agent proposals and produce a final arbitrated decision."` It appends the proposal JSON and risk factor and requires final decision, cost, lead-time impact, and confidence.
- Separate security scan: `"You are a GI craft SEO expert..."` or `"Analyze this handcraft image."` It requires multilingual listing JSON and optionally an artisan transcription.

### Call count and output handling

For one replay event:

- Market sensing: 1 call.
- Inventory: 0 calls.
- Logistics: 1 call.
- Procurement: 0 or 1 call, depending on `highRisk.length`.
- Orchestrator: 1 call.

Therefore the normal total is **3 calls without procurement** or **4 calls when procurement is triggered**. There are no retries. `callGemini` uses temperature `0.2` and `maxOutputTokens: 1024`; it extracts the first returned text part. `parseGeminiJSON` removes JSON code fences and calls `JSON.parse`.

Validation is uneven:

- `Event.parse` validates replay input.
- `GeminiPlan.parse` validates logistics and procurement plans.
- Market assessments and orchestrator arbitration are parsed as unvalidated JSON objects.
- The security scan parses JSON but has no Zod schema.

The only token/input reduction behavior is incidental retrieval limiting: `memoryStore.getSimilarLessons` uses at most eight significant words and returns at most `topK` rows, normally three. There is no prompt cache, response cache, token counter, compression pass, or measured token-saving implementation.

## 6. Memory and database

### PostgreSQL tables

`db/schema.sql` defines these tables:

| Table | Columns |
|---|---|
| `users` | `id UUID`, `email TEXT`, `name TEXT`, `workspace TEXT`, `password_hash TEXT`, `role TEXT`, `created_at TIMESTAMPTZ`, `token_invalid_before TIMESTAMPTZ` |
| `suppliers` | `id UUID`, `name TEXT`, `region TEXT`, `lead_time_days INT`, `approved BOOLEAN`, `cost_per_unit NUMERIC` |
| `ports` | `id UUID`, `name TEXT`, `country TEXT`, `status TEXT` |
| `routes` | `id UUID`, `from_port UUID`, `to_port UUID`, `transit_days INT`, `risk_multiplier NUMERIC` |
| `skus` | `id UUID`, `name TEXT`, `current_inventory INT`, `reorder_point INT`, `daily_demand INT` |
| `decision_log` | `id UUID`, `timestamp TIMESTAMPTZ`, `agent TEXT`, `event_type TEXT`, `input_summary TEXT`, `decision TEXT`, `predicted_outcome TEXT`, `actual_outcome TEXT`, `cost_estimate NUMERIC`, `autonomy_level TEXT`, `replay_phase INT` |
| `hitl_cards` | `id UUID`, `created_at TIMESTAMPTZ`, `decision_log_id UUID`, `agent TEXT`, `action_type TEXT`, `description TEXT`, `cost_estimate NUMERIC`, `status TEXT`, `resolved_at TIMESTAMPTZ`, `resolved_by TEXT` |
| `agent_memory` | `id UUID`, `created_at TIMESTAMPTZ`, `agent TEXT`, `situation_summary TEXT`, `lesson TEXT`, `search_vector TSVECTOR`, `replay_phase INT`, `outcome_score NUMERIC` |
| `agent_versions` | `id UUID`, `created_at TIMESTAMPTZ`, `version_tag TEXT`, `alert_threshold NUMERIC`, `budget_limit NUMERIC`, `prompt_suffix TEXT`, `replay_score NUMERIC`, `is_champion BOOLEAN` |

The schema creates indexes on user email, memory search vector, and memory agent. It defines `update_memory_search_vector`, a trigger that builds `search_vector` with PostgreSQL `to_tsvector('english', ...)`.

### What counts as memory

`memoryStore.writeLesson` stores one textual lesson per agent and replay phase in `agent_memory`. `memoryStore.getSimilarLessons` turns significant words into a PostgreSQL `to_tsquery` and orders matches by `outcome_score` and recency. If that search fails, it returns the most recent lessons.

This is textual episodic memory backed by PostgreSQL full-text search. There is **no pgvector, vector database, embedding model, similarity-vector library, or embedding generation** in the package manifests or source.

`actual_outcome` exists in `decision_log`, but `lessonWriter.writeLessons` calculates `outcome_score` from total estimated cost and does not populate actual outcomes.

## 7. API and real-time

### Root application routes

All root API routes are mounted in `server.js`. Except `/health` and unauthenticated auth operations, they use `middleware/auth.js`.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/health` | No | Returns service health and current timestamp. |
| `POST` | `/api/auth/signup` | No | Validates fields, hashes password, creates an administrator, and issues a session. |
| `POST` | `/api/auth/login` | No | Validates credentials, compares bcrypt hash, and issues a JWT session. |
| `POST` | `/api/auth/logout` | No | Invalidates the current cookie session timestamp when possible and clears the cookie. |
| `GET` | `/api/auth/me` | Yes | Returns the current user profile. |
| `GET` | `/api/status` | Yes | Returns the `worldModel.snapshot()` of suppliers, ports, routes, and SKUs. |
| `GET` | `/api/decisions` | Yes | Returns `decision_log` rows with `page` and `limit` pagination parameters. |
| `POST` | `/api/replay/start` | Yes | Starts the accelerated replay. |
| `POST` | `/api/replay/stop` | Yes | Stops the replay and invokes lesson writing. |
| `GET` | `/api/hitl/pending` | Yes | Lists pending HITL cards and related decision fields. |
| `POST` | `/api/hitl/:id/approve` | Yes, administrator | Marks a pending card approved and updates its decision autonomy value. |
| `POST` | `/api/hitl/:id/reject` | Yes, administrator | Marks a pending card rejected and updates its decision autonomy value. |
| `GET` | `/api/memory` | Yes | Returns all stored lessons. |
| `GET` | `/api/memory/chart` | Yes | Aggregates average memory outcome score and count by replay phase. |
| `GET` | `/api/memory/versions` | Yes | Returns agent version history. |

### WebSocket

The root WebSocket server is attached to the same HTTP port in `server.js`. The upgrade handler validates origin, reads a token with `readToken`, verifies the JWT, and checks `token_invalid_before`.

Server-to-client messages are emitted by `broadcast` and include `{ type, payload, ts }`. Types used in the code are:

`connected`, `pong`, `replay_started`, `replay_stopped`, `replayed_event`, `market_assessment`, `inventory_forecast`, `agent_decision`, `hitl_card`, `orchestrator_decision`, `lesson_written`, `champion_updated`, and `hitl_resolved`.

The client can send `{ "type": "ping" }`; `server.js` responds with `{ "type": "pong" }`.

### Separate security application routes

`security/server.js` defines a second app on its own default port:

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/register` | No | Registers a username/password account in the security app’s expected schema. |
| `POST` | `/api/auth/login` | No, rate limited | Authenticates username/password and sets a cookie. |
| `POST` | `/api/auth/logout` | No | Clears the security app cookie. |
| `GET` | `/api/auth/me` | Cookie required | Returns the JWT username. |
| `POST` | `/api/scan` | Cookie required | Sends an image and optional audio to Gemini and returns craft listing JSON. |
| `GET` | `/` | No | Serves `public/index.html`, which is absent from the repository. |
| `GET` | `/login` | No | Serves `public/login.html`, which is absent. |
| `GET` | `/register` | No | Serves `public/register.html`, which is absent. |

## 8. Human-in-the-loop, safety, and security

### Escalation

`logisticsAgent.process` and `procurementAgent.process` compare `plan.cost_estimate` with `champion.budget_limit` and `assessment.risk_factor` with `champion.alert_threshold`. If either condition exceeds the threshold, the agent uses `autonomyLevel = 'hitl_required'`, inserts a pending row in `hitl_cards`, and broadcasts `hitl_card`.

Only a user with `role === 'administrator'` can call the approval/rejection handlers in `routes/hitl.js`. Approval/rejection updates the card and related `decision_log` row and broadcasts `hitl_resolved`.

The system does not execute the approved action after approval; it records the status change.

### Authentication and validation

- Root authentication uses JWTs signed with `JWT_SECRET`, issued by `issueSession` in `routes/auth.js`.
- Tokens can be supplied through `Authorization: Bearer`, the `token` cookie, or a query token via `readToken`.
- `authMiddleware` verifies the JWT and checks the database user’s `token_invalid_before`.
- Logout writes `NOW()` to `token_invalid_before` for the current user.
- Passwords use bcrypt cost 12.
- Signup/login request bodies use Zod schemas in `routes/auth.js`.
- Root API traffic is rate limited to 600 requests per 15 minutes in `server.js`; login has an additional limit of 100 attempts per 15 minutes.
- `helmet`, JSON body-size limits, origin checks, CORS headers, parameterized SQL, and administrator role checks are present.
- WebSocket upgrades repeat JWT and revocation checks before calling `handleUpgrade`.

The root code does not implement CSRF tokens, refresh-token rotation, account recovery, or action execution safeguards beyond the threshold/HITL decision. Query-token authentication also exposes a token transport intended for WebSocket compatibility.

## 9. Frontend

The frontend implementation is tracked but currently deleted in the worktree. Its main screens and data are:

| Page/component | Data shown and source |
|---|---|
| `App.jsx` / `CommandCenter` | Threat summary, stockout forecast, cost variance, network health, alerts, volatility chart, replay controls, and WebSocket event count. It calls `fetchCommandCenterData`, `/api/replay/start`, `/api/replay/stop`, and `connectLiveStream`. |
| `App.jsx` / `AgentNetwork` | Static agent topology, synthetic activity statistics, agent status, and animated SVG connections from `mockData.js`/`mockApi.js`. |
| `GlobalMap.jsx` | Port/world-model units from `/api/status` through `fetchGlobalUnits`, with mock fallback coordinates/data. |
| `MarketSignals.jsx` | Recent GDELT articles from `https://api.gdeltproject.org/api/v2/doc/doc`, classified by headline into logistics, geopolitical, weather, commodity, or supplier risk. |
| `DecisionLogs.jsx` | Decision records from `/api/decisions?limit=50`, with local display transformations and fallback `initialDecisions`. |
| `AuthPage.jsx` | Login/signup form using `demoLogin` and `demoSignUp`; the UI displays demo-credential text in source, but those values are not reproduced here. |
| `SettingsPage.jsx` | Theme/settings UI; theme is stored in browser local storage. |
| `frontend/src/data/api.js` | Adds the stored session token to API requests and connects to the backend WebSocket. |
| `frontend/src/data/mockApi.js` | Uses real root APIs for status/decisions/HITL where implemented, then falls back to generated or static data when requests fail. |

The frontend is not a pure backend view: `AgentNetwork`, notifications, chart series, and fallback dashboard metrics are mock/synthetic; `MarketSignals` is a direct external browser request rather than a root backend integration.

## 10. Tests

There is no root test script in `package.json`, and neither test file is a unit-test framework suite.

### `test_all.js`

`runTest` is intended to:

1. Check `/health`.
2. Query `/api/status`.
3. Open a WebSocket and print recognized event types.
4. Start `/api/replay/start`.
5. Wait approximately 12 seconds for the accelerated replay.
6. Query `/api/hitl/pending` and attempt to approve the first card.
7. Stop the replay.
8. Query `/api/decisions?limit=5`.
9. Query `/api/memory/chart`, `/api/memory`, and `/api/memory/versions`.

The checked-out source contains a malformed/redacted-looking `Authorization` template in the `headers` declaration, so this script should not be treated as runnable without repair.

### `test_connection.js`

`run` is intended to:

1. Check `/health`.
2. Log in as the demo user.
3. Call `/api/auth/me`, `/api/status`, `/api/decisions`, and `/api/hitl/pending`.
4. Create a new account with `/api/auth/signup`.
5. Open a tokenized WebSocket connection, send `ping`, and expect a message.

It also contains malformed/redacted-looking `Authorization` template fragments in the checked-out source, so a fresh clone cannot be assumed to pass this script.

## 11. Feature verification table

| Feature | Status | Evidence | Explanation |
|---|---|---|---|
| Reflexion or self-reflection loop | Partially | `memory/lessonWriter.js` — `writeLessons`; `memory/evaluator.js` — `evaluate` | The system writes textual lessons and evaluates champion/challenger thresholds, but does not compare actual outcomes or run an LLM self-critique/reflection loop. |
| DSPy or automated prompt optimization | Not present | `package.json`; repository imports | No DSPy dependency, prompt optimizer, or automated prompt search exists. |
| pgvector or any vector/episodic memory | Partially | `db/schema.sql`; `memory/memoryStore.js` — `getSimilarLessons` | Textual episodic lessons and PostgreSQL full-text search exist; pgvector, embeddings, and vector similarity do not. |
| Monte Carlo or digital-twin simulation | Not present | `world/replayEngine.js` — `start`; `data/panama_replay.js` | The code has a deterministic accelerated event replay, not Monte Carlo sampling or a digital-twin simulator. |
| MCP (Model Context Protocol) | Not present | `package.json`; repository imports | No MCP package, server, client, or tool registration is present. |
| SAP / NetSuite or ERP integration | Not present | `agents/*.js`; `package.json` | Agents read local PostgreSQL world-model rows and do not connect to an ERP. |
| Real AIS vessel or weather API integration | Mock/hardcoded | `data/panama_replay.js`; `frontend/src/MarketSignals.jsx` | Backend events are static replay data; the frontend calls GDELT news, but there is no AIS or weather provider integration. |
| Token-usage reduction (“45%” claim) | Not present | `lib/gemini.js`; `memory/memoryStore.js` | The code sets a 1,024-token output limit and limits retrieved lesson words/rows, but records no token usage and measures no percentage reduction. |
| LangChain, LangGraph, or AutoGen | Not present | `package.json`; repository imports | None of these packages is declared or imported. |
| Human-in-the-loop approval flow | Implemented | `agents/logisticsAgent.js` — `process`; `agents/procurementAgent.js` — `process`; `routes/hitl.js` | Threshold failures create pending cards; administrators can approve or reject them, and the decision log is updated. |
| WebSocket real-time updates | Implemented | `server.js`; `lib/broadcast.js` — `broadcast` | Authenticated clients receive replay, assessment, decision, HITL, lesson, and champion events. |
| JWT authentication | Implemented | `routes/auth.js` — `issueSession`; `middleware/auth.js` — `authMiddleware`; `server.js` upgrade handler | Root routes and WebSocket upgrades verify JWTs and check database-based token invalidation. |
| Decision replay | Implemented | `world/replayEngine.js` — `start`; `data/panama_replay.js` | An accelerated, process-local replay emits seven static disruption events and passes each through the agent pipeline. |

## 12. Data sources

| Data category | Classification | Evidence |
|---|---|---|
| Ports, suppliers, SKUs, and champion version | Seeded database data | `db/schema.sql` inserts initial rows if tables are empty. |
| Routes | Database-backed, but no route seed rows are included in `db/schema.sql` | `world/worldModel.js` loads `routes`; schema defines the table without inserting routes. |
| Disruption events | Hardcoded sample/replay data | `data/panama_replay.js` contains seven events labeled replayed and inspired by Panama Canal drought restrictions. |
| Agent decisions and lessons | Runtime-generated database data | `agents/*.js`, `memory/lessonWriter.js`, and `db/schema.sql`. |
| Gemini assessments/proposals | External runtime service | `lib/gemini.js` calls Google’s Generative Language API. |
| Frontend dashboard fallback data | Mock/hardcoded | `frontend/src/data/mockData.js` and fallback branches in `frontend/src/data/mockApi.js`. |
| Frontend market headlines | External runtime data | `frontend/src/MarketSignals.jsx` calls GDELT directly from the browser. |
| Security app scan input | User-provided image/audio sent to Gemini | `security/server.js` — `POST /api/scan`. |

No live port, supplier, route, inventory, AIS, weather, ERP, or shipment execution feed is connected.

## 13. Known gaps

- The frontend files are tracked but currently deleted in the worktree, so the dashboard cannot be run from this checkout without restoring them.
- The root `package.json` has no `start`, `dev`, or `test` scripts.
- `test_all.js` and `test_connection.js` contain malformed/redacted-looking authorization string fragments and require repair before execution.
- `routes/decisions.js` parses `page` and `limit` but does not enforce positive bounds or a maximum page size.
- Market assessments and orchestrator arbitration are not validated with Zod after JSON parsing; only events and Gemini plans receive schema validation.
- `decision_log.actual_outcome` is never populated by the active agent/replay code, so the memory score is estimated cost rather than measured outcome quality.
- The replay is process-local and has no persistence of running state, distributed lock, or worker queue.
- HITL approval changes database status but does not execute the approved plan.
- `worldModel.updatePortStatus` and `updateRouteRisk` exist, but no root route invokes them.
- The evaluator uses random threshold/budget mutations and a simplified cost score; it does not run a true challenger replay or provide rollback.
- `db/schema.sql` seeds users with a stored bcrypt hash, while `db/seed_users.js` can refresh those hashes; credentials are not configurable through the schema.
- The separate `security/server.js` expects missing `security/middleware/auth.js` and `security/public/*` paths, uses a different user schema and database configuration, and is not integrated with `server.js`.
- The separate security app's `/api/scan` accepts base64 image/audio payloads under a 10 MB JSON body limit but has no Zod response schema.
- No deployment files, migration framework, CI workflow, observability/metrics system, token accounting, or production data connectors are present.

## 14. Resume-safe summary

- Implemented an authenticated Express/PostgreSQL supply-chain replay service with JWT sessions, role checks, bcrypt password hashing, and session revocation.
- Implemented a coordinated multi-agent pipeline for market sensing, deterministic inventory forecasting, logistics planning, procurement planning, and Gemini-based arbitration.
- Implemented threshold-based human approval cards for logistics and procurement recommendations with administrator approval/rejection endpoints.
- Implemented accelerated decision replay with PostgreSQL audit logging, textual lesson memory, champion/challenger version records, and authenticated WebSocket event streaming.
- Implemented a tracked React/Vite dashboard architecture with command center, agent network, global map, decision logs, settings, and GDELT-backed market-signal views; the frontend files must be restored in the current worktree before use.
