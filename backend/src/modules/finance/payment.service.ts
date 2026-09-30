import fs from 'fs/promises';
import path from 'path';
import { PoolClient } from 'pg';
import { getPostgresPool } from '../../config/database';
import { getReceiptSettingsRecord, saveReceiptSettingsRecord } from '../../repositories/receiptSettings.repository';
import { buildLocalFileUrl, getBrandingDir, getTransferSlipDir, resolveSchoolLogoUrl } from '../../config/storage';
import { buildStudentFeeDiscountMap } from './discount.service';
import { Payment, ProcessPaymentInput, ReceiptSettings } from './finance.types';

function stripBase64Prefix(value: string) {
  const marker = 'base64,';
  const index = value.indexOf(marker);
  return index >= 0 ? value.slice(index + marker.length) : value;
}

function getSlipExtension(mimeType: string) {
  if (mimeType.includes('png')) return 'png';
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('webp')) return 'webp';
  return 'jpg';
}

function getLocalSlipRelativePath(paymentId: string, fileName: string) {
  return path.posix.join('transfer-slips', paymentId, fileName);
}

async function getCurrentAcademicYearIdForPayments(): Promise<string> {
  const pool = getPostgresPool();
  const result = await pool.query(
    'select id from academic_years where is_current = true order by created_at desc limit 1'
  );
  return result.rows[0]?.id || '';
}

export async function generateReceiptNumber(client?: PoolClient) {
  const now = new Date();
  const buddhistYear = now.getFullYear() + 543;
  const prefix = `R${buddhistYear}`;
  const executor = client || getPostgresPool();
  const result = await executor.query(
    `insert into receipt_number_sequences (buddhist_year, next_number, updated_at)
     values ($1, 2, now())
     on conflict (buddhist_year)
     do update set next_number = receipt_number_sequences.next_number + 1, updated_at = now()
     returning next_number - 1 as receipt_number`,
    [buddhistYear]
  );
  return `${prefix}-${Number(result.rows[0].receipt_number).toString().padStart(5, '0')}`;
}

