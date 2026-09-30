import { getPostgresPool } from '../../config/database';
import { deleteRowById, insertRow, updateRowById } from '../../repositories/postgresCrud';
import { buildStudentFeeDiscountMap } from './discount.service';
import { CreateFeePlanInput, FeePlan } from './finance.types';

async function getCurrentAcademicYearId(): Promise<string> {
  const pool = getPostgresPool();
  const result = await pool.query(
    'select id from academic_years where is_current = true order by created_at desc limit 1'
  );
  return result.rows[0]?.id || '';
}

async function getFeePlanAmountAndGrade(feePlanId: string) {
  const pool = getPostgresPool();
  const result = await pool.query(
    'select id, name, amount, grade_level_id from fee_plans where id = $1 limit 1',
    [feePlanId]
  );
  return result.rows[0] as { id: string; name: string; amount: number; grade_level_id: string | null } | undefined;
}

function getBillingPeriodKey(
  feePlanId: string,
  semesterId?: string | null,
  academicYearId?: string | null,
  billingMonth?: number | null,
  billingYear?: number | null
) {
  if (billingMonth && billingYear) {
    return `monthly:${feePlanId}:${billingYear}-${String(billingMonth).padStart(2, '0')}`;
  }
  if (semesterId) return `semester:${feePlanId}:${semesterId}`;
  return `once:${feePlanId}:${academicYearId || 'unassigned'}`;
}

export async function getFeePlans() {
  const pool = getPostgresPool();
  const result = await pool.query(
    `select
      fp.*,
      case
        when rt.id is null then null
        else json_build_object('name', rt.name)
      end as receipt_type_info
    from fee_plans fp
    left join receipt_types rt on rt.id = fp.receipt_type_id
    order by fp.created_at desc`
  );

  return result.rows;
}

export async function getReceiptTypes() {
  const pool = getPostgresPool();
  const result = await pool.query('select * from receipt_types order by created_at asc');
  return result.rows;
}

export async function createReceiptType(input: Record<string, unknown>) {
  return insertRow('receipt_types', input);
}

export async function updateReceiptType(id: string, input: Record<string, unknown>) {
  return updateRowById('receipt_types', id, input);
}

export async function deleteReceiptType(id: string) {
  await deleteRowById('receipt_types', id);
  return { success: true };
}

export async function createFeePlan(input: CreateFeePlanInput) {
  return insertRow<FeePlan>('fee_plans', input as unknown as Record<string, unknown>);
}

export async function deleteFeePlan(id: string) {
  await deleteRowById('fee_plans', id);
  return { success: true };
}

export async function generateFeesForGrade(
  feePlanId: string,
  semesterId?: string | null,
  academicYearId?: string | null,
  billingMonth?: number | null,
  billingYear?: number | null
) {
  const pool = getPostgresPool();
  const feePlan = await getFeePlanAmountAndGrade(feePlanId);
  if (!feePlan) throw new Error('Fee plan not found');

  const targetYearId = academicYearId || (await getCurrentAcademicYearId());
  if (!targetYearId) throw new Error('Current academic year not set');

  const enrollments = await pool.query(
    `select se.student_id
     from student_enrollments se
     join rooms r on r.id = se.room_id
     where se.academic_year_id = $1
       and se.status = 'active'
       and r.grade_id = $2`,
    [targetYearId, feePlan.grade_level_id]
  );

  if (enrollments.rows.length === 0) return { count: 0 };

  const existingParams: unknown[] = [feePlanId];
  let existingSql = 'select student_id from student_fees where fee_plan_id = $1';
  if (semesterId) {
    existingParams.push(semesterId);
    existingSql += ` and semester_id = $${existingParams.length}`;
  }
  if (billingMonth) {
    existingParams.push(billingMonth);
    existingSql += ` and billing_month = $${existingParams.length}`;
  }
  if (billingYear) {
    existingParams.push(billingYear);
    existingSql += ` and billing_year = $${existingParams.length}`;
  }

  const existingFees = await pool.query(existingSql, existingParams);
  const existingStudentIds = new Set(existingFees.rows.map((row) => row.student_id));
  const billingPeriodKey = getBillingPeriodKey(feePlanId, semesterId, targetYearId, billingMonth, billingYear);

  let inserted = 0;
  for (const enrollment of enrollments.rows) {
    if (existingStudentIds.has(enrollment.student_id)) continue;

    await pool.query(
      `insert into student_fees (
        student_id, fee_plan_id, total_amount, paid_amount, discount_amount, discount_snapshot_locked,
        status, academic_year_id, semester_id, billing_month, billing_year, billing_period_key, fee_name_snapshot
      ) values ($1, $2, $3, 0, 0, true, 'unpaid', $4, $5, $6, $7, $8, $9)
      on conflict (student_id, fee_plan_id, billing_period_key) do nothing`,
      [
        enrollment.student_id,
        feePlanId,
        feePlan.amount,
        targetYearId,
        semesterId || null,
        billingMonth || null,
        billingYear || null,
        billingPeriodKey,
        feePlan.name,
      ]
    );
    inserted += 1;
  }

  return { count: inserted };
}

