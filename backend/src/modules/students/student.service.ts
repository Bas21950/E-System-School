import { getPostgresPool } from '../../config/database';
import { deleteRowById, updateRowById } from '../../repositories/postgresCrud';
import {
  Student,
  CreateStudentInput,
  StudentFilters,
  StudentStats,
  StudentProfileData,
  ImportValidationResult,
} from './student.types';

const THAI_MONTHS: Record<string, number> = {
  'มกราคม': 1,
  'กุมภาพันธ์': 2,
  'มีนาคม': 3,
  'เมษายน': 4,
  'พฤษภาคม': 5,
  'มิถุนายน': 6,
  'กรกฎาคม': 7,
  'สิงหาคม': 8,
  'กันยายน': 9,
  'ตุลาคม': 10,
  'พฤศจิกายน': 11,
  'ธันวาคม': 12,
};

function formatIsoDate(year: number, month: number, day: number) {
  if (!year || !month || !day) return null;
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseFlexibleDate(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatIsoDate(value.getFullYear(), value.getMonth() + 1, value.getDate());
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const epoch = Math.round((value - 25569) * 86400 * 1000);
    const date = new Date(epoch);
    if (!Number.isNaN(date.getTime())) {
      return formatIsoDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
    }
  }
  if (typeof value === 'string') {
    const text = value.trim();
    if (!text) return null;
    const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) return text;

    const thai = text.match(/^(\d{1,2})\s+([^\d\s]+)\s+(\d{4})$/);
    if (thai) {
      const day = Number(thai[1]);
      const month = THAI_MONTHS[thai[2]];
      const year = Number(thai[3]) - 543;
      return formatIsoDate(year, month, day);
    }

    const slash = text.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (slash) {
      const day = Number(slash[1]);
      const month = Number(slash[2]);
      const year = Number(slash[3]);
      const normalizedYear = year > 2400 ? year - 543 : year;
      return formatIsoDate(normalizedYear, month, day);
    }
  }
  return null;
}

const GRADE_ORDER = [
  'เธญ.1', 'เธญ.2', 'เธญ.3',
  'เธญเธเธธเธเธฒเธฅ 1', 'เธญเธเธธเธเธฒเธฅ 2', 'เธญเธเธธเธเธฒเธฅ 3',
  'เธ.1', 'เธ.2', 'เธ.3', 'เธ.4', 'เธ.5', 'เธ.6',
  'เธเธฃเธฐเธ–เธก 1', 'เธเธฃเธฐเธ–เธก 2', 'เธเธฃเธฐเธ–เธก 3', 'เธเธฃเธฐเธ–เธก 4', 'เธเธฃเธฐเธ–เธก 5', 'เธเธฃเธฐเธ–เธก 6',
  'เธก.1', 'เธก.2', 'เธก.3', 'เธก.4', 'เธก.5', 'เธก.6',
  'เธกเธฑเธเธขเธก 1', 'เธกเธฑเธเธขเธก 2', 'เธกเธฑเธเธขเธก 3', 'เธกเธฑเธเธขเธก 4', 'เธกเธฑเธเธขเธก 5', 'เธกเธฑเธเธขเธก 6',
];

function sortByGradeName<T extends { grade_name?: string; name?: string }>(rows: T[]): T[] {
  return rows.sort((a, b) => {
    const gradeNameA = a.grade_name || a.name || '';
    const gradeNameB = b.grade_name || b.name || '';
    let idxA = GRADE_ORDER.indexOf(gradeNameA);
    let idxB = GRADE_ORDER.indexOf(gradeNameB);
    if (idxA === -1) idxA = 999;
    if (idxB === -1) idxB = 999;
    if (idxA !== idxB) return idxA - idxB;
    return gradeNameA.localeCompare(gradeNameB, 'th');
  });
}

function normalizeLookupKey(value: string): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[๏ผใ€]/g, '.');
}

