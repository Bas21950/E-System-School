import { PoolClient } from 'pg';
import { getPostgresPool } from '../../config/database';

export type MonthlyBillingInput = {
  feePlanId: string;
  academicYearId?: string | null;
  semesterId?: string | null;
  billingMonth: number;
  billingYear: number;
};

type RosterMember = {
  student_id: string;
  student_code: string;
  first_name: string;
  last_name: string;
  grade_name: string | null;
  room_number: string | null;
  is_active: boolean;
  course_codes: string[];
  student_fee_id: string | null;
  student_fee_status: string | null;
  student_fee_amount: number | null;
  student_fee_discount: number | null;
};

const specialCourseLabels: Record<string, string> = {
  basic: 'พื้นฐาน',
  steam: 'STEAM',
};

function normalizeCourseCodes(courseCodes?: string[]) {
  const unique = [...new Set((courseCodes || []).map((code) => code.trim().toLowerCase()))];
  if (unique.length === 0) return ['basic'];
  if (unique.some((code) => !specialCourseLabels[code])) {
    throw new Error('รายวิชาเรียนพิเศษไม่ถูกต้อง');
  }
  return unique;
}

function courseCount(member: Pick<RosterMember, 'course_codes'>) {
  return Math.max(member.course_codes?.length || 0, 1);
}

function courseLabel(member: Pick<RosterMember, 'course_codes'>) {
  return (member.course_codes?.length ? member.course_codes : ['basic'])
    .map((code) => specialCourseLabels[code] || code)
    .join(', ');
}

function assertMonthlyPeriod(input: MonthlyBillingInput) {
  if (!Number.isInteger(input.billingMonth) || input.billingMonth < 1 || input.billingMonth > 12) {
    throw new Error('กรุณาเลือกเดือนที่เรียกเก็บให้ถูกต้อง');
  }
  if (!Number.isInteger(input.billingYear) || input.billingYear < 2400 || input.billingYear > 3000) {
    throw new Error('กรุณาเลือกปีที่เรียกเก็บให้ถูกต้อง');
  }
}

export function monthlyPeriodKey(feePlanId: string, billingYear: number, billingMonth: number) {
  return `monthly:${feePlanId}:${billingYear}-${String(billingMonth).padStart(2, '0')}`;
}

async function getCurrentAcademicYearId() {
  const pool = getPostgresPool();
  const result = await pool.query(
    'select id from academic_years where is_current = true order by created_at desc limit 1'
  );
  return result.rows[0]?.id as string | undefined;
}

async function assertFeePlan(feePlanId: string) {
  const pool = getPostgresPool();
  const result = await pool.query(
    `select id, name, amount, billing_cycle
     from fee_plans
     where id = $1
     limit 1`,
    [feePlanId]
  );
  const plan = result.rows[0];
  if (!plan) throw new Error('ไม่พบรายการค่าใช้จ่าย');
  return plan as { id: string; name: string; amount: number; billing_cycle: string | null };
}

async function getRosterId(input: MonthlyBillingInput) {
  const pool = getPostgresPool();
  const periodKey = monthlyPeriodKey(input.feePlanId, input.billingYear, input.billingMonth);
  const result = await pool.query('select id from billing_rosters where period_key = $1 limit 1', [periodKey]);
  return result.rows[0]?.id as string | undefined;
}

async function getRosterMembers(rosterId: string, periodKey: string): Promise<RosterMember[]> {
  const pool = getPostgresPool();
  const result = await pool.query(
    `select
       brm.student_id,
       s.student_id as student_code,
       s.first_name,
       s.last_name,
       gl.name as grade_name,
       r.room_number,
       brm.is_active,
       brm.course_codes,
       sf.id as student_fee_id,
       sf.status as student_fee_status,
       sf.total_amount as student_fee_amount,
       sf.discount_amount as student_fee_discount
     from billing_roster_members brm
     join students s on s.id = brm.student_id
     left join lateral (
       select se.room_id
       from student_enrollments se
       where se.student_id = s.id
       order by se.created_at desc
       limit 1
     ) enrollment on true
     left join rooms r on r.id = enrollment.room_id
     left join grade_levels gl on gl.id = r.grade_id
     left join student_fees sf on sf.student_id = brm.student_id
       and sf.billing_period_key = $2
     where brm.billing_roster_id = $1
     order by brm.is_active desc, gl.name, r.room_number, s.student_id`,
    [rosterId, periodKey]
  );
  return result.rows as RosterMember[];
}