export async function getStudentFees(studentId: string) {
  const pool = getPostgresPool();
  const result = await pool.query(
    `select
      sf.*,
      json_build_object(
        'id', fp.id,
        'name', fp.name,
        'amount', fp.amount,
        'receipt_type_id', fp.receipt_type_id,
        'target_grade_id', fp.target_grade_id,
        'target_room_id', fp.target_room_id,
        'billing_cycle', fp.billing_cycle,
        'billing_day', fp.billing_day,
        'description', fp.description,
        'created_at', fp.created_at
      ) as fee_plan_info,
      json_build_object('year', ay.year) as academic_year_info,
      json_build_object('semester', sem.semester) as semester_info
    from student_fees sf
    left join fee_plans fp on fp.id = sf.fee_plan_id
    left join academic_years ay on ay.id = sf.academic_year_id
    left join semesters sem on sem.id = sf.semester_id
    where sf.student_id = $1
    order by sf.created_at desc`,
    [studentId]
  );

  const fees = result.rows as Array<{
    id: string;
    fee_plan_id: string;
    total_amount: number;
    discount_amount?: number;
    discount_snapshot_locked?: boolean;
  } & Record<string, unknown>>;
  const legacyFees = fees.filter((fee) => !fee.discount_snapshot_locked);
  const { discountMap } = await buildStudentFeeDiscountMap(studentId, legacyFees);

  return fees.map((fee) => {
    const discountAmount = fee.discount_snapshot_locked
      ? Number(fee.discount_amount || 0)
      : discountMap[fee.id] || 0;
    const effectiveBalance = Math.max(Number(fee.total_amount) - Number(fee.paid_amount || 0) - discountAmount, 0);
    const effectiveStatus = effectiveBalance <= 0 ? 'paid' : Number(fee.paid_amount || 0) > 0 ? 'partial' : 'unpaid';
    return {
      ...fee,
      discount_amount: discountAmount,
      effective_balance: effectiveBalance,
      status: effectiveStatus,
    };
  });
}

export async function generateFeesForRoom(
  feePlanId: string,
  roomId: string,
  semesterId?: string | null,
  academicYearId?: string | null,
  billingMonth?: number | null,
  billingYear?: number | null
) {
  const pool = getPostgresPool();
  const targetYearId = academicYearId || (await getCurrentAcademicYearId());
  if (!targetYearId) throw new Error('Current academic year not set');

  const enrollments = await pool.query(
    `select student_id
     from student_enrollments
     where room_id = $1
       and academic_year_id = $2
       and status = 'active'`,
    [roomId, targetYearId]
  );

  if (enrollments.rows.length === 0) return { count: 0 };

  const feePlan = await getFeePlanAmountAndGrade(feePlanId);
  if (!feePlan) throw new Error('Fee plan not found');

  const existingParams: unknown[] = [feePlanId];
  let existingSql = 'select student_id from student_fees where fee_plan_id = $1';
  if (semesterId) {
    existingParams.push(semesterId);
    existingSql += ` and semester_id = $${existingParams.length}`;
  }
  if (billingMonth) {
    existingParams.push(billingMonth);
    existingSql += ` and billing_month = $${existingParams.length}`;
  }
  if (billingYear) {
    existingParams.push(billingYear);
    existingSql += ` and billing_year = $${existingParams.length}`;
  }

  const existingFees = await pool.query(existingSql, existingParams);
  const existingStudentIds = new Set(existingFees.rows.map((row) => row.student_id));
  const billingPeriodKey = getBillingPeriodKey(feePlanId, semesterId, targetYearId, billingMonth, billingYear);

  let inserted = 0;
  for (const enrollment of enrollments.rows) {
    if (existingStudentIds.has(enrollment.student_id)) continue;

    await pool.query(
      `insert into student_fees (
        student_id, fee_plan_id, total_amount, paid_amount, discount_amount, discount_snapshot_locked,
        status, academic_year_id, semester_id, billing_month, billing_year, billing_period_key, fee_name_snapshot
      ) values ($1, $2, $3, 0, 0, true, 'unpaid', $4, $5, $6, $7, $8, $9)
      on conflict (student_id, fee_plan_id, billing_period_key) do nothing`,
      [
        enrollment.student_id,
        feePlanId,
        feePlan.amount,
        targetYearId,
        semesterId || null,
        billingMonth || null,
        billingYear || null,
        billingPeriodKey,
        feePlan.name,
      ]
    );
    inserted += 1;
  }

  return { count: inserted };
}

