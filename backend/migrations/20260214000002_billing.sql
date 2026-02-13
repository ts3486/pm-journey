-- Billing customers (links to Stripe or manual billing)
CREATE TABLE IF NOT EXISTS billing_customers (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    organization_id TEXT REFERENCES organizations(id),
    provider TEXT NOT NULL CHECK (provider IN ('stripe', 'manual')),
    provider_customer_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT billing_customers_scope CHECK (
        (user_id IS NOT NULL AND organization_id IS NULL) OR
        (user_id IS NULL AND organization_id IS NOT NULL)
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_customers_user
    ON billing_customers(user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_customers_org
    ON billing_customers(organization_id) WHERE organization_id IS NOT NULL;

CREATE TRIGGER update_billing_customers_updated_at
    BEFORE UPDATE ON billing_customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES organizations(id),
    user_id TEXT REFERENCES users(id),
    provider TEXT NOT NULL CHECK (provider IN ('stripe', 'manual')),
    provider_subscription_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'trialing', 'incomplete')),
    plan_code TEXT NOT NULL CHECK (plan_code IN ('FREE', 'INDIVIDUAL', 'TEAM')),
    seat_quantity INTEGER,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT subscriptions_scope CHECK (
        (user_id IS NOT NULL AND organization_id IS NULL) OR
        (user_id IS NULL AND organization_id IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user
    ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_org
    ON subscriptions(organization_id);

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
