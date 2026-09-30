-- สร้างตารางตั้งค่าใบเสร็จ
CREATE TABLE IF NOT EXISTS public.system_receipt_settings (
    id integer PRIMARY KEY DEFAULT 1,
    payee_name text NOT NULL DEFAULT 'ผู้รับเงิน',
    receipt_output_dir text,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- เพิ่ม Row เริ่มต้น (ถ้ายังไม่มี)
INSERT INTO public.system_receipt_settings (id, payee_name)
VALUES (1, 'ผู้รับเงิน')
ON CONFLICT (id) DO NOTHING;

-- ตั้งค่า Security/Access
ALTER TABLE public.system_receipt_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to system_receipt_settings"
    ON public.system_receipt_settings FOR SELECT
    USING (true);

CREATE POLICY "Allow authenticated full access to system_receipt_settings"
    ON public.system_receipt_settings FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
