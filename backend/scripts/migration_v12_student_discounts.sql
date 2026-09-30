-- V12: Student discounts / scholarships

ALTER TABLE IF EXISTS discounts
  ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS fee_plan_id UUID REFERENCES fee_plans(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS note TEXT,
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS end_date DATE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_discounts_student_id ON discounts(student_id);
CREATE INDEX IF NOT EXISTS idx_discounts_fee_plan_id ON discounts(fee_plan_id);
CREATE INDEX IF NOT EXISTS idx_discounts_active ON discounts(active);
