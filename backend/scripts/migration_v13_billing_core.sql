-- E-System School: finance billing core
-- Run this file once against PostgreSQL before enabling the new billing pages.
-- The migration is additive except for replacing the old per-semester uniqueness rule
-- with a period-aware rule needed for recurring monthly fees.

BEGIN;

ALTER TABLE student_fees
  ADD COLUMN IF NOT EXISTS billing_period_key TEXT,
  ADD COLUMN IF NOT EXISTS billing_run_id UUID,
  ADD COLUMN IF NOT EXISTS fee_name_snapshot TEXT,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_snapshot_locked BOOLEAN NOT NULL DEFAULT false;

-- Existing records must remain individually addressable. Their original period is
-- unknown, so they are marked legacy instead of being guessed into a month/term.
UPDATE student_fees
SET billing_period_key = CONCAT('legacy:', id::text)
WHERE billing_period_key IS NULL OR btrim(billing_period_key) = '';

UPDATE student_fees sf
SET fee_name_snapshot = fp.name
FROM fee_plans fp
WHERE fp.id = sf.fee_plan_id
  AND (sf.fee_name_snapshot IS NULL OR btrim(sf.fee_name_snapshot) = '');

ALTER TABLE student_fees
  ALTER COLUMN billing_period_key SET NOT NULL;

ALTER TABLE student_fees
  DROP CONSTRAINT IF EXISTS unique_student_fee_per_semester;

CREATE UNIQUE INDEX IF NOT EXISTS uq_student_fee_per_billing_period
  ON student_fees(student_id, fee_plan_id, billing_period_key);

CREATE TABLE IF NOT EXISTS billing_rosters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_plan_id UUID NOT NULL REFERENCES fee_plans(id) ON DELETE RESTRICT,
  academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL,
  semester_id UUID REFERENCES semesters(id) ON DELETE SET NULL,
  billing_month INTEGER NOT NULL CHECK (billing_month BETWEEN 1 AND 12),
  billing_year INTEGER NOT NULL CHECK (billing_year BETWEEN 2400 AND 3000),
  period_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(fee_plan_id, academic_year_id, billing_month, billing_year)
);

CREATE TABLE IF NOT EXISTS billing_roster_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_roster_id UUID NOT NULL REFERENCES billing_rosters(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(billing_roster_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_billing_roster_members_roster
  ON billing_roster_members(billing_roster_id, is_active);

CREATE TABLE IF NOT EXISTS billing_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_plan_id UUID NOT NULL REFERENCES fee_plans(id) ON DELETE RESTRICT,
  billing_roster_id UUID REFERENCES billing_rosters(id) ON DELETE SET NULL,
  academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL,
  semester_id UUID REFERENCES semesters(id) ON DELETE SET NULL,
  billing_month INTEGER CHECK (billing_month BETWEEN 1 AND 12),
  billing_year INTEGER CHECK (billing_year BETWEEN 2400 AND 3000),
  billing_period_key TEXT NOT NULL,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'posted' CHECK (status IN ('draft', 'posted', 'failed')),
  idempotency_key TEXT UNIQUE,
  operator_name TEXT,
  requested_count INTEGER NOT NULL DEFAULT 0,
  created_count INTEGER NOT NULL DEFAULT 0,
  existing_count INTEGER NOT NULL DEFAULT 0,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  posted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_billing_runs_period
  ON billing_runs(fee_plan_id, billing_period_key, created_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_student_fees_billing_run'
  ) THEN
    ALTER TABLE student_fees
      ADD CONSTRAINT fk_student_fees_billing_run
      FOREIGN KEY (billing_run_id) REFERENCES billing_runs(id) ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS void_reason TEXT,
  ADD COLUMN IF NOT EXISTS voided_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_idempotency_key
  ON payments(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS receipt_number_sequences (
  buddhist_year INTEGER PRIMARY KEY,
  next_number INTEGER NOT NULL CHECK (next_number > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMIT;
