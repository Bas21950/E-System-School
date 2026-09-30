-- migration_v10_add_payee_name_to_payments.sql

-- 1. Add payee_name column to payments table
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payee_name text;

-- 2. Backfill existing rows with current global setting
-- We pull the current payee_name from system_receipt_settings (id=1)
DO $$
DECLARE
    current_payee text;
BEGIN
    SELECT payee_name INTO current_payee FROM public.system_receipt_settings WHERE id = 1;
    
    IF current_payee IS NOT NULL THEN
        UPDATE public.payments SET payee_name = current_payee WHERE payee_name IS NULL;
    ELSE
        UPDATE public.payments SET payee_name = 'ฝ่ายการเงิน' WHERE payee_name IS NULL;
    END IF;
END $$;