function extractGradeAlias(shortName: string): string[] {
  const cleaned = normalizeLookupKey(shortName);
  const aliases = new Set<string>([cleaned]);
  const match = cleaned.match(/^([ก-ฮa-z]+)\.?(\d+)$/i);
  if (match) {
    const [, prefix, level] = match;
    aliases.add(`${prefix}${level}`);
    aliases.add(`${prefix}.${level}`);
    if (prefix === 'ป' || prefix === 'p') aliases.add(`p${level}`);
    if (prefix === 'อ' || prefix === 'k') aliases.add(`k${level}`);
    if (prefix === 'ม' || prefix === 'm') aliases.add(`m${level}`);
  }
  return [...aliases];
}

function buildRoomResolver(rooms: any[], grades: any[]) {
  const gradesById = new Map<string, any>(grades.map((grade) => [grade.id, grade]));
  const directRoomCodeMap = new Map<string, string>();
  const roomAliasMap = new Map<string, string>();

  for (const room of rooms) {
    const roomId = room.id;
    const roomNumber = String(room.room_number || '').trim();
    const directRoomCode = normalizeLookupKey(room.room_code || '');
    if (directRoomCode) directRoomCodeMap.set(directRoomCode, roomId);

    const grade = gradesById.get(room.grade_id);
    if (!grade || !roomNumber) continue;

    const aliasSources = [
      ...extractGradeAlias(grade.short_name || ''),
      ...extractGradeAlias(grade.name || ''),
    ];

    for (const alias of aliasSources) {
      for (const separator of ['-', '/', '']) {
        const key = normalizeLookupKey(`${alias}${separator}${roomNumber}`);
        if (key) roomAliasMap.set(key, roomId);
      }
    }
  }

  return (input: string): string | null => {
    const normalized = normalizeLookupKey(input);
    if (!normalized) return null;

    const direct = directRoomCodeMap.get(normalized);
    if (direct) return direct;

    const alias = roomAliasMap.get(normalized);
    if (alias) return alias;

    const compact = normalized.replace(/[^a-zก-ฮ0-9]/g, '');
    const compactAlias = roomAliasMap.get(compact);
    if (compactAlias) return compactAlias;

    const shorthand = normalized.match(/^([kKpPอม])\.?(\d+)[-/]?(\d+)$/);
    if (shorthand) {
      const [, prefixRaw, gradeNo, roomNo] = shorthand;
      const prefix = prefixRaw.toLowerCase();
      const mappedPrefix =
        prefix === 'p' || prefix === 'ป'
          ? 'p'
          : prefix === 'k' || prefix === 'อ'
            ? 'k'
            : prefix === 'm'
              ? 'm'
              : prefix;
      const candidates = [
        `${mappedPrefix}${gradeNo}-${roomNo}`,
        `${mappedPrefix}.${gradeNo}-${roomNo}`,
        `${mappedPrefix}${gradeNo}/${roomNo}`,
        `${mappedPrefix}.${gradeNo}/${roomNo}`,
      ];
      for (const candidate of candidates) {
        const found = roomAliasMap.get(normalizeLookupKey(candidate));
        if (found) return found;
      }
    }

    return null;
  };
}

function parseRoomCodeSpec(roomCode: string) {
  const normalized = normalizeLookupKey(roomCode);
  if (!normalized) return null;

  const match = normalized.match(/^([kpอมป])\.?(\d+)[-/](\d+)$/i);
  if (!match) return null;

  const prefix = match[1].toLowerCase();
  const gradeNumber = match[2];
  const roomNumber = match[3];

  if (prefix === 'p' || prefix === 'ป') {
    return {
      educationLevelName: 'ประถมศึกษา',
      educationLevelShortName: 'ป',
      gradeLevelName: `ประถมศึกษาปีที่ ${gradeNumber}`,
      gradeLevelShortName: `ป.${gradeNumber}`,
      roomNumber,
      roomCode: `P${gradeNumber}-${roomNumber}`,
    };
  }

  if (prefix === 'k' || prefix === 'อ') {
    return {
      educationLevelName: 'อนุบาล',
      educationLevelShortName: 'อ',
      gradeLevelName: `อนุบาล ${gradeNumber}`,
      gradeLevelShortName: `อ.${gradeNumber}`,
      roomNumber,
      roomCode: `K${gradeNumber}-${roomNumber}`,
    };
  }

  if (prefix === 'm' || prefix === 'ม') {
    return {
      educationLevelName: 'มัธยมศึกษา',
      educationLevelShortName: 'ม',
      gradeLevelName: `มัธยมศึกษาปีที่ ${gradeNumber}`,
      gradeLevelShortName: `ม.${gradeNumber}`,
      roomNumber,
      roomCode: `M${gradeNumber}-${roomNumber}`,
    };
  }

  return null;
}

