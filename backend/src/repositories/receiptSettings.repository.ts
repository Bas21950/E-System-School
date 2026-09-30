import { getPostgresPool } from '../config/database';
import { ReceiptSettings } from '../modules/finance/finance.types';

const DEFAULT_RECEIPT_SETTINGS: ReceiptSettings = {
  id: 1,
  payee_name: 'ฝ่ายการเงิน',
  school_name: 'โรงเรียนสหวิทยานุสรณ์',
  school_logo_url: null,
  school_address: 'เลขที่ 2 ถนนราชธานี ตำบลในเมือง อำเภอเมือง จังหวัดอุบลราชธานี 34000',
  school_phone: '045-352-099',
  school_subtitle: 'ใบเสร็จรับเงิน - ฝ่ายการเงิน',
  receipt_note: 'กรุณาเก็บใบเสร็จนี้ไว้เป็นหลักฐาน',
  receipt_output_dir: null,
  receipt_email_enabled: false,
  receipt_email_to: null,
  receipt_gas_secret: null,
};

function normalizeReceiptSettings(input?: ReceiptSettings | null): ReceiptSettings {
  return {
    ...DEFAULT_RECEIPT_SETTINGS,
    ...input,
  };
}

export async function getReceiptSettingsRecord(): Promise<ReceiptSettings> {
  const pool = getPostgresPool();
  const result = await pool.query<ReceiptSettings>(
    `select
      id,
      payee_name,
      school_name,
      school_logo_url,
      school_address,
      school_phone,
      school_subtitle,
      receipt_note,
      receipt_output_dir,
      receipt_email_enabled,
      receipt_email_to,
      receipt_gas_secret,
      updated_at
    from system_receipt_settings
    where id = $1
    limit 1`,
    [1]
  );

  return normalizeReceiptSettings(result.rows[0]);
}

export async function saveReceiptSettingsRecord(input: ReceiptSettings): Promise<ReceiptSettings> {
  const payload = normalizeReceiptSettings({
    id: 1,
    payee_name: input.payee_name?.trim() || DEFAULT_RECEIPT_SETTINGS.payee_name,
    school_name: input.school_name?.trim() || DEFAULT_RECEIPT_SETTINGS.school_name,
    school_logo_url: input.school_logo_url?.trim() || null,
    school_address: input.school_address?.trim() || DEFAULT_RECEIPT_SETTINGS.school_address,
    school_phone: input.school_phone?.trim() || DEFAULT_RECEIPT_SETTINGS.school_phone,
    school_subtitle: input.school_subtitle?.trim() || DEFAULT_RECEIPT_SETTINGS.school_subtitle,
    receipt_note: input.receipt_note?.trim() || DEFAULT_RECEIPT_SETTINGS.receipt_note,
    receipt_output_dir: input.receipt_output_dir?.trim() || null,
    receipt_email_enabled: Boolean(input.receipt_email_enabled),
    receipt_email_to: input.receipt_email_to?.trim() || null,
    receipt_gas_secret: input.receipt_gas_secret?.trim() || null,
    updated_at: new Date().toISOString(),
  });

  const pool = getPostgresPool();
  const result = await pool.query<ReceiptSettings>(
    `insert into system_receipt_settings (
      id,
      payee_name,
      school_name,
      school_logo_url,
      school_address,
      school_phone,
      school_subtitle,
      receipt_note,
      receipt_output_dir,
      receipt_email_enabled,
      receipt_email_to,
      receipt_gas_secret,
      updated_at
    ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    on conflict (id) do update set
      payee_name = excluded.payee_name,
      school_name = excluded.school_name,
      school_logo_url = excluded.school_logo_url,
      school_address = excluded.school_address,
      school_phone = excluded.school_phone,
      school_subtitle = excluded.school_subtitle,
      receipt_note = excluded.receipt_note,
      receipt_output_dir = excluded.receipt_output_dir,
      receipt_email_enabled = excluded.receipt_email_enabled,
      receipt_email_to = excluded.receipt_email_to,
      receipt_gas_secret = excluded.receipt_gas_secret,
      updated_at = excluded.updated_at
    returning
      id,
      payee_name,
      school_name,
      school_logo_url,
      school_address,
      school_phone,
      school_subtitle,
      receipt_note,
      receipt_output_dir,
      receipt_email_enabled,
      receipt_email_to,
      receipt_gas_secret,
      updated_at`,
    [
      payload.id,
      payload.payee_name,
      payload.school_name,
      payload.school_logo_url,
      payload.school_address,
      payload.school_phone,
      payload.school_subtitle,
      payload.receipt_note,
      payload.receipt_output_dir,
      payload.receipt_email_enabled,
      payload.receipt_email_to,
      payload.receipt_gas_secret,
      payload.updated_at,
    ]
  );

  return normalizeReceiptSettings(result.rows[0]);
}
