-- =======================================================
-- E-System School - Consolidated Local PostgreSQL Schema
-- =======================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Academic Years (เธเธตเธเธฒเธฃเธจเธถเธเธฉเธฒ)
CREATE TABLE IF NOT EXISTS academic_years (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  year TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Semesters (เธ เธฒเธเน€เธฃเธตเธขเธ)
CREATE TABLE IF NOT EXISTS semesters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  semester TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_semesters_academic_year_id ON semesters(academic_year_id);

-- 3. Education Levels (เธฃเธฐเธ”เธฑเธเธเธฒเธฃเธจเธถเธเธฉเธฒ)
CREATE TABLE IF NOT EXISTS education_levels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Grade Levels (เธฃเธฐเธ”เธฑเธเธเธฑเนเธ)
CREATE TABLE IF NOT EXISTS grade_levels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  level_id UUID NOT NULL REFERENCES education_levels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  sequence_no SERIAL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_grade_levels_level_id ON grade_levels(level_id);

-- 5. Rooms (เธซเนเธญเธเน€เธฃเธตเธขเธ)
CREATE TABLE IF NOT EXISTS rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  grade_id UUID NOT NULL REFERENCES grade_levels(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL,
  room_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rooms_grade_id ON rooms(grade_id);

-- 6. Students (เธเธฑเธเน€เธฃเธตเธขเธ)
CREATE TABLE IF NOT EXISTS students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  sequence_no SERIAL,
  student_id TEXT UNIQUE NOT NULL,
  national_id TEXT,
  prefix TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('เธเธฒเธข','เธซเธเธดเธ')),
  birthday DATE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL,
  parent_name TEXT,
  parent_phone TEXT,
  address TEXT,
  profile_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'เธเธณเธฅเธฑเธเธจเธถเธเธฉเธฒเธญเธขเธนเน'
);

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS profile_data JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_room_id ON students(room_id);
CREATE INDEX IF NOT EXISTS idx_students_academic_year_id ON students(academic_year_id);

-- 7. Student Enrollments (เธเธฃเธฐเธงเธฑเธ•เธดเธเธฒเธฃเธฅเธเธ—เธฐเน€เธเธตเธขเธเธเธญเธเธเธฑเธเน€เธฃเธตเธขเธ)
CREATE TABLE IF NOT EXISTS student_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'repeated', 'transferred', 'graduated')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, academic_year_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollment_student ON student_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_academic_year ON student_enrollments(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_room ON student_enrollments(room_id);
CREATE TABLE IF NOT EXISTS receipt_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  prefix TEXT NOT NULL,
  current_number INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_receipt_types_code ON receipt_types(code);

INSERT INTO receipt_types (id, code, name, prefix, current_number, is_active, created_at) VALUES
  ('ce84dae4-741f-468d-8b6c-6fc81905d65b', 'สวส', 'ใบเสร็จค่าเทอม', 'สวส', 1, true, '2026-03-15T12:34:29.129496+00:00'::timestamptz),
  ('ae4cdbe0-9e2c-4183-a07d-fcf1d1b79af5', 'ABC', 'ค่าเรียนพิเศษ', 'ABC', 1, true, '2026-03-15T13:27:23.985463+00:00'::timestamptz)
ON CONFLICT (code) DO NOTHING;


-- 8. Fee Plans (เธเธณเธซเธเธ”เธฃเธฒเธขเธเธฒเธฃเธเนเธฒเนเธเนเธเนเธฒเธข)
CREATE TABLE IF NOT EXISTS fee_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  receipt_type_id UUID REFERENCES receipt_types(id) ON DELETE SET NULL,
  academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
  grade_level_id UUID REFERENCES grade_levels(id) ON DELETE CASCADE,
  description TEXT,
  billing_cycle TEXT CHECK (billing_cycle IN ('once','monthly','semester','yearly')),
  billing_day INTEGER,
  target_grade_id UUID REFERENCES grade_levels(id) ON DELETE SET NULL,
  target_room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fee_plans_billing_day ON fee_plans(billing_day);

-- 9. Student Fee Assignments (เธเนเธฒเนเธเนเธเนเธฒเธขเน€เธเธเธฒเธฐเธเธธเธเธเธฅ - Optional)
CREATE TABLE IF NOT EXISTS student_fee_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  fee_plan_id UUID NOT NULL REFERENCES fee_plans(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, fee_plan_id)
);