async function getCurrentAcademicYearId(): Promise<string> {
  const pool = getPostgresPool();
  const result = await pool.query(
    'select id from academic_years where is_current = true order by created_at desc limit 1'
  );
  return result.rows[0]?.id || '';
}

const STUDENT_PROFILE_FIELDS: (keyof StudentProfileData)[] = [
  'nationality', 'ethnicity', 'religion', 'blood_type', 'student_age', 'height_cm', 'weight_kg', 'disability_type',
  'house_registration_no', 'house_no', 'moo', 'alley', 'road', 'subdistrict', 'district', 'province',
  'postal_code', 'telephone', 'fax', 'email', 'enrollment_status_label', 'special_abilities',
  'opportunity_status', 'chronic_disease', 'drug_allergy', 'food_allergy', 'favorite_foods', 'admission_date',
  'previous_grade', 'previous_student_id', 'previous_school_affiliation', 'previous_school_province',
  'previous_school_name', 'previous_total_credits', 'previous_gpa', 'qualification_status',
  'qualification_response_date', 'previous_graduation_date', 'parents_marital_status', 'siblings_count',
  'siblings_studying_count', 'father_national_id', 'father_name', 'father_nationality', 'father_status',
  'father_disability_type', 'father_occupation', 'father_monthly_income', 'mother_national_id', 'mother_name',
  'mother_nationality', 'mother_status', 'mother_disability_type', 'mother_occupation', 'mother_monthly_income',
  'guardian_national_id', 'guardian_name', 'guardian_relationship', 'guardian_age', 'guardian_status',
  'guardian_occupation', 'guardian_monthly_income', 'student_name_en', 'parent_name_en', 'home_address_en',
];

function normalizeStudentProfileData(input: StudentProfileData): StudentProfileData {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('ข้อมูลประวัตินักเรียนไม่ถูกต้อง');
  }

  const normalized: StudentProfileData = {};
  for (const field of STUDENT_PROFILE_FIELDS) {
    const value = input[field];
    if (value === undefined || value === null) continue;
    if (typeof value !== 'string') throw new Error(`ข้อมูล ${field} ต้องเป็นข้อความ`);
    normalized[field] = value.trim().slice(0, 500);
  }
  return normalized;
}

function normalizeStudentPayload(input: Partial<CreateStudentInput>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (input.sequence_no !== undefined) payload.sequence_no = input.sequence_no;
  if (input.student_id !== undefined) payload.student_id = input.student_id;
  if (input.national_id !== undefined) payload.national_id = input.national_id || null;
  if (input.prefix !== undefined) payload.prefix = input.prefix || null;
  if (input.first_name !== undefined) payload.first_name = input.first_name;
  if (input.last_name !== undefined) payload.last_name = input.last_name;
  if (input.gender !== undefined) payload.gender = input.gender || null;
  if (input.birthday !== undefined) payload.birthday = input.birthday || null;
  if (input.parent_name !== undefined) payload.parent_name = input.parent_name || null;
  if (input.parent_phone !== undefined) payload.parent_phone = input.parent_phone || null;
  if (input.address !== undefined) payload.address = input.address || null;
  if (input.profile_data !== undefined) payload.profile_data = normalizeStudentProfileData(input.profile_data);
  if (input.room_id !== undefined) payload.room_id = input.room_id || null;
  if (input.academic_year_id !== undefined) payload.academic_year_id = input.academic_year_id || null;
  if (input.status !== undefined) payload.status = input.status;
  return payload;
}

