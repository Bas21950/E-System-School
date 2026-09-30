import { insertRow, updateRowById } from '../../repositories/postgresCrud';
import { getPostgresPool } from '../../config/database';

export interface PaymentMethodInput {
  name: string;
  code?: string;
  description?: string;
  is_active?: boolean;
  sort_order?: number;
}

function slugifyCode(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9ก-๙]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32) || `pm-${Date.now()}`;
}

export async function getPaymentMethods() {
  const pool = getPostgresPool();
  const result = await pool.query('select * from payment_methods order by sort_order asc, created_at asc');
  return result.rows;
}

export async function createPaymentMethod(input: PaymentMethodInput) {
  return insertRow('payment_methods', {
    name: input.name,
    code: input.code?.trim() || slugifyCode(input.name),
    description: input.description || null,
    is_active: input.is_active !== false,
    sort_order: input.sort_order || 0,
  });
}

export async function updatePaymentMethod(id: string, input: Partial<PaymentMethodInput>) {
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.name !== undefined) updateData.name = input.name;
  if (input.code !== undefined) updateData.code = input.code;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.is_active !== undefined) updateData.is_active = input.is_active;
  if (input.sort_order !== undefined) updateData.sort_order = input.sort_order;

  return updateRowById('payment_methods', id, updateData);
}
