-- STEP 1: Create student_enrollments table (Formalize)
CREATE TABLE IF NOT EXISTS student_enrollments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    academic_year_id uuid NOT NULL REFERENCES academic_years(id),
    room_id uuid NOT NULL REFERENCES rooms(id),
    status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'transferred', 'graduated')),
    created_at timestamptz DEFAULT now(),
    -- Prevent duplicate enrollment for same student in same year
    UNIQUE(student_id, academic_year_id)
);

-- Ensure correct status values (Step 1 requirement)
-- Note: 'repeated' was used in previous session, updating to 'inactive' as per new request
ALTER TABLE student_enrollments 
DROP CONSTRAINT IF EXISTS student_enrollments_status_check;

ALTER TABLE student_enrollments 
ADD CONSTRAINT student_enrollments_status_check 
CHECK (status IN ('active', 'inactive', 'transferred', 'graduated'));

-- STEP 2: Migrate data from students to student_enrollments
INSERT INTO student_enrollments (
    student_id,
    academic_year_id,
    room_id,
    status
)
SELECT 
    id,
    academic_year_id,
    room_id,
    'active'
FROM students
WHERE room_id IS NOT NULL AND academic_year_id IS NOT NULL
ON CONFLICT (student_id, academic_year_id) DO NOTHING;

-- STEP 3: Legacy Cleanup (Optional/Logical)
-- We keep room_id and academic_year_id in students table for backward compatibility 
-- as requested "ไม่ทำลาย schema เดิม", but we will ignore them in code.
COMMENT ON COLUMN students.room_id IS 'DEPRECATED: Use student_enrollments table instead';
COMMENT ON COLUMN students.academic_year_id IS 'DEPRECATED: Use student_enrollments table instead';