CREATE INDEX IF NOT EXISTS idx_student_fee_assignments_student ON student_fee_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_fee_assignments_fee_plan ON student_fee_assignments(fee_plan_id);

-- 10. Student Fees (เธฃเธฒเธขเธเธฒเธฃเธซเธเธตเนเธฃเธฒเธขเธเธธเธเธเธฅ)
CREATE TABLE IF NOT EXISTS student_fees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  fee_plan_id UUID NOT NULL REFERENCES fee_plans(id) ON DELETE CASCADE,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partial', 'paid')),
  semester_id UUID REFERENCES semesters(id) ON DELETE SET NULL,
  academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL,
  billing_month INTEGER,
  billing_year INTEGER,
  billing_period_key TEXT NOT NULL DEFAULT 'legacy',
  billing_run_id UUID,
  fee_name_snapshot TEXT,
  discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discount_snapshot_locked BOOLEAN NOT NULL DEFAULT false,
  due_date DATE,
  source TEXT DEFAULT 'system' CHECK (source IN ('system', 'legacy')),
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_student_fee_per_billing_period UNIQUE (student_id, fee_plan_id, billing_period_key)
);

CREATE INDEX IF NOT EXISTS idx_student_fees_student_id ON student_fees(student_id);
CREATE INDEX IF NOT EXISTS idx_student_fees_status ON student_fees(status);