export async function processPayment(input: ProcessPaymentInput) {
  const { student_id, payment_method, payment_date, payee_name, items, idempotency_key } = input;
  if (!student_id || !payment_method || !payment_date || !Array.isArray(items) || items.length === 0) {
    throw new Error('กรุณาระบุนักเรียน ช่องทางรับเงิน วันที่ และรายการที่ชำระ');
  }
  const seenFeeIds = new Set<string>();
  for (const item of items) {
    const amount = Number(item.amount);
    if (!item.student_fee_id || !Number.isFinite(amount) || amount <= 0) {
      throw new Error('จำนวนเงินที่รับชำระต้องมากกว่า 0');
    }
    if (seenFeeIds.has(item.student_fee_id)) {
      throw new Error('ไม่สามารถรับชำระรายการหนี้เดียวกันซ้ำในใบเสร็จเดียว');
    }
    seenFeeIds.add(item.student_fee_id);
  }
  const totalAmount = Math.round(items.reduce((sum, item) => sum + Number(item.amount), 0) * 100) / 100;

  const pool = getPostgresPool();
  const client = await pool.connect();

  try {
    await client.query('begin');

    if (idempotency_key?.trim()) {
      const replay = await client.query(
        'select * from payments where idempotency_key = $1 limit 1',
        [idempotency_key.trim()]
      );
      if (replay.rows[0]) {
        await client.query('commit');
        return replay.rows[0] as Payment;
      }
    }

    const lockedFees: Array<{ id: string; amount: number; paid_amount: number; total_amount: number; discount_amount: number }> = [];
    for (const item of items) {
      const studentFeeResult = await client.query(
        `select id, paid_amount, total_amount, coalesce(discount_amount, 0) as discount_amount
         from student_fees
         where id = $1 and student_id = $2
         for update`,
        [item.student_fee_id, student_id]
      );
      const studentFee = studentFeeResult.rows[0];
      if (!studentFee) throw new Error('พบรายการหนี้ที่ไม่ใช่ของนักเรียนคนนี้ หรือไม่มีอยู่ในระบบ');
      const balance = Math.max(
        Number(studentFee.total_amount) - Number(studentFee.discount_amount) - Number(studentFee.paid_amount),
        0
      );
      if (Number(item.amount) > balance + 0.000001) {
        throw new Error('ยอดรับชำระมากกว่ายอดคงเหลือของรายการที่เลือก');
      }
      lockedFees.push({ ...studentFee, amount: Number(item.amount) });
    }

    const receiptNo = await generateReceiptNumber(client);

    const settings = await getReceiptSettingsRecord();
    const payeeName = payee_name?.trim() || settings.payee_name || 'Finance Office';

    const paymentResult = await client.query(
      `insert into payments (
        student_id, receipt_no, payment_date, payment_method, total_amount, payee_name, idempotency_key
      ) values ($1, $2, $3, $4, $5, $6, $7)
      returning *`,
      [student_id, receiptNo, payment_date, payment_method, totalAmount, payeeName, idempotency_key?.trim() || null]
    );

    const payment = paymentResult.rows[0];
    if (!payment) throw new Error('Unable to create payment record');

    for (const studentFee of lockedFees) {
      const newPaidAmount = Number(studentFee.paid_amount) + studentFee.amount;
      const netAmount = Math.max(Number(studentFee.total_amount) - Number(studentFee.discount_amount), 0);
      const newStatus: 'unpaid' | 'partial' | 'paid' =
        newPaidAmount >= netAmount ? 'paid' : 'partial';

      await client.query(
        'update student_fees set paid_amount = $1, status = $2 where id = $3',
        [newPaidAmount, newStatus, studentFee.id]
      );

      await client.query(
        `insert into payment_items (payment_id, student_fee_id, amount)
         values ($1, $2, $3)`,
        [payment.id, studentFee.id, studentFee.amount]
      );
    }

    await client.query('commit');

    try {
      const { saveReceiptPdfToDisk } = await import('./pdf.service');
      await saveReceiptPdfToDisk(payment.id);
      const { sendReceiptToGas } = await import('./receiptGas.service');
      await sendReceiptToGas(payment.id);
    } catch (receiptError) {
      console.error('Failed to save receipt PDF for payment:', receiptError);
    }

    return payment as Payment;
  } catch (error: any) {
    await client.query('rollback');
    if (error?.code === '23505' && idempotency_key?.trim()) {
      const replay = await pool.query(
        'select * from payments where idempotency_key = $1 limit 1',
        [idempotency_key.trim()]
      );
      if (replay.rows[0]) return replay.rows[0] as Payment;
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function getPaymentDetail(paymentId: string) {
  const pool = getPostgresPool();
  const result = await pool.query(
    `select
      p.*,
      json_build_object(
        'student_id', s.student_id,
        'first_name', s.first_name,
        'last_name', s.last_name
      ) as student_info,
      coalesce((
        select json_agg(
          json_build_object(
            'id', pi.id,
            'payment_id', pi.payment_id,
            'student_fee_id', pi.student_fee_id,
            'amount', pi.amount,
            'created_at', pi.created_at,
            'student_fee_info', json_build_object(
              'id', sf.id,
              'billing_month', sf.billing_month,
              'billing_year', sf.billing_year,
              'semester_id', sf.semester_id,
              'academic_year_id', sf.academic_year_id,
              'fee_plan_info', json_build_object('name', fp.name),
              'academic_year_info', json_build_object('year', ay.year),
              'semester_info', json_build_object('semester', sem.semester)
            )
          )
          order by pi.created_at asc
        )
        from payment_items pi
        left join student_fees sf on sf.id = pi.student_fee_id
        left join fee_plans fp on fp.id = sf.fee_plan_id
        left join academic_years ay on ay.id = sf.academic_year_id
        left join semesters sem on sem.id = sf.semester_id
        where pi.payment_id = p.id
      ), '[]'::json) as items
    from payments p
    left join students s on s.id = p.student_id
    where p.id = $1
    limit 1`,
    [paymentId]
  );

  if (!result.rows[0]) throw new Error('Payment record not found');
  return result.rows[0];
}

export async function getPaymentForReceipt(paymentId: string) {
  const pool = getPostgresPool();
  const result = await pool.query(
    `select
      p.id,
      p.receipt_no,
      p.payment_date,
      p.total_amount,
      p.payee_name,
      json_build_object(
        'id', s.id,
        'prefix', s.prefix,
        'first_name', s.first_name,
        'last_name', s.last_name,
        'student_id', s.student_id,
        'enrollments', coalesce((
          select json_agg(
            json_build_object(
              'academic_year_id', se.academic_year_id,
              'room', json_build_object(
                'room_number', r.room_number,
                'grade', json_build_object('name', gl.name)
              )
            )
          )
          from student_enrollments se
          left join rooms r on r.id = se.room_id
          left join grade_levels gl on gl.id = r.grade_id
          where se.student_id = s.id
        ), '[]'::json)
      ) as student,
      coalesce((
        select json_agg(
          json_build_object(
            'id', pi.id,
            'amount', pi.amount,
            'fee', json_build_object(
              'semester_id', sf.semester_id,
              'academic_year_id', sf.academic_year_id,
              'plan', json_build_object('name', fp.name),
              'sem', json_build_object('semester', sem.semester),
              'ay', json_build_object('year', ay.year)
            )
          )
        )
        from payment_items pi
        left join student_fees sf on sf.id = pi.student_fee_id
        left join fee_plans fp on fp.id = sf.fee_plan_id
        left join semesters sem on sem.id = sf.semester_id
        left join academic_years ay on ay.id = sf.academic_year_id
        where pi.payment_id = p.id
      ), '[]'::json) as items
    from payments p
    left join students s on s.id = p.student_id
    where p.id = $1
    limit 1`,
    [paymentId]
  );

  if (!result.rows[0]) throw new Error('Payment record not found');
  return result.rows[0];
}

export async function getDashboardStats() {
  const today = new Date().toISOString().split('T')[0];
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const monthStr = startOfMonth.toISOString().split('T')[0];

  const pool = getPostgresPool();
  const [todayResult, monthResult, feeRowsResult] = await Promise.all([
    pool.query("select coalesce(sum(total_amount), 0) as total from payments where payment_date = $1 and status <> 'voided'", [today]),
    pool.query("select coalesce(sum(total_amount), 0) as total from payments where payment_date >= $1 and status <> 'voided'", [monthStr]),
    pool.query('select id, student_id, fee_plan_id, total_amount, paid_amount, status, coalesce(discount_amount, 0) as discount_amount, discount_snapshot_locked from student_fees'),
  ]);

  const feeRows = feeRowsResult.rows as Array<{
    id: string;
    student_id: string;
    fee_plan_id: string;
    total_amount: number;
    paid_amount: number;
    status: string;
    discount_amount?: number;
    discount_snapshot_locked?: boolean;
  }>;

  const grouped = new Map<string, typeof feeRows>();
  feeRows.forEach((row) => {
    if (!grouped.has(row.student_id)) grouped.set(row.student_id, []);
    grouped.get(row.student_id)!.push(row);
  });

  let totalAmount = 0;
  let paidAmount = 0;
  let pendingAmount = 0;
  let pendingStudentsCount = 0;

  for (const [studentId, fees] of grouped.entries()) {
    const { discountMap } = await buildStudentFeeDiscountMap(studentId, fees.filter((fee) => !fee.discount_snapshot_locked));
    let studentPending = 0;
    for (const fee of fees) {
      const discountAmount = fee.discount_snapshot_locked
        ? Number(fee.discount_amount || 0)
        : discountMap[fee.id] || 0;
      const effectiveTotal = Math.max(Number(fee.total_amount) - discountAmount, 0);
      totalAmount += effectiveTotal;
      paidAmount += Number(fee.paid_amount || 0);
      const balance = Math.max(effectiveTotal - Number(fee.paid_amount || 0), 0);
      pendingAmount += balance;
      studentPending += balance;
    }
    if (studentPending > 0) pendingStudentsCount += 1;
  }

  return {
    todayTotal: Number(todayResult.rows[0]?.total || 0),
    monthTotal: Number(monthResult.rows[0]?.total || 0),
    pendingStudentsCount,
    totalAmount,
    paidAmount,
    pendingAmount,
  };
}

export async function getStudentPayments(studentId: string) {
  const pool = getPostgresPool();
  const result = await pool.query(
    `select
      p.*,
      coalesce((
        select json_agg(
          json_build_object(
            'id', pi.id,
            'payment_id', pi.payment_id,
            'student_fee_id', pi.student_fee_id,
            'amount', pi.amount,
            'created_at', pi.created_at,
            'student_fee_info', json_build_object(
              'id', sf.id,
              'billing_month', sf.billing_month,
              'billing_year', sf.billing_year,
              'semester_id', sf.semester_id,
              'academic_year_id', sf.academic_year_id,
              'fee_plan_info', json_build_object('name', fp.name),
              'academic_year_info', json_build_object('year', ay.year),
              'semester_info', json_build_object('semester', sem.semester)
            )
          )
          order by pi.created_at asc
        )
        from payment_items pi
        left join student_fees sf on sf.id = pi.student_fee_id
        left join fee_plans fp on fp.id = sf.fee_plan_id
        left join academic_years ay on ay.id = sf.academic_year_id
        left join semesters sem on sem.id = sf.semester_id
        where pi.payment_id = p.id
      ), '[]'::json) as items
    from payments p
    where p.student_id = $1
    order by p.payment_date desc, p.created_at desc`,
    [studentId]
  );

  return result.rows;
}

export async function deletePayment(paymentId: string, voidReason?: string) {
  const pool = getPostgresPool();
  const client = await pool.connect();

  try {
    await client.query('begin');
    const paymentResult = await client.query(
      `select p.*, coalesce((
        select json_agg(json_build_object('student_fee_id', pi.student_fee_id, 'amount', pi.amount))
        from payment_items pi
        where pi.payment_id = p.id
      ), '[]'::json) as items
      from payments p
      where p.id = $1
      limit 1
      for update`,
      [paymentId]
    );

    const payment = paymentResult.rows[0];
    if (!payment) throw new Error('Payment record not found');
    if (payment.status === 'voided') throw new Error('รายการรับเงินนี้ถูกยกเลิกไปแล้ว');

    for (const item of payment.items as Array<{ student_fee_id: string | null; amount: number }>) {
      if (!item.student_fee_id) continue;

      const feeResult = await client.query(
        'select paid_amount, total_amount, coalesce(discount_amount, 0) as discount_amount from student_fees where id = $1 for update',
        [item.student_fee_id]
      );
      const fee = feeResult.rows[0];
      if (!fee) continue;

      const newPaidAmount = Math.max(0, Number(fee.paid_amount) - Number(item.amount));
      let newStatus: 'unpaid' | 'partial' | 'paid' = 'partial';
      if (newPaidAmount === 0) newStatus = 'unpaid';
      else if (newPaidAmount >= Math.max(Number(fee.total_amount) - Number(fee.discount_amount), 0)) newStatus = 'paid';

      await client.query(
        'update student_fees set paid_amount = $1, status = $2 where id = $3',
        [newPaidAmount, newStatus, item.student_fee_id]
      );
    }

    await client.query(
      `update payments
       set status = 'voided', void_reason = $2, voided_at = now()
       where id = $1`,
      [paymentId, voidReason?.trim() || 'ยกเลิกรายการรับเงิน']
    );
    await client.query('commit');
    return { success: true };
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

export async function getPaymentByReceiptNo(receiptNo: string) {
  const pool = getPostgresPool();
  const result = await pool.query(
    `select
      p.*,
      json_build_object(
        'student_id', s.student_id,
        'first_name', s.first_name,
        'last_name', s.last_name
      ) as student_info,
      coalesce((
        select json_agg(
          json_build_object(
            'id', pi.id,
            'payment_id', pi.payment_id,
            'student_fee_id', pi.student_fee_id,
            'amount', pi.amount,
            'created_at', pi.created_at
          )
        )
        from payment_items pi
        where pi.payment_id = p.id
      ), '[]'::json) as items
    from payments p
    left join students s on s.id = p.student_id
    where p.receipt_no = $1
    limit 1`,
    [receiptNo]
  );

  if (!result.rows[0]) throw new Error('Payment record not found');
  return result.rows[0];
}

export async function getLatestPayments(limit: number = 10) {
  const pool = getPostgresPool();
  const limitValue = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 10;
  const result = await pool.query(
    `select
      p.*,
      json_build_object(
        'student_id', s.student_id,
        'first_name', s.first_name,
        'last_name', s.last_name
      ) as student_info,
      coalesce((
        select json_agg(
          json_build_object(
            'id', pi.id,
            'payment_id', pi.payment_id,
            'student_fee_id', pi.student_fee_id,
            'amount', pi.amount,
            'created_at', pi.created_at
          )
        )
        from payment_items pi
        where pi.payment_id = p.id
      ), '[]'::json) as items
    from payments p
    left join students s on s.id = p.student_id
    order by p.created_at desc
    limit $1`,
    [limitValue]
  );

  return result.rows;
}

export async function uploadTransferSlip(
  paymentId: string,
  slipBase64: string,
  mimeType: string = 'image/jpeg'
) {
  const pool = getPostgresPool();
  const result = await pool.query(
    `select
      p.receipt_no,
      p.payment_date,
      p.payment_method,
      json_build_object(
        'first_name', s.first_name,
        'last_name', s.last_name,
        'student_id', s.student_id
      ) as student_info
    from payments p
    left join students s on s.id = p.student_id
    where p.id = $1
    limit 1`,
    [paymentId]
  );

  const payment = result.rows[0];
  if (!payment) throw new Error('Payment not found');

  const ext = getSlipExtension(mimeType);
  const fileName = `${payment.receipt_no}_slip.${ext}`;
  const fileBuffer = Buffer.from(stripBase64Prefix(slipBase64), 'base64');
  const targetDir = path.join(getTransferSlipDir(), paymentId);
  await fs.mkdir(targetDir, { recursive: true });

  const storagePath = getLocalSlipRelativePath(paymentId, fileName);
  await fs.writeFile(path.join(targetDir, fileName), fileBuffer);
  await pool.query('update payments set transfer_slip_url = $1 where id = $2', [storagePath, paymentId]);

  return { success: true, transfer_slip_url: storagePath };
}

export async function getPaymentSlipUrl(paymentId: string) {
  const pool = getPostgresPool();
  const result = await pool.query(
    'select transfer_slip_url, evidence_url from payments where id = $1 limit 1',
    [paymentId]
  );

  const payment = result.rows[0];
  if (!payment) throw new Error('Payment not found');

  if (payment.evidence_url && payment.evidence_url.startsWith('http')) {
    return payment.evidence_url;
  }

  if (!payment.transfer_slip_url) {
    throw new Error('No slip found for this payment');
  }

  if (payment.transfer_slip_url.startsWith('http')) {
    return payment.transfer_slip_url;
  }

  return buildLocalFileUrl(payment.transfer_slip_url);
}

export async function getPaymentStatsByYear() {
  const pool = getPostgresPool();
  const currentYearId = await getCurrentAcademicYearIdForPayments();
  if (!currentYearId) return [];

  const result = await pool.query(
    `select
      ay.id as academic_year_id,
      ay.year as academic_year,
      coalesce(sum(p.total_amount), 0) as total
    from payments p
    join student_fees sf on sf.id = p.id
    join academic_years ay on ay.id = sf.academic_year_id
    where ay.id = $1
    group by ay.id, ay.year`,
    [currentYearId]
  );

  return result.rows;
}

export async function getReceiptSettings() {
  const settings = await getReceiptSettingsRecord();
  return { ...settings, school_logo_url: resolveSchoolLogoUrl(settings.school_logo_url) };
}

export async function updateReceiptSettings(input: ReceiptSettings) {
  return saveReceiptSettingsRecord(input);
}

export async function uploadReceiptLogo(file: {
  buffer: Buffer;
  mimetype: string;
  originalname?: string;
}) {
  const ext = getSlipExtension(file.mimetype) === 'jpg' && file.mimetype.includes('png')
    ? 'png'
    : getSlipExtension(file.mimetype);
  const fileName = `school-logo.${ext}`;
  const relativePath = path.posix.join('branding', fileName);
  const absolutePath = path.join(getBrandingDir(), fileName);
  const url = buildLocalFileUrl(relativePath);

  await fs.mkdir(getBrandingDir(), { recursive: true });
  await fs.writeFile(absolutePath, file.buffer);

  const current = await getReceiptSettingsRecord();
  await saveReceiptSettingsRecord({
    ...current,
    school_logo_url: url,
  });

  return { success: true, url, path: absolutePath };
}
