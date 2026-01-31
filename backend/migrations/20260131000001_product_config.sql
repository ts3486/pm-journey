-- Product configuration table (singleton - only one row allowed)
CREATE TABLE IF NOT EXISTS product_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    summary TEXT NOT NULL,
    audience TEXT NOT NULL,
    problems JSONB NOT NULL DEFAULT '[]',
    goals JSONB NOT NULL DEFAULT '[]',
    differentiators JSONB DEFAULT '[]',
    scope JSONB DEFAULT '[]',
    constraints JSONB DEFAULT '[]',
    timeline TEXT,
    success_criteria JSONB DEFAULT '[]',
    unique_edge TEXT,
    tech_stack JSONB DEFAULT '[]',
    core_features JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure only one row exists (singleton pattern)
CREATE UNIQUE INDEX IF NOT EXISTS product_config_singleton ON product_config ((true));

-- Auto-update timestamp trigger
CREATE TRIGGER update_product_config_updated_at
    BEFORE UPDATE ON product_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
