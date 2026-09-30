-- Phase 2: Enhanced Billing Logic (SQL Function Update)

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
    -- 1. หา Semester และ Academic Year ปัจจุบัน (อิงตามวันที่)
    SELECT s.id, s.academic_year_id, s.semester, ay.year 
    INTO v_semester_id, v_academic_year_id, v_semester_name, v_academic_year_name
    FROM semesters s
    JOIN academic_years ay ON s.academic_year_id = ay.id
    WHERE v_today BETWEEN s.start_date AND s.end_date
    LIMIT 1;

    -- 2. Validation: ถ้าเป็นปีการศึกษาปัจจุบันแต่ไม่มีวันเริ่ม/สิ้นสุดที่ชัดเจน (หรือหาไม่เจอ)
    IF v_semester_id IS NULL THEN
        -- ค้นหาว่ามี semester ที่ "ควรจะเป็น" ปัจจุบันแต่ลืมตั้งค่าวันที่หรือไม่ (ตัวอย่าง logic)
        RAISE WARNING 'ไม่สามารถสร้างบิลอัตโนมัติได้: ไม่พบภาคเรียนที่เปิดอยู่ในวันที่ %', v_today;
        RETURN;
    END IF;

    -- 3. วนลูปหา Fee Plans ที่ต้องเรียกเก็บวันนี้
    FOR v_record IN 
        SELECT * FROM fee_plans 
        WHERE billing_day = v_day_of_month
        AND billing_cycle IN ('once', 'monthly', 'semester', 'yearly')
    LOOP
        -- 4. ดึงรายชื่อนักเรียนที่ต้องถูกเรียกเก็บ
        -- ก) กลุ่มเป้าหมายแบบ Optional (student_fee_assignments)
        FOR v_student IN
            SELECT se.student_id
            FROM student_enrollments se
            JOIN student_fee_assignments sfa ON se.student_id = sfa.student_id
            WHERE sfa.fee_plan_id = v_record.id 
            AND sfa.active = true
            AND se.academic_year_id = v_academic_year_id
            AND se.status = 'active'
            
            UNION
            
            -- ข) กลุ่มเป้าหมายระดับชั้น/ห้องเรียน (target_grade/target_room)
            SELECT se.student_id
            FROM student_enrollments se
            WHERE se.academic_year_id = v_academic_year_id
            AND se.status = 'active'
            AND (
                (v_record.target_grade_id IS NOT NULL AND EXISTS (SELECT 1 FROM rooms r WHERE r.id = se.room_id AND r.grade_id = v_record.target_grade_id))
                OR (v_record.target_room_id IS NOT NULL AND se.room_id = v_record.target_room_id)
            )
        LOOP
            -- 5. สร้างรายการ student_fees (Check Duplicates ด้วย Unique Constraint)
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

    RAISE NOTICE 'สร้างบิลอัตโนมัติสำเร็จสำหรับวันที่ % (ปีการศึกษา % เทอม %)', v_today, v_academic_year_name, v_semester_name;
END;
$$ LANGUAGE plpgsql;
