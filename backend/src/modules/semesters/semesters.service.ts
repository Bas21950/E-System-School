import { getPostgresPool } from '../../config/database';
import { deleteRowById, insertRow, updateRowById } from '../../repositories/postgresCrud';
import { Semester, CreateSemesterInput, UpdateSemesterInput } from './semesters.types';

export async function getSemesters() {
  const pool = getPostgresPool();
  const result = await pool.query(
    `select
      s.*,
      json_build_object('id', ay.id, 'year', ay.year) as academic_year_info
    from semesters s
    left join academic_years ay on ay.id = s.academic_year_id
    order by s.created_at desc`
  );

  return result.rows as any[];
}

export async function getSemesterById(id: string) {
  const pool = getPostgresPool();
  const result = await pool.query(
    `select
      s.*,
      json_build_object('id', ay.id, 'year', ay.year) as academic_year_info
    from semesters s
    left join academic_years ay on ay.id = s.academic_year_id
    where s.id = $1
    limit 1`,
    [id]
  );

  if (!result.rows[0]) {
    throw new Error('semesters record not found');
  }

  return result.rows[0] as any;
}

export async function createSemester(input: CreateSemesterInput) {
  return insertRow<Semester>('semesters', input as Record<string, unknown>);
}

export async function updateSemester(id: string, input: UpdateSemesterInput) {
  return updateRowById<Semester>('semesters', id, input as Record<string, unknown>);
}

export async function deleteSemester(id: string) {
  await deleteRowById('semesters', id);
}
