-- Entitlements
CREATE TABLE IF NOT EXISTS entitlements (
    id TEXT PRIMARY KEY,
    scope_type TEXT NOT NULL CHECK (scope_type IN ('user', 'organization')),
    scope_id TEXT NOT NULL,
    plan_code TEXT NOT NULL CHECK (plan_code IN ('FREE', 'INDIVIDUAL', 'TEAM')),
    status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'revoked')) DEFAULT 'active',
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    source_subscription_id TEXT REFERENCES subscriptions(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entitlements_scope
    ON entitlements(scope_type, scope_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_active
    ON entitlements(scope_type, scope_id, status) WHERE status = 'active';

CREATE TRIGGER update_entitlements_updated_at
    BEFORE UPDATE ON entitlements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Credit wallets
CREATE TABLE IF NOT EXISTS credit_wallets (
    id TEXT PRIMARY KEY,
    scope_type TEXT NOT NULL CHECK (scope_type IN ('user', 'organization')),
    scope_id TEXT NOT NULL,
    monthly_credits INTEGER NOT NULL DEFAULT 0,
    purchased_credits INTEGER NOT NULL DEFAULT 0,
    monthly_reset_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_wallets_scope
    ON credit_wallets(scope_type, scope_id);

CREATE TRIGGER update_credit_wallets_updated_at
    BEFORE UPDATE ON credit_wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Credit ledger (immutable log of all credit transactions)
CREATE TABLE IF NOT EXISTS credit_ledger (
    id TEXT PRIMARY KEY,
    wallet_id TEXT NOT NULL REFERENCES credit_wallets(id),
    direction TEXT NOT NULL CHECK (direction IN ('credit', 'debit')),
    amount INTEGER NOT NULL CHECK (amount > 0),
    reason TEXT NOT NULL,
    reference_type TEXT,
    reference_id TEXT,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_credit_ledger_wallet
    ON credit_ledger(wallet_id);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_occurred
    ON credit_ledger(occurred_at);
