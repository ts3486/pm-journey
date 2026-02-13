-- Create FREE entitlement for every existing user who does not already have one
INSERT INTO entitlements (id, scope_type, scope_id, plan_code, status, valid_from)
SELECT
    'ent-' || gen_random_uuid(),
    'user',
    u.id,
    'FREE',
    'active',
    NOW()
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM entitlements e
    WHERE e.scope_type = 'user' AND e.scope_id = u.id AND e.status = 'active'
);

-- Create credit wallet for every existing user who does not already have one
INSERT INTO credit_wallets (id, scope_type, scope_id, monthly_credits, purchased_credits, monthly_reset_at)
SELECT
    'wallet-' || gen_random_uuid(),
    'user',
    u.id,
    12,
    0,
    NOW() + INTERVAL '1 month'
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM credit_wallets w
    WHERE w.scope_type = 'user' AND w.scope_id = u.id
);