export async function prepareMonthlyRoster(input: MonthlyBillingInput) {
  assertMonthlyPeriod(input);
  const plan = await assertFeePlan(input.feePlanId);
  const academicYearId = input.academicYearId || (await getCurrentAcademicYearId()) || null;
  const periodKey = monthlyPeriodKey(input.feePlanId, input.billingYear, input.billingMonth);
  const pool = getPostgresPool();

  const insertedRoster = await pool.query(
    `insert into billing_rosters (
       fee_plan_id, academic_year_id, semester_id, billing_month, billing_year, period_key
     ) values ($1, $2, $3, $4, $5, $6)
     on conflict (period_key) do nothing
     returning id`,
    [input.feePlanId, academicYearId, input.semesterId || null, input.billingMonth, input.billingYear, periodKey]
  );

  const rosterId = insertedRoster.rows[0]?.id || (await getRosterId(input));
  if (!rosterId) throw new Error('ไม่สามารถเตรียมรายชื่อสำหรับรอบบิลได้');

  if (insertedRoster.rows[0]) {
    const previousRoster = await pool.query(
      `select id
       from billing_rosters
       where fee_plan_id = $1
         and (billing_year < $2 or (billing_year = $2 and billing_month < $3))
       order by billing_year desc, billing_month desc
       limit 1`,
      [input.feePlanId, input.billingYear, input.billingMonth]
    );

    if (previousRoster.rows[0]?.id) {
      await pool.query(
        `insert into billing_roster_members (billing_roster_id, student_id, is_active, course_codes)
         select $1, student_id, true, course_codes
         from billing_roster_members
         where billing_roster_id = $2 and is_active = true
         on conflict (billing_roster_id, student_id) do nothing`,
        [rosterId, previousRoster.rows[0].id]
      );
    } else {
      await pool.query(
        `insert into billing_roster_members (billing_roster_id, student_id, is_active, course_codes)
         select $1, sfa.student_id, true, ARRAY['basic']::text[]
         from student_fee_assignments sfa
         where sfa.fee_plan_id = $2
           and sfa.active = true
           and (
             $3::uuid is null or exists (
               select 1 from student_enrollments se
               where se.student_id = sfa.student_id
                 and se.academic_year_id = $3
                 and se.status = 'active'
             )
           )
         on conflict (billing_roster_id, student_id) do nothing`,
        [rosterId, input.feePlanId, academicYearId]
      );
    }
  }

  const members = await getRosterMembers(rosterId, periodKey);
  return {
    roster: {
      id: rosterId,
      fee_plan_id: input.feePlanId,
      fee_plan_name: plan.name,
      amount: Number(plan.amount),
      academic_year_id: academicYearId,
      semester_id: input.semesterId || null,
      billing_month: input.billingMonth,
      billing_year: input.billingYear,
      period_key: periodKey,
    },
    members,
  };
}

export async function setMonthlyRosterMember(
  input: MonthlyBillingInput & { studentId: string; isActive: boolean; courseCodes?: string[] }
) {
  const prepared = await prepareMonthlyRoster(input);
  const pool = getPostgresPool();
  const student = await pool.query('select id from students where id = $1 limit 1', [input.studentId]);
  if (!student.rows[0]) throw new Error('ไม่พบนักเรียน');

  const billed = await pool.query(
    `select id from student_fees
     where student_id = $1 and fee_plan_id = $2 and billing_period_key = $3
     limit 1`,
    [input.studentId, input.feePlanId, prepared.roster.period_key]
  );
  if (billed.rows[0]) {
    throw new Error('ไม่สามารถแก้ไขรายชื่อหรือรายวิชาหลังสร้างบิลแล้ว');
  }

  const courseCodes = input.isActive ? normalizeCourseCodes(input.courseCodes) : [];
  await pool.query(
    `insert into billing_roster_members (billing_roster_id, student_id, is_active, course_codes, changed_at)
     values ($1, $2, $3, $4, now())
     on conflict (billing_roster_id, student_id)
     do update set is_active = excluded.is_active, course_codes = excluded.course_codes, changed_at = now()`,
    [prepared.roster.id, input.studentId, input.isActive, courseCodes]
  );

  return prepareMonthlyRoster(input);
}

export async function previewMonthlyBilling(input: MonthlyBillingInput) {
  const prepared = await prepareMonthlyRoster(input);
  const activeMembers = prepared.members.filter((member) => member.is_active);
  const alreadyBilled = activeMembers.filter((member) => member.student_fee_id);
  const pending = activeMembers.filter((member) => !member.student_fee_id);

  return {
    ...prepared,
    summary: {
      students: activeMembers.length,
      pending_count: pending.length,
      existing_count: alreadyBilled.length,
      gross_amount: pending.reduce((sum, member) => sum + Number(prepared.roster.amount) * courseCount(member), 0),
    },
  };
}

async function calculateSnapshotDiscount(
  client: PoolClient,
  studentId: string,
  feePlanId: string,
  totalAmount: number,
  date: string
) {
  const result = await client.query(
    `select amount, type
     from discounts
     where student_id = $1
       and active is distinct from false
       and (fee_plan_id is null or fee_plan_id = $2)
       and (start_date is null or start_date <= $3::date)
       and (end_date is null or end_date >= $3::date)`,
    [studentId, feePlanId, date]
  );

  const discount = result.rows.reduce((sum, row) => {
    const value = row.type === 'percentage'
      ? (totalAmount * Number(row.amount || 0)) / 100
      : Number(row.amount || 0);
    return sum + Math.max(value, 0);
  }, 0);
  return Math.min(discount, totalAmount);
}

