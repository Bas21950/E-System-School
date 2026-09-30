-- ======================================================
-- 🛠️ คำสั่งสำหรับเคลียร์ข้อมูลใบเสร็จและรายการหนี้ (Reset Data)
-- คำเตือน: ข้อมูลจะถูกลบถาวร ไม่สามารถเรียกคืนได้
-- ======================================================

-- 1. ลบรายการสินค้า/ค่าธรรมเนียมในใบเสร็จ (Child)
DELETE FROM public.payment_items;

-- 2. ลบรายการใบเสร็จทั้งหมด (Parent)
DELETE FROM public.payments;

-- 3. ลบรายการหนี้/ค่าธรรมเนียมที่สั่งเก็บเงินนักเรียนไว้ (Invoices)
DELETE FROM public.student_fees;

-- 4. รีเซ็ตตัวนับเลข ID ให้กลับไปเริ่มที่ 1 (Optional)
ALTER SEQUENCE IF EXISTS public.payments_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.payment_items_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.student_fees_id_seq RESTART WITH 1;

-- ======================================================
-- ✅ วิธีใช้งาน: 
-- ก๊อปปี้คำสั่งด้านบนไปวางใน SQL Editor ของ Supabase แล้วกด Run
-- ======================================================
