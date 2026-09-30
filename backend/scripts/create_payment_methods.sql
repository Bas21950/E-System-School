-- =============================================
-- Payment Methods Table & Transfer Slip Support
-- =============================================

-- 1. Create payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,  -- e.g. 'cash', 'transfer', 'qr'
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Insert default payment methods
INSERT INTO payment_methods (name, code, description, sort_order) VALUES
  ('เงินสด (Cash)', 'cash', 'รับชำระผ่านจุดนัดพบ/ห้องการเงิน', 1),
  ('โอนเงิน (Transfer)', 'transfer', 'โอนเงินผ่านธนาคาร', 2),
  ('QR PromptPay', 'qr', 'สแกนจ่ายผ่านแอปพลิเคชันธนาคาร', 3)
ON CONFLICT (code) DO NOTHING;

-- 3. Add transfer_slip_url column to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS transfer_slip_url TEXT;

-- 4. Enable RLS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all authenticated users to read
CREATE POLICY "Allow authenticated read" ON payment_methods
  FOR SELECT TO authenticated USING (true);

-- Policy: Allow all authenticated users to insert/update
CREATE POLICY "Allow authenticated write" ON payment_methods
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
