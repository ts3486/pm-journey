ALTER TABLE product_config
ADD COLUMN IF NOT EXISTS scenario_evaluation_criteria JSONB NOT NULL DEFAULT '{}'::jsonb;
