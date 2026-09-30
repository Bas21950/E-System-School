-- Phase 1: Database Migration for Recurring Billing System (Idempotent Version)

-- 1. ปรับปรุง table fee_plans (ใช้ IF NOT EXISTS เพื่อป้องกัน Error)
ALTER TABLE fee_plans ADD COLUMN IF NOT EXISTS billing_cycle text CHECK (billing_cycle IN ('once','monthly','semester','yearly'));
ALTER TABLE fee_plans ADD COLUMN IF NOT EXISTS billing_day integer;
ALTER TABLE fee_plans ADD COLUMN IF NOT EXISTS target_grade_id uuid REFERENCES grade_levels(id);
ALTER TABLE fee_plans ADD COLUMN IF NOT EXISTS target_room_id uuid REFERENCES rooms(id);
ALTER TABLE fee_plans ADD COLUMN IF NOT EXISTS description text;

-- 2. สร้าง table student_fee_assignments สำหรับค่าใช้จ่ายเฉพาะบุคคล (Optional Fees)
CREATE TABLE IF NOT EXISTS student_fee_assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    fee_plan_id uuid NOT NULL REFERENCES fee_plans(id) ON DELETE CASCADE,
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    UNIQUE(student_id, fee_plan_id)
);

-- เพิ่มดัชนี (ตรวจสอบก่อนสร้างเพื่อกัน Error)
CREATE INDEX IF NOT EXISTS idx_fee_plans_billing_day ON fee_plans(billing_day);
CREATE INDEX IF NOT EXISTS idx_student_fee_assignments_student ON student_fee_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_fee_assignments_fee_plan ON student_fee_assignments(fee_plan_id);

-- 3. ปรับปรุง student_fees รองรับสถานะและการชำระเงินบางส่วน และจัดเก็บข้อมูลเทอม
ALTER TABLE student_fees ADD COLUMN IF NOT EXISTS total_amount numeric DEFAULT 0;
ALTER TABLE student_fees ADD COLUMN IF NOT EXISTS paid_amount numeric DEFAULT 0;
ALTER TABLE student_fees ADD COLUMN IF NOT EXISTS status text DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partial', 'paid'));
ALTER TABLE student_fees ADD COLUMN IF NOT EXISTS semester_id uuid REFERENCES semesters(id);
ALTER TABLE student_fees ADD COLUMN IF NOT EXISTS academic_year_id uuid REFERENCES academic_years(id);
