-- Supply Chain AI Agent Schema
-- PostgreSQL 18 compatible, no pgvector required

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  workspace TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('operator', 'administrator')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE users ADD COLUMN IF NOT EXISTS token_invalid_before TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Seed demo users (password: password123)
INSERT INTO users (email, name, workspace, password_hash, role)
VALUES 
  ('demo@verdant.ai', 'Alex Morgan', 'Verdant Global', '$2b$12$UVtOjwe/S50e1kS0hDx69.jcCtJoCHXXS6J3T1orPF631JysN9v3i', 'administrator'),
  ('admin@verdant.ai', 'Operations Admin', 'Verdant Global', '$2b$12$UVtOjwe/S50e1kS0hDx69.jcCtJoCHXXS6J3T1orPF631JysN9v3i', 'administrator')
ON CONFLICT (email) DO NOTHING;

CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  region TEXT,
  lead_time_days INT,
  approved BOOLEAN DEFAULT true,
  cost_per_unit NUMERIC
);

CREATE TABLE IF NOT EXISTS ports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT,
  status TEXT DEFAULT 'operational'
);

CREATE TABLE IF NOT EXISTS routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_port UUID REFERENCES ports(id),
  to_port UUID REFERENCES ports(id),
  transit_days INT,
  risk_multiplier NUMERIC DEFAULT 1.0
);

CREATE TABLE IF NOT EXISTS skus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  current_inventory INT,
  reorder_point INT,
  daily_demand INT
);

CREATE TABLE IF NOT EXISTS decision_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  agent TEXT NOT NULL,
  event_type TEXT NOT NULL,
  input_summary TEXT,
  decision TEXT,
  predicted_outcome TEXT,
  actual_outcome TEXT,
  cost_estimate NUMERIC,
  autonomy_level TEXT,
  replay_phase INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS hitl_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  decision_log_id UUID REFERENCES decision_log(id),
  agent TEXT NOT NULL,
  action_type TEXT NOT NULL,
  description TEXT,
  cost_estimate NUMERIC,
  status TEXT DEFAULT 'pending',
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT
);

-- Memory table using full-text search (no pgvector needed)
CREATE TABLE IF NOT EXISTS agent_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  agent TEXT NOT NULL,
  situation_summary TEXT,
  lesson TEXT NOT NULL,
  search_vector TSVECTOR,
  replay_phase INT,
  outcome_score NUMERIC
);

CREATE INDEX IF NOT EXISTS idx_memory_search ON agent_memory USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_memory_agent ON agent_memory(agent);

-- Auto-update search_vector from situation_summary + lesson
CREATE OR REPLACE FUNCTION update_memory_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    coalesce(NEW.situation_summary, '') || ' ' || coalesce(NEW.lesson, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS memory_search_vector_trigger ON agent_memory;
CREATE TRIGGER memory_search_vector_trigger
BEFORE INSERT OR UPDATE ON agent_memory
FOR EACH ROW EXECUTE FUNCTION update_memory_search_vector();

-- Champion/Challenger versions
CREATE TABLE IF NOT EXISTS agent_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  version_tag TEXT NOT NULL,
  alert_threshold NUMERIC DEFAULT 0.15,
  budget_limit NUMERIC DEFAULT 10000,
  prompt_suffix TEXT DEFAULT '',
  replay_score NUMERIC,
  is_champion BOOLEAN DEFAULT false
);

-- Seed initial champion version
INSERT INTO agent_versions (version_tag, alert_threshold, budget_limit, replay_score, is_champion)
SELECT 'v1', 0.15, 10000, 999, true
WHERE NOT EXISTS (SELECT 1 FROM agent_versions WHERE version_tag = 'v1');

-- Seed world model data
INSERT INTO ports (name, country, status)
SELECT * FROM (VALUES
  ('Panama Canal', 'Panama', 'disrupted'),
  ('Port of Balboa', 'Panama', 'congested'),
  ('Port of Los Angeles', 'USA', 'operational'),
  ('Port of Manzanillo', 'Mexico', 'operational')
) AS v(name, country, status)
WHERE NOT EXISTS (SELECT 1 FROM ports LIMIT 1);

INSERT INTO suppliers (name, region, lead_time_days, approved, cost_per_unit)
SELECT * FROM (VALUES
  ('US Primary Supplier', 'North America', 14, true, 120.00),
  ('Mexican Alt Supplier', 'Latin America', 10, true, 135.00),
  ('Asian Supplier', 'Asia Pacific', 28, true, 95.00)
) AS v(name, region, lead_time_days, approved, cost_per_unit)
WHERE NOT EXISTS (SELECT 1 FROM suppliers LIMIT 1);

INSERT INTO skus (name, current_inventory, reorder_point, daily_demand)
SELECT * FROM (VALUES
  ('Engine Component A', 500, 200, 45),
  ('Assembly Part B', 300, 150, 30),
  ('Component C', 800, 300, 60)
) AS v(name, current_inventory, reorder_point, daily_demand)
WHERE NOT EXISTS (SELECT 1 FROM skus LIMIT 1);
