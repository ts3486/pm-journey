CREATE TABLE IF NOT EXISTS stripe_events (
    event_id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('received', 'processed', 'failed')),
    last_error TEXT,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_stripe_events_status
    ON stripe_events(status);

CREATE INDEX IF NOT EXISTS idx_stripe_events_received_at
    ON stripe_events(received_at DESC);
