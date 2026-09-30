-- Phase 3: Automation & Scheduling (pg_cron)

-- 1. เพิ่ม Unique Constraint ให้กับ student_fees (ใช้วิธีเช็คก่อนสร้างเพื่อกัน Error)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_student_fee_per_semester') THEN
        ALTER TABLE student_fees 
        ADD CONSTRAINT unique_student_fee_per_semester 
        UNIQUE (student_id, fee_plan_id, semester_id, academic_year_id);
    END IF;
END;
$$;

-- 2. เปิดใช้งาน Extension pg_cron (ถ้ายังไม่ได้เปิด)
-- หมายเหตุ: คำสั่งนี้ต้องรันโดย admin ใน Supabase
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 3. ตั้งเวลาให้ระบบรันบิลอัตโนมัติทุกวันเวลา 00:05
-- 'generate-daily-billing' คือชื่อ Job
-- '5 0 * * *' คือ Cron expression (นาทีที่ 5 ชั่วโมงที่ 0 ของทุกวัน)
SELECT cron.schedule(
    'generate-daily-billing',
    '5 0 * * *',
    $$ SELECT generate_billing_for_today(); $$
);

-- ตรวจสอบรายการ Job ที่ตั้งไว้
-- SELECT * FROM cron.job;
