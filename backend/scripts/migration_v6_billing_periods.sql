-- Migration v6: Add Billing Period Context to Student Fees

-- Add columns to student_fees
ALTER TABLE student_fees
ADD COLUMN IF NOT EXISTS academic_year_id uuid REFERENCES academic_years(id),
ADD COLUMN IF NOT EXISTS semester_id uuid REFERENCES semesters(id),
ADD COLUMN IF NOT EXISTS billing_month integer,
ADD COLUMN IF NOT EXISTS billing_year integer,
ADD COLUMN IF NOT EXISTS due_date date;

-- Add comments for clarity
COMMENT ON COLUMN student_fees.academic_year_id IS 'Academic year for semester-based billing';
COMMENT ON COLUMN student_fees.semester_id IS 'Semester for semester-based billing';
COMMENT ON COLUMN student_fees.billing_month IS 'Month number (1-12) for monthly billing';
COMMENT ON COLUMN student_fees.billing_year IS 'Buddhist year (e.g. 2569) for monthly billing';
COMMENT ON COLUMN student_fees.due_date IS 'Deadline for payment';