export async function getStudents(filters: StudentFilters) {
  const { search, grade, room, academicYearId, status, page = 1, limit = 10 } = filters;
  const from = (page - 1) * limit;
  const pool = getPostgresPool();
  const targetYearId = academicYearId || (await getCurrentAcademicYearId());
  if (!targetYearId) return { data: [] as Student[], total: 0 };

  const clauses = ['se.academic_year_id = $1'];
  const params: unknown[] = [targetYearId];
  if (search) {
    params.push(`%${search}%`);
    clauses.push(`(s.first_name ilike $${params.length} or s.last_name ilike $${params.length} or s.student_id ilike $${params.length})`);
  }
  if (grade) {
    params.push(grade);
    clauses.push(`r.grade_id = $${params.length}`);
  }
  if (room) {
    if (room.startsWith('num:')) {
      params.push(room.replace('num:', ''));
      clauses.push(`r.room_number = $${params.length}`);
    } else {
      params.push(room);
      clauses.push(`se.room_id = $${params.length}`);
    }
  }
  if (status) {
    params.push(status);
    clauses.push(`s.status = $${params.length}`);
  }

  const whereClause = clauses.join(' and ');
  const countResult = await pool.query(
    `select count(*)::int as total
     from students s
     join student_enrollments se on se.student_id = s.id
     left join rooms r on r.id = se.room_id
     where ${whereClause}`,
    params
  );

  params.push(limit, from);
  const rowsResult = await pool.query(
    `select
      s.*,
      json_build_object('id', ay.id, 'year', ay.year) as academic_year_info,
      json_build_object(
        'id', r.id,
        'room_number', r.room_number,
        'grade_id', r.grade_id,
        'grade_info', json_build_object('id', gl.id, 'name', gl.name)
      ) as room_info
    from students s
    join student_enrollments se on se.student_id = s.id
    left join academic_years ay on ay.id = se.academic_year_id
    left join rooms r on r.id = se.room_id
    left join grade_levels gl on gl.id = r.grade_id
    where ${whereClause}
    order by s.sequence_no asc nulls last, s.student_id asc
    limit $${params.length - 1} offset $${params.length}`,
    params
  );

  return { data: rowsResult.rows as unknown as Student[], total: countResult.rows[0]?.total || 0 };
}

export async function getStudentById(id: string) {
  const pool = getPostgresPool();
  const studentResult = await pool.query('select * from students where id = $1 limit 1', [id]);
  const student = studentResult.rows[0];
  if (!student) throw new Error('Student not found');

  const enrollmentsResult = await pool.query(
    `select
      se.id,
      se.academic_year_id,
      se.room_id,
      se.status,
      json_build_object('year', ay.year) as academic_year_info,
      json_build_object(
        'room_number', r.room_number,
        'grade_info', json_build_object('name', gl.name)
      ) as room_info
    from student_enrollments se
    left join academic_years ay on ay.id = se.academic_year_id
    left join rooms r on r.id = se.room_id
    left join grade_levels gl on gl.id = r.grade_id
    where se.student_id = $1
    order by ay.year desc nulls last, se.created_at desc`,
    [id]
  );

  return { ...student, enrollment_history: enrollmentsResult.rows } as Student;
}

