-- Add configurable receipt output directory for local file storage

ALTER TABLE public.system_receipt_settings
  ADD COLUMN IF NOT EXISTS receipt_output_dir TEXT;

UPDATE public.system_receipt_settings
SET receipt_output_dir = COALESCE(receipt_output_dir, NULL)
WHERE id = 1;