export async function createIndividualFee(
  studentId: string,
  feePlanId: string,
  amount: number,
  source: 'system' | 'legacy' = 'system',
  semesterId?: string | null,
  academicYearId?: string | null,
  billingMonth?: number | null,
  billingYear?: number | null,
  dueDate?: string | null
) {
  const pool = getPostgresPool();
  const [studentResult, feePlanResult] = await Promise.all([
    pool.query('select id from students where id = $1 limit 1', [studentId]),
    pool.query('select id, name from fee_plans where id = $1 limit 1', [feePlanId]),
  ]);

  if (!studentResult.rows[0]) throw new Error('Student not found');
  if (!feePlanResult.rows[0]) throw new Error('Fee plan not found');
  const billingPeriodKey = getBillingPeriodKey(feePlanId, semesterId, academicYearId, billingMonth, billingYear);

  try {
    const result = await pool.query(
      `insert into student_fees (
        student_id, fee_plan_id, total_amount, paid_amount, discount_amount, discount_snapshot_locked, status, source,
        semester_id, academic_year_id, billing_month, billing_year, billing_period_key, fee_name_snapshot, due_date
      ) values ($1, $2, $3, 0, 0, true, 'unpaid', $4, $5, $6, $7, $8, $9, $10, $11)
      returning *`,
      [
        studentId,
        feePlanId,
        amount,
        source,
        semesterId || null,
        academicYearId || null,
        billingMonth || null,
        billingYear || null,
        billingPeriodKey,
        feePlanResult.rows[0].name,
        dueDate || null,
      ]
    );

    return result.rows[0];
  } catch (error: any) {
    if (error.code === '23505') {
      throw new Error('นักเรียนคนนี้มีรายการนี้อยู่แล้ว');
    }
    throw error;
  }
}

export async function updateStudentFee(id: string, amount: number) {
  const pool = getPostgresPool();
  const feeResult = await pool.query(
    'select paid_amount from student_fees where id = $1 limit 1',
    [id]
  );
  const fee = feeResult.rows[0];

  if (!fee) throw new Error('Fee record not found');
  if (amount < Number(fee.paid_amount)) {
    throw new Error('ยอดเงินรวมไม่สามารถน้อยกว่ายอดที่ชำระมาแล้วได้');
  }

  let newStatus: 'unpaid' | 'partial' | 'paid' = 'partial';
  if (Number(fee.paid_amount) === 0) newStatus = 'unpaid';
  else if (Number(fee.paid_amount) >= amount) newStatus = 'paid';

  return updateRowById('student_fees', id, {
    total_amount: amount,
    status: newStatus,
  });
}

export async function deleteStudentFee(id: string) {
  const pool = getPostgresPool();
  const itemsResult = await pool.query(
    'select id from payment_items where student_fee_id = $1 limit 1',
    [id]
  );

  if (itemsResult.rows.length > 0) {
    throw new Error('ไม่สามารถลบรายการที่มีการชำระเงินเข้าแล้วได้');
  }

  await deleteRowById('student_fees', id);
  return { success: true };
}

