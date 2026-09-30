-- Store the special subjects a student takes within a monthly special-class roster.
-- The fee plan amount is the price per subject; selecting both subjects charges two units.

BEGIN;

ALTER TABLE billing_roster_members
  ADD COLUMN IF NOT EXISTS course_codes TEXT[] NOT NULL DEFAULT ARRAY['basic']::TEXT[];

ALTER TABLE billing_roster_members
  DROP CONSTRAINT IF EXISTS chk_billing_roster_member_course_codes;

ALTER TABLE billing_roster_members
  ADD CONSTRAINT chk_billing_roster_member_course_codes
  CHECK (course_codes <@ ARRAY['basic', 'steam']::TEXT[]);

COMMIT;
