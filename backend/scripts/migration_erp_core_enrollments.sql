-- Section 1: Student Enrollment System
-- Create student_enrollments table to track students across multiple years

CREATE TABLE IF NOT EXISTS student_enrollments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    academic_year_id uuid NOT NULL REFERENCES academic_years(id),
    room_id uuid REFERENCES rooms(id),
    status text DEFAULT 'active' CHECK (status IN ('active', 'repeated', 'transferred', 'graduated')),
    created_at timestamptz DEFAULT now(),
    -- ป้องกันการลงทะเบียนซ้ำซ้อนในปีเดียวกัน
    UNIQUE(student_id, academic_year_id)
);

-- เพิ่มดัชนีเพื่อประสิทธิภาพในการค้นหา
CREATE INDEX IF NOT EXISTS idx_enrollment_student ON student_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_academic_year ON student_enrollments(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_room ON student_enrollments(room_id);

-- Section 10: Academic Year and Semester Validation
-- เพิ่ม Logic ตรวจสอบความถูกต้องของข้อมูลภาคเรียน

-- ก่อนอื่น เพิ่มคอลัมน์ is_current ถ้ายังไม่มี (สำหรับระบบจัดการปีปัจจุบัน)
ALTER TABLE academic_years ADD COLUMN IF NOT EXISTS is_current boolean DEFAULT false;

-- สร้าง Trigger Function ตรวจสอบวันที่ในภาคเรียน
CREATE OR REPLACE FUNCTION validate_semester_dates()
RETURNS TRIGGER AS $$
BEGIN
    -- ถ้าเป็นปีการศึกษาปัจจุบัน ต้องมีวันที่ครบถ้วน
    IF EXISTS (
        SELECT 1 FROM academic_years 
        WHERE id = NEW.academic_year_id AND is_current = true
    ) THEN
        IF NEW.start_date IS NULL OR NEW.end_date IS NULL THEN
            RAISE EXCEPTION 'ภาคเรียนในปีการศึกษาปัจจุบันต้องระบุ start_date และ end_date (เพื่อรองรับระบบ Billing)';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ผูก Trigger เข้ากับ Table semesters
DROP TRIGGER IF EXISTS trg_validate_semester_dates ON semesters;
CREATE TRIGGER trg_validate_semester_dates
    BEFORE INSERT OR UPDATE ON semesters
    FOR EACH ROW
    EXECUTE FUNCTION validate_semester_dates();
