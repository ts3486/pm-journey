-- migrations/20260127000001_scenarios.sql

-- Custom scenarios table
CREATE TABLE IF NOT EXISTS custom_scenarios (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    discipline TEXT NOT NULL CHECK (discipline IN ('BASIC', 'CHALLENGE')),
    mode TEXT NOT NULL,
    kickoff_prompt TEXT NOT NULL,
    passing_score REAL,
    supplemental_info TEXT,
     -- Complex nested objects → JSONB
    behavior JSONB,                        -- Optional ScenarioBehavior
    product JSONB NOT NULL,                -- Required product object
    evaluation_criteria JSONB NOT NULL,    -- Required array of RatingCriterion
    missions JSONB,      
    -- Timestamps (standard practice)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);  

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_custom_scenarios_discipline
    ON custom_scenarios(discipline);
CREATE INDEX IF NOT EXISTS idx_custom_scenarios_created_at
    ON custom_scenarios(created_at DESC);

-- Auto-update timestamp trigger (reuse existing function)
CREATE TRIGGER update_custom_scenarios_updated_at
    BEFORE UPDATE ON custom_scenarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();