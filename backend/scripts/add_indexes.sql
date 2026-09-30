-- Add indexes to optimize student lookups and joins

-- Improve student_enrollments joins and lookups
CREATE INDEX IF NOT EXISTS idx_student_enrollments_student_id ON student_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_academic_year_id ON student_enrollments(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_room_id ON student_enrollments(room_id);

-- Improve rooms lookups by grade
CREATE INDEX IF NOT EXISTS idx_rooms_grade_id ON rooms(grade_id);

-- Improve grade_levels lookups
CREATE INDEX IF NOT EXISTS idx_grade_levels_level_id ON grade_levels(level_id);

-- Improve student search performance (Basic btree indexes for ILIKE prefix)
CREATE INDEX IF NOT EXISTS idx_students_first_name ON students(first_name);
CREATE INDEX IF NOT EXISTS idx_students_last_name ON students(last_name);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);

-- Note: For even better search performance on large datasets, consider 
-- using GIN indexes with pg_trgm for ilike %search% or full-text search.
