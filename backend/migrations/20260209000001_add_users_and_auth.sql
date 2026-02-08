-- Users table (Auth0-backed)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,              -- Auth0 sub claim (e.g. "auth0|abc123")
    email TEXT,
    name TEXT,
    picture TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add user_id to sessions (nullable for backward compatibility with existing data)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- Add user_id to custom_scenarios (NULL = system/built-in scenario)
ALTER TABLE custom_scenarios ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_custom_scenarios_user_id ON custom_scenarios(user_id);

-- Convert product_config from singleton to per-user
-- Drop the singleton unique index
DROP INDEX IF EXISTS product_config_singleton;
-- Add user_id column
ALTER TABLE product_config ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id);
-- Create unique index per user (one config per user)
CREATE UNIQUE INDEX IF NOT EXISTS product_config_user_unique ON product_config(user_id);
