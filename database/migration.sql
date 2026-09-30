-- =============================================
-- E-System School - Database Migration
-- =============================================

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  sequence_no SERIAL,
  student_id TEXT UNIQUE NOT NULL,
  national_id TEXT,
  prefix TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('ชาย','หญิง')),
  birthday DATE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL,
  parent_name TEXT,
  parent_phone TEXT,
  address TEXT,
  status TEXT DEFAULT 'กำลังศึกษาอยู่'
);

-- Index for common queries
-- Index for common queries
CREATE INDEX idx_students_student_id ON students(student_id);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_room_id ON students(room_id);
CREATE INDEX idx_students_academic_year_id ON students(academic_year_id);

-- =============================================
-- Master Data Tables
-- =============================================

-- 1. Academic Years (ปีการศึกษา)
CREATE TABLE IF NOT EXISTS academic_years (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  year TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Semesters (ภาคเรียน)
CREATE TABLE IF NOT EXISTS semesters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  semester TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_semesters_academic_year_id ON semesters(academic_year_id);

-- 3. Education Levels (ระดับการศึกษา)
CREATE TABLE IF NOT EXISTS education_levels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Grade Levels (ระดับชั้น)
CREATE TABLE IF NOT EXISTS grade_levels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  level_id UUID NOT NULL REFERENCES education_levels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_grade_levels_level_id ON grade_levels(level_id);

-- 5. Rooms (ห้องเรียน)
CREATE TABLE IF NOT EXISTS rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  grade_id UUID NOT NULL REFERENCES grade_levels(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL,
  room_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_rooms_grade_id ON rooms(grade_id);