-- Monthly rosters preserve who was included in each special-class billing period.
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
  course_codes TEXT[] NOT NULL DEFAULT ARRAY['basic']::TEXT[] CHECK (course_codes <@ ARRAY['basic', 'steam']::TEXT[]),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(billing_roster_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_billing_roster_members_roster ON billing_roster_members(billing_roster_id, is_active);

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

CREATE INDEX IF NOT EXISTS idx_billing_runs_period ON billing_runs(fee_plan_id, billing_period_key, created_at DESC);

ALTER TABLE student_fees
  ADD CONSTRAINT fk_student_fees_billing_run
  FOREIGN KEY (billing_run_id) REFERENCES billing_runs(id) ON DELETE SET NULL;

-- 11. Payments (เนเธเน€เธชเธฃเนเธเธฃเธฑเธเน€เธเธดเธ)
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  receipt_no TEXT UNIQUE NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL,
  total_amount NUMERIC(12, 2) NOT NULL,
  payee_name TEXT,
  receipt_file_url TEXT,
  evidence_url TEXT,
  status TEXT NOT NULL DEFAULT 'success',
  transfer_slip_url TEXT,
  idempotency_key TEXT,
  void_reason TEXT,
  voided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_idempotency_key ON payments(idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS receipt_number_sequences (
  buddhist_year INTEGER PRIMARY KEY,
  next_number INTEGER NOT NULL CHECK (next_number > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);

-- 12. Payment Items (เธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”เธเธฒเธฃเธเธณเธฃเธฐเน€เธเธดเธเนเธเนเธเน€เธชเธฃเนเธ)
CREATE TABLE IF NOT EXISTS payment_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  student_fee_id UUID NOT NULL REFERENCES student_fees(id) ON DELETE SET NULL,
  amount NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. Payment Methods (เธงเธดเธเธตเธเธฒเธฃเธเธณเธฃเธฐเน€เธเธดเธ)
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed Payment Methods
INSERT INTO payment_methods (name, code, description, sort_order) VALUES
  ('เน€เธเธดเธเธชเธ” (Cash)', 'cash', 'เธฃเธฑเธเธเธณเธฃเธฐเธเนเธฒเธเธเธธเธ”เธเธฑเธ”เธเธ/เธซเนเธญเธเธเธฒเธฃเน€เธเธดเธ', 1),
  ('เนเธญเธเน€เธเธดเธ (Transfer)', 'transfer', 'เนเธญเธเน€เธเธดเธเธเนเธฒเธเธเธเธฒเธเธฒเธฃ', 2),
  ('QR PromptPay', 'qr', 'เธชเนเธเธเธเนเธฒเธขเธเนเธฒเธเนเธญเธเธเธฅเธดเน€เธเธเธฑเธเธเธเธฒเธเธฒเธฃ', 3)
ON CONFLICT (code) DO NOTHING;

-- 14. System Receipt Settings (เธเธฒเธฃเธ•เธฑเนเธเธเนเธฒเธเธดเธกเธเนเนเธเน€เธชเธฃเนเธ)
CREATE TABLE IF NOT EXISTS system_receipt_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  payee_name TEXT NOT NULL DEFAULT 'เธเธนเนเธฃเธฑเธเน€เธเธดเธ',
  school_name TEXT NOT NULL DEFAULT 'โรงเรียนสหวิทยานุสรณ์',
  school_logo_url TEXT,
  school_address TEXT NOT NULL DEFAULT 'เลขที่ 2 ถนนราชธานี ตำบลในเมือง อำเภอเมือง จังหวัดอุบลราชธานี 34000',
  school_phone TEXT NOT NULL DEFAULT '045-352-099',
  school_subtitle TEXT NOT NULL DEFAULT 'ใบเสร็จรับเงิน - ฝ่ายการเงิน',
    receipt_note TEXT NOT NULL DEFAULT 'กรุณาเก็บใบเสร็จนี้ไว้เป็นหลักฐาน',
    receipt_output_dir TEXT,
    receipt_email_enabled BOOLEAN NOT NULL DEFAULT false,
    receipt_email_to TEXT,
    receipt_gas_secret TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
  );

-- Seed Receipt Settings
INSERT INTO system_receipt_settings (id, payee_name, school_name, school_address, school_phone, school_subtitle, receipt_note)
VALUES (1, 'ฝ่ายการเงิน', 'โรงเรียนสหวิทยานุสรณ์', 'เลขที่ 2 ถนนราชธานี ตำบลในเมือง อำเภอเมือง จังหวัดอุบลราชธานี 34000', '045-352-099', 'ใบเสร็จรับเงิน - ฝ่ายการเงิน', 'กรุณาเก็บใบเสร็จนี้ไว้เป็นหลักฐาน')
ON CONFLICT (id) DO NOTHING;

-- 15. Discounts (เธชเนเธงเธเธฅเธ”)
CREATE TABLE IF NOT EXISTS discounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('fixed', 'percentage')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =======================================================
-- Functions and Triggers
-- =======================================================

-- Semester Date Validation Trigger
CREATE OR REPLACE FUNCTION validate_semester_dates()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM academic_years 
        WHERE id = NEW.academic_year_id AND is_current = true
    ) THEN
        IF NEW.start_date IS NULL OR NEW.end_date IS NULL THEN
            RAISE EXCEPTION 'เธ เธฒเธเน€เธฃเธตเธขเธเนเธเธเธตเธเธฒเธฃเธจเธถเธเธฉเธฒเธเธฑเธเธเธธเธเธฑเธเธ•เนเธญเธเธฃเธฐเธเธธ start_date เนเธฅเธฐ end_date (เน€เธเธทเนเธญเธฃเธญเธเธฃเธฑเธเธฃเธฐเธเธ Billing)';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_semester_dates ON semesters;
CREATE TRIGGER trg_validate_semester_dates
    BEFORE INSERT OR UPDATE ON semesters
    FOR EACH ROW
    EXECUTE FUNCTION validate_semester_dates();

-- Student Promotion Function
CREATE OR REPLACE FUNCTION promote_students(
    old_academic_year_id uuid,
    new_academic_year_id uuid
)
RETURNS TABLE (promoted_count integer) AS $$
DECLARE
    v_record record;
    v_new_grade_id uuid;
    v_new_room_id uuid;
    v_count integer := 0;
BEGIN
    FOR v_record IN 
        SELECT se.student_id, se.room_id, r.grade_id, gl.sequence_no as current_grade_seq
        FROM student_enrollments se
        JOIN rooms r ON se.room_id = r.id
        JOIN grade_levels gl ON r.grade_id = gl.id
        WHERE se.academic_year_id = old_academic_year_id
        AND se.status = 'active'
    LOOP
        SELECT id INTO v_new_grade_id
        FROM grade_levels
        WHERE sequence_no > v_record.current_grade_seq
        ORDER BY sequence_no ASC
        LIMIT 1;

        IF v_new_grade_id IS NOT NULL THEN
            SELECT r.id INTO v_new_room_id
            FROM rooms r
            JOIN rooms old_r ON old_r.id = v_record.room_id
            WHERE r.grade_id = v_new_grade_id
            AND r.room_number = old_r.room_number
            LIMIT 1;

            IF v_new_room_id IS NULL THEN
                SELECT id INTO v_new_room_id
                FROM rooms
                WHERE grade_id = v_new_grade_id
                ORDER BY room_number ASC
                LIMIT 1;
            END IF;

            INSERT INTO student_enrollments (
                student_id,
                academic_year_id,
                room_id,
                status
            )
            VALUES (
                v_record.student_id,
                new_academic_year_id,
                v_new_room_id,
                'active'
            )
            ON CONFLICT (student_id, academic_year_id) DO NOTHING;

            IF FOUND THEN
                v_count := v_count + 1;
            END IF;
        END IF;
    END LOOP;

    RETURN QUERY SELECT v_count;
END;
$$ LANGUAGE plpgsql;

-- Generate Billing For Today Function
CREATE OR REPLACE FUNCTION generate_billing_for_today()
RETURNS void AS $$
DECLARE
    v_today date := now()::date;
    v_day_of_month integer := extract(day from now())::integer;
    v_semester_id uuid;
    v_semester_name text;
    v_academic_year_id uuid;
    v_academic_year_name text;
    v_record record;
    v_student record;
BEGIN
    SELECT s.id, s.academic_year_id, s.semester, ay.year 
    INTO v_semester_id, v_academic_year_id, v_semester_name, v_academic_year_name
    FROM semesters s
    JOIN academic_years ay ON s.academic_year_id = ay.id
    WHERE v_today BETWEEN s.start_date AND s.end_date
    LIMIT 1;

    IF v_semester_id IS NULL THEN
        RAISE WARNING 'เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธชเธฃเนเธฒเธเธเธดเธฅเธญเธฑเธ•เนเธเธกเธฑเธ•เธดเนเธ”เน: เนเธกเนเธเธเธ เธฒเธเน€เธฃเธตเธขเธเธ—เธตเนเน€เธเธดเธ”เธญเธขเธนเนเนเธเธงเธฑเธเธ—เธตเน %', v_today;
        RETURN;
    END IF;

    FOR v_record IN 
        SELECT * FROM fee_plans 
        WHERE billing_day = v_day_of_month
        AND billing_cycle IN ('once', 'monthly', 'semester', 'yearly')
    LOOP
        FOR v_student IN
            SELECT se.student_id
            FROM student_enrollments se
            JOIN student_fee_assignments sfa ON se.student_id = sfa.student_id
            WHERE sfa.fee_plan_id = v_record.id 
            AND sfa.active = true
            AND se.academic_year_id = v_academic_year_id
            AND se.status = 'active'
            
            UNION
            
            SELECT se.student_id
            FROM student_enrollments se
            WHERE se.academic_year_id = v_academic_year_id
            AND se.status = 'active'
            AND (
                (v_record.target_grade_id IS NOT NULL AND EXISTS (SELECT 1 FROM rooms r WHERE r.id = se.room_id AND r.grade_id = v_record.target_grade_id))
                OR (v_record.target_room_id IS NOT NULL AND se.room_id = v_record.target_room_id)
            )
        LOOP
            INSERT INTO student_fees (
                student_id,
                fee_plan_id,
                semester_id,
                academic_year_id,
                total_amount,
                paid_amount,
                status,
                source,
                created_at
            )
            VALUES (
                v_student.student_id,
                v_record.id,
                v_semester_id,
                v_academic_year_id,
                v_record.amount,
                0,
                'unpaid',
                'system',
                now()
            )
            ON CONFLICT (student_id, fee_plan_id, semester_id, academic_year_id) DO NOTHING;
            
        END LOOP;
    END LOOP;

    RAISE NOTICE 'เธชเธฃเนเธฒเธเธเธดเธฅเธญเธฑเธ•เนเธเธกเธฑเธ•เธดเธชเธณเน€เธฃเนเธเธชเธณเธซเธฃเธฑเธเธงเธฑเธเธ—เธตเน % (เธเธตเธเธฒเธฃเธจเธถเธเธฉเธฒ % เน€เธ—เธญเธก %)', v_today, v_academic_year_name, v_semester_name;
END;
$$ LANGUAGE plpgsql;