export async function createStudent(input: CreateStudentInput) {
  const pool = getPostgresPool();

  const existingResult = await pool.query(
    'select id from students where student_id = $1 limit 1',
    [input.student_id]
  );
  let studentId = existingResult.rows[0]?.id as string | undefined;

  if (studentId) {
    throw new Error('duplicate student_id');
  }

  const payload = normalizeStudentPayload({ ...input, status: 'active' });
  const columns = Object.keys(payload);
  const values = Object.values(payload);
  const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
  const result = await pool.query(
    `insert into students (${columns.map((column) => `"${column}"`).join(', ')})
     values (${placeholders})
     returning id`,
    values
  );
  studentId = result.rows[0]?.id;

  if (input.academic_year_id && input.room_id) {
    await pool.query(
      `insert into student_enrollments (student_id, academic_year_id, room_id, status)
       values ($1, $2, $3, $4)
       on conflict (student_id, academic_year_id) do update set
         room_id = excluded.room_id,
         status = excluded.status`,
      [studentId, input.academic_year_id, input.room_id, 'active']
    );
  }

  return getStudentById(studentId!);
}

export async function updateStudent(id: string, input: Partial<CreateStudentInput>) {
  const payload = normalizeStudentPayload(input);
  return updateRowById<Student>('students', id, payload);
}

export async function deleteStudent(id: string) {
  await deleteRowById('students', id);
}

export async function getStudentStats(): Promise<StudentStats> {
  const currentYearId = await getCurrentAcademicYearId();
  if (!currentYearId) return { total: 0, male: 0, female: 0, byStatus: [], byGrade: [], byRoom: [] };

  const pool = getPostgresPool();
  const result = await pool.query(
    `select
      se.status,
      s.gender,
      r.room_number,
      gl.name as grade_name
    from student_enrollments se
    join students s on s.id = se.student_id
    left join rooms r on r.id = se.room_id
    left join grade_levels gl on gl.id = r.grade_id
    where se.academic_year_id = $1`,
    [currentYearId]
  );

  const enrollments = result.rows;
  const stats: StudentStats = { total: enrollments.length, male: 0, female: 0, byStatus: [], byGrade: [], byRoom: [] };
  const statusMap: Record<string, number> = {};
  const gradeMap: Record<string, number> = {};
  const roomMap: Record<string, number> = {};

  enrollments.forEach((row: any) => {
    const gender = row.gender;
    const gradeName = row.grade_name ?? 'ไม่ระบุ';
    const roomNumber = row.room_number ?? '?';
    if (gender === 'ชาย') stats.male += 1;
    if (gender === 'หญิง') stats.female += 1;
    const status = row.status === 'active' ? 'กำลังศึกษาอยู่' : row.status;
    statusMap[status] = (statusMap[status] || 0) + 1;
    gradeMap[gradeName] = (gradeMap[gradeName] || 0) + 1;
    const roomKey = `${gradeName}|${roomNumber}`;
    roomMap[roomKey] = (roomMap[roomKey] || 0) + 1;
  });

  stats.byStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count }));
  stats.byGrade = sortByGradeName(Object.entries(gradeMap).map(([grade_name, count]) => ({ grade_name, count })));
  stats.byRoom = Object.entries(roomMap)
    .map(([key, count]) => {
      const [grade_name, room_number] = key.split('|');
      return { grade_name, room_number, count };
    })
    .sort((a, b) => {
      let idxA = GRADE_ORDER.indexOf(a.grade_name);
      let idxB = GRADE_ORDER.indexOf(b.grade_name);
      if (idxA === -1) idxA = 999;
      if (idxB === -1) idxB = 999;
      if (idxA !== idxB) return idxA - idxB;
      return a.room_number.localeCompare(b.room_number, undefined, { numeric: true });
    });

  return stats;
}

export async function getFilterOptions() {
  const pool = getPostgresPool();
  const [gradesRes, roomsRes, yearsRes, semestersRes] = await Promise.all([
    pool.query('select id, name from grade_levels'),
    pool.query('select id, room_number, grade_id from rooms'),
    pool.query('select id, year, is_current from academic_years order by year desc'),
    pool.query('select id, academic_year_id, semester from semesters'),
  ]);

  return {
    grades: sortByGradeName(gradesRes.rows as { id: string; name: string; grade_name: string }[]).map((g: { id: string; name: string }) => ({ id: g.id, name: g.name })),
    rooms: roomsRes.rows,
    academicYears: yearsRes.rows,
    semesters: semestersRes.rows,
  };
}

