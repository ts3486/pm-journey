-- Backfill session organization links for active members.
-- This keeps Team Management visibility working even when older sessions were
-- created before organization_id was populated on session creation.
WITH latest_active_membership AS (
    SELECT
        m.user_id,
        m.organization_id,
        COALESCE(m.joined_at, m.created_at) AS joined_or_created_at,
        ROW_NUMBER() OVER (
            PARTITION BY m.user_id
            ORDER BY COALESCE(m.joined_at, m.created_at) DESC
        ) AS rn
    FROM organization_members m
    WHERE m.status = 'active'
)
UPDATE sessions s
SET organization_id = membership.organization_id
FROM latest_active_membership membership
WHERE membership.rn = 1
  AND s.user_id = membership.user_id
  AND s.organization_id IS NULL
  AND s.started_at >= membership.joined_or_created_at;

-- Any session with an evaluation record should be marked as evaluated.
UPDATE sessions s
SET status = 'evaluated',
    evaluation_requested = TRUE
WHERE s.status <> 'evaluated'
  AND EXISTS (
      SELECT 1
      FROM evaluations e
      WHERE e.session_id = s.id
  );
