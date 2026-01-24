-- Sessions table
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    scenario_id TEXT NOT NULL,
    scenario_discipline TEXT CHECK (scenario_discipline IN ('BASIC', 'CHALLENGE')),
    status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'evaluated')),
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ NOT NULL,
    user_name TEXT,
    evaluation_requested BOOLEAN NOT NULL DEFAULT FALSE,
    progress_flags JSONB NOT NULL DEFAULT '{"requirements":false,"priorities":false,"risks":false,"acceptance":false}',
    mission_status JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_scenario_id ON sessions(scenario_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_last_activity ON sessions(last_activity_at DESC);

-- Messages table
CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'agent', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    tags TEXT[],
    queued_offline BOOLEAN
);

CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Evaluations table
CREATE TABLE evaluations (
    id SERIAL PRIMARY KEY,
    session_id TEXT NOT NULL UNIQUE REFERENCES sessions(id) ON DELETE CASCADE,
    overall_score REAL,
    passing BOOLEAN,
    categories JSONB NOT NULL,
    summary TEXT,
    improvement_advice TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_evaluations_session_id ON evaluations(session_id);

-- Comments table
CREATE TABLE comments (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    author_name TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_comments_session_id ON comments(session_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