export async function validateImportData(rows: any[]): Promise<ImportValidationResult> {
  const valid: any[] = [];
  const errors: { row: number; message: string; data: any }[] = [];
  const pool = getPostgresPool();
  const existingRes = await pool.query('select student_id from students');
  const existingCodes = new Set((existingRes.rows || []).map((s: any) => s.student_id));
  const seenCodesInFile = new Set<string>();

  rows.forEach((row, index) => {
    const rowNum = index + 2;
    const rowErrors: string[] = [];
    const studentId = String(row.student_id || '').trim();
    if (!studentId) rowErrors.push('ต้องมีรหัสนักเรียน (student_id)');
    else if (seenCodesInFile.has(studentId)) rowErrors.push(`รหัสนักเรียน "${studentId}" ซ้ำในไฟล์นี้`);
    seenCodesInFile.add(studentId);

    const firstName = String(row.first_name || '').trim();
    const lastName = String(row.last_name || '').trim();
    if (!firstName) rowErrors.push('ต้องระบุชื่อ (first_name)');
    if (!lastName) rowErrors.push('ต้องระบุนามสกุล (last_name)');

    const studentData: any = { student_id: studentId, first_name: firstName, last_name: lastName };

    const roomCode = String(row.room_code || '').trim().toLowerCase();
    if (roomCode) {
      const parsedRoom = parseRoomCodeSpec(roomCode);
      if (!parsedRoom) rowErrors.push(`รูปแบบรหัสห้องเรียน "${row.room_code}" ไม่ถูกต้อง`);
      else studentData.room_code = parsedRoom.roomCode;
    } else {
      rowErrors.push('ต้องระบุรหัสห้องเรียน (room_code)');
    }

    const yearLabel = String(row.academic_year || '').trim();
    if (yearLabel) studentData.academic_year = yearLabel;
    else rowErrors.push('ต้องระบุปีการศึกษา (academic_year)');

    ['prefix', 'gender', 'birthday', 'parent_name', 'parent_phone', 'address'].forEach((field) => {
      if (row[field] !== undefined && row[field] !== null && String(row[field]).trim() !== '') {
        studentData[field] = String(row[field]).trim();
      }
    });

    const parsedBirthday = parseFlexibleDate(row.birthday);
    if (parsedBirthday) {
      studentData.birthday = parsedBirthday;
    }

    if (!studentData.gender && studentData.prefix) {
      const prefix = studentData.prefix;
      if (['ด.ช.', 'เด็กชาย', 'นาย'].includes(prefix)) studentData.gender = 'ชาย';
      if (['ด.ญ.', 'เด็กหญิง', 'นางสาว', 'นาง'].includes(prefix)) studentData.gender = 'หญิง';
    }

    if (rowErrors.length > 0) errors.push({ row: rowNum, message: rowErrors.join('; '), data: row });
    else valid.push({ ...studentData, existing: existingCodes.has(studentId) });
  });

  return { valid, errors };
}

