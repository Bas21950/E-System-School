-- =============================================
-- School Payment System - Database Migration
-- =============================================

-- 1. Fee Plans (กำหนดรายการค่าใช้จ่าย)
CREATE TABLE IF NOT EXISTS fee_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
  grade_level_id UUID REFERENCES grade_levels(id) ON DELETE CASCADE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Student Fees (รายการหนี้ของนักเรียนแต่ละคน)
CREATE TABLE IF NOT EXISTS student_fees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  fee_plan_id UUID NOT NULL REFERENCES fee_plans(id) ON DELETE CASCADE,
  total_amount NUMERIC(12, 2) NOT NULL,
  paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partial', 'paid')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indices for student_fees
CREATE INDEX idx_student_fees_student_id ON student_fees(student_id);
CREATE INDEX idx_student_fees_status ON student_fees(status);

-- 3. Payments (หัวข้อการชำระเงิน/ใบเสร็จ)
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  receipt_no TEXT UNIQUE NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'transfer', 'qr')),
  total_amount NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indices for payments
CREATE INDEX idx_payments_student_id ON payments(student_id);
CREATE INDEX idx_payments_date ON payments(payment_date);

-- 4. Payment Items (รายละเอียดรายการที่ชำระในแต่ละใบเสร็จ)
CREATE TABLE IF NOT EXISTS payment_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  student_fee_id UUID NOT NULL REFERENCES student_fees(id) ON DELETE SET NULL,
  amount NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Discounts (ส่วนลด - Optional)
CREATE TABLE IF NOT EXISTS discounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('fixed', 'percentage')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add sequence/receipt_no helper if needed later
