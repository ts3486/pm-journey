-- Outputs table (replaces frontend localStorage-based outputs)
CREATE TABLE IF NOT EXISTS outputs (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('text', 'url', 'image')),
    value TEXT NOT NULL,
    note TEXT,
    created_by_user_id TEXT NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outputs_session
    ON outputs(session_id);

-- Extend sessions with organization_id
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS organization_id TEXT REFERENCES organizations(id);
CREATE INDEX IF NOT EXISTS idx_sessions_org_id ON sessions(organization_id);

-- Extend comments with author tracking
ALTER TABLE comments ADD COLUMN IF NOT EXISTS author_user_id TEXT REFERENCES users(id);
ALTER TABLE comments ADD COLUMN IF NOT EXISTS author_role TEXT CHECK (author_role IN ('owner', 'manager', 'reviewer', 'self'));