export async function postMonthlyBilling(
  input: MonthlyBillingInput & {
    dueDate?: string | null;
    operatorName?: string | null;
    idempotencyKey: string;
    studentIds?: string[];
  }
) {
  if (!input.idempotencyKey?.trim()) throw new Error('ต้องระบุรหัสป้องกันการส่งคำขอซ้ำ');
  const preview = await previewMonthlyBilling(input);
  const requestedIds = input.studentIds?.length
    ? new Set(input.studentIds)
    : new Set(preview.members.filter((member) => member.is_active).map((member) => member.student_id));
  const members = preview.members.filter((member) => member.is_active && requestedIds.has(member.student_id));
  if (members.length === 0) throw new Error('ไม่พบรายชื่อนักเรียนที่เลือกสำหรับสร้างบิล');

  const pool = getPostgresPool();
  const client = await pool.connect();
  try {
    await client.query('begin');
    const existingRun = await client.query(
      'select * from billing_runs where idempotency_key = $1 limit 1',
      [input.idempotencyKey]
    );
    if (existingRun.rows[0]) {
      await client.query('commit');
      return { ...existingRun.rows[0], idempotent_replay: true };
    }

    const planResult = await client.query(
      'select id, name, amount from fee_plans where id = $1 for share',
      [input.feePlanId]
    );
    const plan = planResult.rows[0];
    if (!plan) throw new Error('ไม่พบรายการค่าใช้จ่าย');

    const runResult = await client.query(
      `insert into billing_runs (
        fee_plan_id, billing_roster_id, academic_year_id, semester_id,
        billing_month, billing_year, billing_period_key, due_date,
        status, idempotency_key, operator_name, requested_count
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, 'draft', $9, $10, $11)
      on conflict (idempotency_key) do nothing
      returning *`,
      [
        input.feePlanId,
        preview.roster.id,
        preview.roster.academic_year_id,
        preview.roster.semester_id,
        input.billingMonth,
        input.billingYear,
        preview.roster.period_key,
        input.dueDate || null,
        input.idempotencyKey,
        input.operatorName?.trim() || null,
        members.length,
      ]
    );

    if (!runResult.rows[0]) {
      const replay = await client.query('select * from billing_runs where idempotency_key = $1 limit 1', [input.idempotencyKey]);
      await client.query('commit');
      return { ...replay.rows[0], idempotent_replay: true };
    }

    const run = runResult.rows[0];
    let createdCount = 0;
    let existingCount = 0;
    let totalAmount = 0;
    const snapshotDate = input.dueDate || new Date().toISOString().slice(0, 10);

    for (const member of members) {
      const feeLock = await client.query(
        `select id from student_fees
         where student_id = $1 and fee_plan_id = $2 and billing_period_key = $3
         for update`,
        [member.student_id, input.feePlanId, preview.roster.period_key]
      );
      if (feeLock.rows[0]) {
        existingCount += 1;
        continue;
      }

      const grossAmount = Number(plan.amount) * courseCount(member);
      const discountAmount = await calculateSnapshotDiscount(
        client,
        member.student_id,
        input.feePlanId,
        grossAmount,
        snapshotDate
      );
      const inserted = await client.query(
        `insert into student_fees (
          student_id, fee_plan_id, total_amount, paid_amount, discount_amount, discount_snapshot_locked,
          status, source, semester_id, academic_year_id, billing_month, billing_year,
          billing_period_key, billing_run_id, fee_name_snapshot, due_date
        ) values ($1, $2, $3, 0, $4, true, 'unpaid', 'system', $5, $6, $7, $8, $9, $10, $11, $12)
        on conflict (student_id, fee_plan_id, billing_period_key) do nothing
        returning id`,
        [
          member.student_id,
          input.feePlanId,
          grossAmount,
          discountAmount,
          preview.roster.semester_id,
          preview.roster.academic_year_id,
          input.billingMonth,
          input.billingYear,
          preview.roster.period_key,
          run.id,
          `${plan.name} (${courseLabel(member)})`,
          input.dueDate || null,
        ]
      );
      if (inserted.rows[0]) {
        createdCount += 1;
        totalAmount += grossAmount - discountAmount;
      } else {
        existingCount += 1;
      }
    }

    const finished = await client.query(
      `update billing_runs
       set status = 'posted', created_count = $1, existing_count = $2,
           total_amount = $3, posted_at = now()
       where id = $4
       returning *`,
      [createdCount, existingCount, totalAmount, run.id]
    );
    await client.query('commit');
    return { ...finished.rows[0], idempotent_replay: false };
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}