export async function getRoomBalances(roomId: string) {
  const pool = getPostgresPool();
  const currentYearId = await getCurrentAcademicYearId();
  if (!currentYearId) return {};

  const enrolledStudents = await pool.query(
    `select student_id
     from student_enrollments
     where room_id = $1
       and academic_year_id = $2
       and status = 'active'`,
    [roomId, currentYearId]
  );

  const studentIds = enrolledStudents.rows.map((row) => row.student_id);
  if (studentIds.length === 0) return {};

  const feesResult = await pool.query(
    `select id, student_id, fee_plan_id, total_amount, paid_amount, status,
            coalesce(discount_amount, 0) as discount_amount, discount_snapshot_locked
     from student_fees
     where student_id = any($1::uuid[])`,
    [studentIds]
  );

  const balances: Record<string, number> = {};
  const grouped = new Map<string, Array<{ id: string; student_id: string; fee_plan_id: string; total_amount: number; paid_amount: number; status: string; discount_amount?: number; discount_snapshot_locked?: boolean }>>();
  feesResult.rows.forEach((fee) => {
    if (!grouped.has(fee.student_id)) grouped.set(fee.student_id, []);
    grouped.get(fee.student_id)!.push(fee);
  });

  for (const [studentIdKey, fees] of grouped.entries()) {
    const { discountMap } = await buildStudentFeeDiscountMap(studentIdKey, fees.filter((fee) => !fee.discount_snapshot_locked));
    balances[studentIdKey] = fees.reduce((sum, fee) => {
      const discountAmount = fee.discount_snapshot_locked
        ? Number(fee.discount_amount || 0)
        : discountMap[fee.id || ''] || 0;
      const balance = Math.max(Number(fee.total_amount) - Number(fee.paid_amount || 0) - discountAmount, 0);
      return sum + balance;
    }, 0);
  }

  return balances;
}

export async function getFeeAssignments(feePlanId: string) {
  const pool = getPostgresPool();
  const result = await pool.query(
    `select
      sfa.*,
      json_build_object(
        'id', s.id,
        'first_name', s.first_name,
        'last_name', s.last_name,
        'student_id', s.student_id
      ) as student_info
    from student_fee_assignments sfa
    join students s on s.id = sfa.student_id
    where sfa.fee_plan_id = $1`,
    [feePlanId]
  );

  return result.rows;
}

type ArrearsCategory = 'tuition' | 'special' | 'other';

function categorizeFeeName(name: string): ArrearsCategory {
  const normalized = String(name || '').toLowerCase();
  if (
    normalized.includes('ค่าเทอม') ||
    normalized.includes('tuition') ||
    normalized.includes('school fee') ||
    normalized.includes('ภาคเรียน')
  ) {
    return 'tuition';
  }
  if (
    normalized.includes('เรียนพิเศษ') ||
    normalized.includes('พิเศษ') ||
    normalized.includes('special') ||
    normalized.includes('steam') ||
    normalized.includes('เสริม')
  ) {
    return 'special';
  }
  return 'other';
}

