-- Add scenario_type and feature_mockup columns to custom_scenarios
ALTER TABLE custom_scenarios ADD COLUMN IF NOT EXISTS scenario_type TEXT CHECK (scenario_type IN ('basic', 'test-case'));
ALTER TABLE custom_scenarios ADD COLUMN IF NOT EXISTS feature_mockup JSONB;

-- Test cases table for test-case scenario type
CREATE TABLE IF NOT EXISTS test_cases (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    preconditions TEXT NOT NULL,
    steps TEXT NOT NULL,
    expected_result TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_cases_session_id ON test_cases(session_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_created_at ON test_cases(created_at);
