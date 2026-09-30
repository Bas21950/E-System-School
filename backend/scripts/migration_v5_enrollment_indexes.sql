-- Database Performance Optimization for Enrollment-First Refactor

-- 1. Index for student lookup in enrollments
CREATE INDEX IF NOT EXISTS idx_student_enrollments_student
ON student_enrollments(student_id);

-- 2. Index for academic year filtering
CREATE INDEX IF NOT EXISTS idx_student_enrollments_year
ON student_enrollments(academic_year_id);

-- 3. Index for room filtering
CREATE INDEX IF NOT EXISTS idx_student_enrollments_room
ON student_enrollments(room_id);

-- 4. Compound index for common filtering (Year + Room)
CREATE INDEX IF NOT EXISTS idx_student_enrollments_year_room
ON student_enrollments(academic_year_id, room_id);
