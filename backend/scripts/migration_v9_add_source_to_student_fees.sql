-- Add source column to student_fees to support Legacy fees
ALTER TABLE student_fees 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'system';

COMMENT ON COLUMN student_fees.source IS 'Source of the fee (system or legacy)';
