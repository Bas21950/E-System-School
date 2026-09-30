import { getPostgresPool } from '../../config/database';
import { deleteRowById, insertRow, updateRowById } from '../../repositories/postgresCrud';
import { CreateDiscountInput, Discount, UpdateDiscountInput } from './finance.types';

export function calculateDiscountValue(discount: Pick<Discount, 'amount' | 'type'>, feeTotal: number) {
  if (discount.type === 'percentage') {
    return Math.max((Number(feeTotal) * Number(discount.amount || 0)) / 100, 0);
  }
  return Math.max(Number(discount.amount || 0), 0);
}

export async function getStudentDiscounts(studentId: string) {
  const pool = getPostgresPool();
  const result = await pool.query(
    `select *
     from discounts
     where student_id = $1
     order by active desc, created_at desc`,
    [studentId]
  );
  return result.rows as Discount[];
}

export async function createStudentDiscount(studentId: string, input: CreateDiscountInput) {
  const payload = {
    student_id: studentId,
    name: input.name,
    amount: input.amount,
    type: input.type,
    fee_plan_id: input.fee_plan_id || null,
    active: input.active ?? true,
    note: input.note || null,
    start_date: input.start_date || null,
    end_date: input.end_date || null,
  };

  return insertRow<Discount>('discounts', payload as Record<string, unknown>);
}

export async function updateStudentDiscount(id: string, input: UpdateDiscountInput) {
  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = input.name;
  if (input.amount !== undefined) payload.amount = input.amount;
  if (input.type !== undefined) payload.type = input.type;
  if (input.fee_plan_id !== undefined) payload.fee_plan_id = input.fee_plan_id || null;
  if (input.active !== undefined) payload.active = input.active;
  if (input.note !== undefined) payload.note = input.note || null;
  if (input.start_date !== undefined) payload.start_date = input.start_date || null;
  if (input.end_date !== undefined) payload.end_date = input.end_date || null;
  payload.updated_at = new Date().toISOString();

  return updateRowById<Discount>('discounts', id, payload);
}

export async function deleteStudentDiscount(id: string) {
  await deleteRowById('discounts', id);
  return { success: true };
}

export async function buildStudentFeeDiscountMap(studentId: string, fees: Array<{ id: string; fee_plan_id: string; total_amount: number }>) {
  const discounts = await getStudentDiscounts(studentId);
  const activeDiscounts = discounts.filter((discount) => discount.active !== false);

  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const discountMap: Record<string, number> = {};
  for (const fee of fees) {
    let totalDiscount = 0;
    for (const discount of activeDiscounts) {
      if (discount.fee_plan_id && discount.fee_plan_id !== fee.fee_plan_id) continue;
      if (discount.start_date && discount.start_date > today) continue;
      if (discount.end_date && discount.end_date < today) continue;
      totalDiscount += calculateDiscountValue(discount, Number(fee.total_amount));
    }
    discountMap[fee.id] = Math.max(Math.min(totalDiscount, Number(fee.total_amount)), 0);
  }

  return { discounts, discountMap };
}