async function ensureImportMasterData(rows: any[]) {
  const yearLabels = [...new Set(rows.map((row) => String(row.academic_year || '').trim()).filter(Boolean))];
  const roomSpecs = new Map<string, ReturnType<typeof parseRoomCodeSpec>>();

  for (const row of rows) {
    const spec = parseRoomCodeSpec(String(row.room_code || ''));
    if (spec) roomSpecs.set(spec.roomCode.toLowerCase(), spec);
  }

  const pool = getPostgresPool();
  const [yearsRes, eduRes, gradesRes, roomsRes] = await Promise.all([
    pool.query('select id, year, is_current from academic_years'),
    pool.query('select id, name, short_name from education_levels'),
    pool.query('select id, level_id, name, short_name from grade_levels'),
    pool.query('select id, room_number, room_code, grade_id from rooms'),
  ]);

  const yearMap = new Map<string, string>(yearsRes.rows.map((y: any) => [String(y.year).trim(), y.id]));
  const eduMap = new Map<string, string>(eduRes.rows.map((e: any) => [normalizeLookupKey(e.short_name || e.name), e.id]));
  const gradeMap = new Map<string, string>(gradesRes.rows.map((g: any) => [normalizeLookupKey(g.short_name || g.name), g.id]));
  const roomMap = new Map<string, string>(roomsRes.rows.map((r: any) => [normalizeLookupKey(r.room_code || ''), r.id]));

  const ensureAcademicYearId = async (yearLabel: string) => {
    const key = String(yearLabel).trim();
    if (!key) return '';
    const existing = yearMap.get(key);
    if (existing) return existing;
    const isCurrent = yearMap.size === 0;
    const inserted = await pool.query('insert into academic_years (year, is_current) values ($1, $2) returning id', [key, isCurrent]);
    const id = inserted.rows[0]?.id as string;
    if (id) yearMap.set(key, id);
    return id || '';
  };

  const ensureEducationLevelId = async (name: string, shortName: string) => {
    const key = normalizeLookupKey(shortName || name);
    const existing = eduMap.get(key);
    if (existing) return existing;
    const inserted = await pool.query('insert into education_levels (name, short_name) values ($1, $2) returning id', [name, shortName]);
    const id = inserted.rows[0]?.id as string;
    if (id) eduMap.set(key, id);
    return id || '';
  };

  const ensureGradeLevelId = async (educationLevelId: string, name: string, shortName: string) => {
    const key = normalizeLookupKey(shortName || name);
    const existing = gradeMap.get(key);
    if (existing) return existing;
    const inserted = await pool.query('insert into grade_levels (level_id, name, short_name) values ($1, $2, $3) returning id', [educationLevelId, name, shortName]);
    const id = inserted.rows[0]?.id as string;
    if (id) gradeMap.set(key, id);
    return id || '';
  };

  const ensureRoomId = async (gradeId: string, roomNumber: string, roomCode: string) => {
    const key = normalizeLookupKey(roomCode);
    const existing = roomMap.get(key);
    if (existing) return existing;
    const inserted = await pool.query('insert into rooms (grade_id, room_number, room_code) values ($1, $2, $3) returning id', [gradeId, roomNumber, roomCode]);
    const id = inserted.rows[0]?.id as string;
    if (id) roomMap.set(key, id);
    return id || '';
  };

  for (const yearLabel of yearLabels) await ensureAcademicYearId(yearLabel);
  for (const spec of roomSpecs.values()) {
    if (!spec) continue;
    const eduId = await ensureEducationLevelId(spec.educationLevelName, spec.educationLevelShortName);
    const gradeId = await ensureGradeLevelId(eduId, spec.gradeLevelName, spec.gradeLevelShortName);
    await ensureRoomId(gradeId, spec.roomNumber, spec.roomCode);
  }

  return { yearMap, roomMap };
}

export async function importStudents(students: any[]) {
  if (students.length === 0) return { inserted: 0, updated: 0, enrollmentsCreated: 0 };

  const { yearMap, roomMap } = await ensureImportMasterData(students);
  let inserted = 0;
  let updated = 0;

  for (const student of students) {
    const roomCode = normalizeLookupKey(String(student.room_code || ''));
    const yearLabel = String(student.academic_year || '').trim();
    const roomId = roomMap.get(roomCode);
    const academicYearId = yearMap.get(yearLabel);
    if (!roomId) throw new Error(`Could not resolve room for import row: ${student.room_code}`);
    if (!academicYearId) throw new Error(`Could not resolve academic year for import row: ${student.academic_year}`);

    student.room_id = roomId;
    student.academic_year_id = academicYearId;
    if (student.existing) updated += 1;
    else inserted += 1;
    await createStudent(student);
  }

  return { inserted, updated, enrollmentsCreated: students.length };
}
