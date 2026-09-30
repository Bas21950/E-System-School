-- Section 2: Student Promotion System
-- Implementing the batch promotion engine

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
    -- 1. ดึง student_enrollments ของปีเดิมที่เป็น 'active'
    FOR v_record IN 
        SELECT se.student_id, se.room_id, r.grade_id, gl.sequence_no as current_grade_seq
        FROM student_enrollments se
        JOIN rooms r ON se.room_id = r.id
        JOIN grade_levels gl ON r.grade_id = gl.id
        WHERE se.academic_year_id = old_academic_year_id
        AND se.status = 'active'
    LOOP
        -- 2. หา grade level ถัดไป (อิงตาม sequence_no)
        SELECT id INTO v_new_grade_id
        FROM grade_levels
        WHERE sequence_no > v_record.current_grade_seq
        ORDER BY sequence_no ASC
        LIMIT 1;

        -- 3. หา room ของ grade ใหม่ (พยายามหาห้องที่มีเลขห้องเดียวกัน เช่น 1/1 -> 2/1)
        IF v_new_grade_id IS NOT NULL THEN
            SELECT r.id INTO v_new_room_id
            FROM rooms r
            JOIN rooms old_r ON old_r.id = v_record.room_id
            WHERE r.grade_id = v_new_grade_id
            AND r.room_number = old_r.room_number
            LIMIT 1;

            -- ถ้าไม่เจอห้องที่เลขตรงกัน ให้เอาห้องแรกของระดับชั้นนั้น
            IF v_new_room_id IS NULL THEN
                SELECT id INTO v_new_room_id
                FROM rooms
                WHERE grade_id = v_new_grade_id
                ORDER BY room_number ASC
                LIMIT 1;
            END IF;

            -- 4. insert enrollment ใหม่ (ตรวจสอบว่ายังไม่มีเพื่อป้องกันการเลื่อนซ้ำ)
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
