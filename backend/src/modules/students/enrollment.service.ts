import { getPostgresPool } from '../../config/database';

export interface EnrollmentFilters {
  academicYearId: string;
  gradeId?: string;
  roomId?: string;
  search?: string;
  status?: string;
}

export async function getEnrollments(filters: EnrollmentFilters) {
  const { academicYearId, gradeId, roomId, search, status } = filters;
  const pool = getPostgresPool();

  const clauses = ['se.academic_year_id = $1'];
  const params: unknown[] = [academicYearId];

  if (gradeId) {
    params.push(gradeId);
    clauses.push(`r.grade_id = $${params.length}`);
  }
  if (roomId) {
    params.push(roomId);
    clauses.push(`se.room_id = $${params.length}`);
  }
  if (status) {
    params.push(status);
    clauses.push(`se.status = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    clauses.push(`(s.first_name ilike $${params.length} or s.last_name ilike $${params.length} or s.student_id ilike $${params.length})`);
  }

  const result = await pool.query(
    `select
      se.*,
      json_build_object(
        'id', s.id,
        'student_id', s.student_id,
        'first_name', s.first_name,
        'last_name', s.last_name,
        'gender', s.gender,
        'national_id', s.national_id
      ) as student,
      json_build_object(
        'id', r.id,
        'room_number', r.room_number,
        'grade', json_build_object('id', gl.id, 'name', gl.name)
      ) as room
    from student_enrollments se
    join students s on s.id = se.student_id
    left join rooms r on r.id = se.room_id
    left join grade_levels gl on gl.id = r.grade_id
    where ${clauses.join(' and ')}
    order by s.sequence_no asc nulls last, s.student_id asc`,
    params
  );

  return result.rows;
}

export async function upsertEnrollment(input: {
  student_id: string;
  academic_year_id: string;
  room_id: string;
  status: string;
}) {
  const pool = getPostgresPool();
  const result = await pool.query(
    `insert into student_enrollments (student_id, academic_year_id, room_id, status)
     values ($1, $2, $3, $4)
     on conflict (student_id, academic_year_id) do update set
       room_id = excluded.room_id,
       status = excluded.status
     returning *`,
    [input.student_id, input.academic_year_id, input.room_id, input.status]
  );

  return result.rows[0];
}

export async function getEligibleStudents(academicYearId: string) {
  const pool = getPostgresPool();
  const result = await pool.query(
    `select s.id, s.student_id, s.first_name, s.last_name
     from students s
     where coalesce(s.status, '') <> 'graduated'
       and not exists (
         select 1
         from student_enrollments se
         where se.student_id = s.id
           and se.academic_year_id = $1
       )
     order by s.sequence_no asc nulls last, s.student_id asc`,
    [academicYearId]
  );

  return result.rows;
}

export async function promoteStudents(sourceYearId: string, targetYearId: string) {
  const pool = getPostgresPool();
  const result = await pool.query(
    'select * from promote_students($1, $2)',
    [sourceYearId, targetYearId]
  );

  return result.rows[0]?.promoted_count ?? 0;
}