export async function getArrearsReport(filters: {
  academicYearId?: string | null;
  roomId?: string | null;
  gradeId?: string | null;
  search?: string | null;
} = {}) {
  const pool = getPostgresPool();
  const targetYearId = filters.academicYearId || (await getCurrentAcademicYearId());
  if (!targetYearId) {
    return {
      summary: {
        totalStudents: 0,
        totalBalance: 0,
        tuitionBalance: 0,
        specialBalance: 0,
        otherBalance: 0,
      },
      rows: [],
      grouped: {
        tuition: [],
        special: [],
        other: [],
      },
    };
  }

  const where: string[] = ['se.academic_year_id = $1', "se.status = 'active'"];
  const params: unknown[] = [targetYearId];
  if (filters.roomId) {
    params.push(filters.roomId);
    where.push(`se.room_id = $${params.length}`);
  }
  if (filters.gradeId) {
    params.push(filters.gradeId);
    where.push(`r.grade_id = $${params.length}`);
  }
  if (filters.search) {
    params.push(`%${filters.search}%`);
    where.push(`(s.first_name ilike $${params.length} or s.last_name ilike $${params.length} or s.student_id ilike $${params.length})`);
  }

  const result = await pool.query(
    `select
      s.id as student_id,
      s.student_id as student_code,
      s.first_name,
      s.last_name,
      s.prefix,
      s.gender,
      r.room_number,
      gl.name as grade_name,
      ay.year as academic_year,
      sf.id as fee_id,
      sf.total_amount,
      sf.paid_amount,
      sf.status,
      sf.due_date,
      sf.billing_month,
      sf.billing_year,
      fp.id as fee_plan_id,
      fp.name as fee_name,
      fp.description as fee_description,
      rt.name as receipt_type_name
    from students s
    join student_enrollments se on se.student_id = s.id
    left join rooms r on r.id = se.room_id
    left join grade_levels gl on gl.id = r.grade_id
    left join academic_years ay on ay.id = se.academic_year_id
    left join student_fees sf on sf.student_id = s.id
    left join fee_plans fp on fp.id = sf.fee_plan_id
    left join receipt_types rt on rt.id = fp.receipt_type_id
    where ${where.join(' and ')}
    order by gl.name asc nulls last, r.room_number asc nulls last, s.sequence_no asc nulls last, s.student_id asc, sf.created_at asc`,
    params
  );

  const grouped = new Map<
    string,
    {
      student_id: string;
      student_code: string;
      first_name: string;
      last_name: string;
      room_number: string | null;
      grade_name: string | null;
      fees: Array<Record<string, unknown> & {
        fee_id: string;
        fee_name: string;
        category: ArrearsCategory;
        balance: number;
      }>;
      tuitionBalance: number;
      specialBalance: number;
      otherBalance: number;
      totalBalance: number;
    }
  >();

  for (const row of result.rows as Array<Record<string, any>>) {
    if (!row.fee_id) continue;
    const paid = Number(row.paid_amount || 0);
    const total = Number(row.total_amount || 0);
    const balance = Math.max(total - paid, 0);
    if (balance <= 0) continue;

    const category = categorizeFeeName(row.fee_name || row.receipt_type_name || '');
    const key = row.student_id;
    if (!grouped.has(key)) {
      grouped.set(key, {
        student_id: row.student_id,
        student_code: row.student_code,
        first_name: row.first_name,
        last_name: row.last_name,
        room_number: row.room_number || null,
        grade_name: row.grade_name || null,
        fees: [],
        tuitionBalance: 0,
        specialBalance: 0,
        otherBalance: 0,
        totalBalance: 0,
      });
    }

    const student = grouped.get(key)!;
    student.fees.push({
      fee_id: row.fee_id,
      fee_name: row.fee_name || '-',
      fee_description: row.fee_description || null,
      receipt_type_name: row.receipt_type_name || null,
      due_date: row.due_date || null,
      billing_month: row.billing_month || null,
      billing_year: row.billing_year || null,
      total_amount: total,
      paid_amount: paid,
      balance,
      category,
    });
    student.totalBalance += balance;
    if (category === 'tuition') student.tuitionBalance += balance;
    else if (category === 'special') student.specialBalance += balance;
    else student.otherBalance += balance;
  }

  const rows = Array.from(grouped.values()).sort((a, b) => {
    const gradeA = String(a.grade_name || '');
    const gradeB = String(b.grade_name || '');
    const roomA = String(a.room_number || '');
    const roomB = String(b.room_number || '');
    if (gradeA !== gradeB) return gradeA.localeCompare(gradeB, 'th');
    if (roomA !== roomB) return roomA.localeCompare(roomB, 'th', { numeric: true });
    return `${a.student_code}`.localeCompare(`${b.student_code}`, 'th');
  });

  const summary = rows.reduce(
    (acc, row) => {
      acc.totalStudents += 1;
      acc.totalBalance += row.totalBalance;
      acc.tuitionBalance += row.tuitionBalance;
      acc.specialBalance += row.specialBalance;
      acc.otherBalance += row.otherBalance;
      return acc;
    },
    {
      totalStudents: 0,
      totalBalance: 0,
      tuitionBalance: 0,
      specialBalance: 0,
      otherBalance: 0,
    }
  );

  return {
    summary,
    rows,
    grouped: {
      tuition: rows.filter((row) => row.tuitionBalance > 0),
      special: rows.filter((row) => row.specialBalance > 0),
      other: rows.filter((row) => row.otherBalance > 0),
    },
  };
}

export async function assignFeeToStudent(studentId: string, feePlanId: string) {
  const pool = getPostgresPool();
  const result = await pool.query(
    `insert into student_fee_assignments (student_id, fee_plan_id, active)
     values ($1, $2, true)
     on conflict (student_id, fee_plan_id) do update set active = true
     returning *`,
    [studentId, feePlanId]
  );

  return result.rows[0];
}

export async function unassignFeeFromStudent(studentId: string, feePlanId: string) {
  const pool = getPostgresPool();
  await pool.query(
    'update student_fee_assignments set active = false where student_id = $1 and fee_plan_id = $2',
    [studentId, feePlanId]
  );
  return { success: true };
}
