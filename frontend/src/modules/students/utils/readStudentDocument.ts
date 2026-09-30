import type { CreateStudentInput, StudentProfileData } from '../types/student';

type TextItem = {
  str?: string;
  transform?: number[];
  width?: number;
};

type FieldKey =
  | keyof StudentProfileData
  | 'full_name'
  | 'national_id'
  | 'gender'
  | 'birthday'
  | 'student_id'
  | 'room_label'
  | 'telephone'
  | 'parent_phone'
  | 'status'
  | 'occupation'
  | 'monthly_income'
  | 'age';

const labels: { key: FieldKey; aliases: string[] }[] = [
  { key: 'full_name', aliases: ['ชื่อ-นามสกุล'] },
  { key: 'national_id', aliases: ['เลขประจำตัวประชาชน'] },
  { key: 'birthday', aliases: ['วัน/เดือน/ปีเกิด', 'วัน เดือน ปีเกิด'] },
  { key: 'gender', aliases: ['เพศ'] },
  { key: 'nationality', aliases: ['สัญชาติ'] },
  { key: 'ethnicity', aliases: ['เชื้อชาติ'] },
  { key: 'religion', aliases: ['ศาสนา'] },
  { key: 'blood_type', aliases: ['กรุ๊ปเลือด', 'หมู่เลือด'] },
  { key: 'disability_type', aliases: ['ประเภทความพิการ'] },
  { key: 'house_registration_no', aliases: ['รหัสประจำบ้าน'] },
  { key: 'house_no', aliases: ['บ้านเลขที่'] },
  { key: 'moo', aliases: ['หมู่ที่'] },
  { key: 'alley', aliases: ['ซอย'] },
  { key: 'road', aliases: ['ถนน'] },
  { key: 'subdistrict', aliases: ['ตำบล/แขวง'] },
  { key: 'district', aliases: ['อำเภอ/เขต'] },
  { key: 'province', aliases: ['จังหวัด'] },
  { key: 'postal_code', aliases: ['รหัสไปรษณีย์'] },
  { key: 'telephone', aliases: ['โทรศัพท์'] },
  { key: 'fax', aliases: ['โทรสาร'] },
  { key: 'email', aliases: ['อีเมล'] },
  { key: 'student_id', aliases: ['เลขประจำตัวนักเรียน'] },
  { key: 'room_label', aliases: ['ห้องเรียน'] },
  { key: 'enrollment_status_label', aliases: ['สถานะนักเรียน'] },
  { key: 'special_abilities', aliases: ['ความสามารถพิเศษ'] },
  { key: 'height_cm', aliases: ['ความสูง (ซม.)', 'ความสูง'] },
  { key: 'weight_kg', aliases: ['น้ำหนัก (กก.)', 'น้ำหนัก'] },
  { key: 'opportunity_status', aliases: ['ความด้อยโอกาส'] },
  { key: 'chronic_disease', aliases: ['โรคประจำตัว'] },
  { key: 'drug_allergy', aliases: ['การแพ้ยา'] },
  { key: 'food_allergy', aliases: ['การแพ้อาหาร'] },
  { key: 'favorite_foods', aliases: ['อาหารที่ชอบ'] },
  { key: 'admission_date', aliases: ['วันที่เข้าเรียน'] },
  { key: 'previous_grade', aliases: ['ชั้นเรียนเดิม'] },
  { key: 'previous_student_id', aliases: ['เลขประจำตัวนักเรียนเดิม'] },
  { key: 'previous_school_affiliation', aliases: ['สังกัดโรงเรียนเดิม'] },
  { key: 'previous_school_province', aliases: ['จังหวัดโรงเรียนเดิม'] },
  { key: 'previous_school_name', aliases: ['ชื่อโรงเรียนเดิม'] },
  { key: 'previous_total_credits', aliases: ['หน่วยกิตรวม'] },
  { key: 'previous_gpa', aliases: ['ผลการเรียนเฉลี่ย GPA', 'GPA'] },
  { key: 'qualification_status', aliases: ['สถานะการตรวจวุฒิ'] },
  { key: 'qualification_response_date', aliases: ['วันที่ตอบกลับ'] },
  { key: 'previous_graduation_date', aliases: ['วันที่จบการศึกษา'] },
  { key: 'parents_marital_status', aliases: ['สถานภาพการสมรสของผู้ปกครอง'] },
  { key: 'siblings_count', aliases: ['จำนวนพี่น้อง'] },
  { key: 'siblings_studying_count', aliases: ['จำนวนพี่น้องที่กำลังศึกษาอยู่'] },
  { key: 'status', aliases: ['สถานภาพ'] },
  { key: 'occupation', aliases: ['อาชีพ'] },
  { key: 'monthly_income', aliases: ['เงินเดือน'] },
  { key: 'age', aliases: ['อายุ'] },
  { key: 'father_name', aliases: ['ชื่อบิดา'] },
  { key: 'mother_name', aliases: ['ชื่อมารดา'] },
  { key: 'guardian_name', aliases: ['ชื่อผู้ปกครอง', 'ผู้ปกครอง'] },
  { key: 'guardian_relationship', aliases: ['ความสัมพันธ์'] },
  { key: 'guardian_age', aliases: ['อายุ'] },
  { key: 'student_name_en', aliases: ['ชื่อ-นามสกุลนักเรียน (Student Name)', 'Student Name'] },
  { key: 'parent_name_en', aliases: ['ชื่อผู้ปกครอง (Name of Parent)', 'Name of Parent'] },
  { key: 'home_address_en', aliases: ['ที่อยู่นักเรียน (Home Address)', 'Home Address'] },
];

function normalizePdfText(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/\uF702/g, 'ี')
    .replace(/\uF706/g, '้')
    .replace(/\uF70A/g, '่')
    .replace(/\uF70B/g, '้')
    .replace(/\uF70C/g, '๊')
    .replace(/\uF70E/g, '้')
    .replace(/[\u200B-\u200D\uFEFF]/g, '');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function aliasPattern(alias: string): string {
  return normalizePdfText(alias).split('').map((character) => {
    if (/\s/.test(character)) return '\\s*';
    if (character === '-') return '\\s*[-–—]\\s*';
    return escapeRegExp(character);
  }).join('');
}

function buildVisualLines(items: TextItem[]): string[] {
  const positioned = items
    .filter((item) => typeof item.str === 'string' && item.str.trim() && item.transform)
    .map((item) => ({
      text: normalizePdfText(item.str || ''),
      x: item.transform?.[4] || 0,
      y: item.transform?.[5] || 0,
      width: item.width || 0,
    }))
    .sort((a, b) => b.y - a.y || a.x - b.x);

  const rows: { y: number; parts: typeof positioned }[] = [];
  for (const item of positioned) {
    const row = rows.find((candidate) => Math.abs(candidate.y - item.y) <= 2.5);
    if (row) row.parts.push(item);
    else rows.push({ y: item.y, parts: [item] });
  }

  return rows
    .sort((a, b) => b.y - a.y)
    .map(({ parts }) => {
      const ordered = parts.sort((a, b) => a.x - b.x);
      let line = '';
      let previousRight = -Infinity;
      for (const part of ordered) {
        if (line && part.x - previousRight > 1.5 && !line.endsWith(' ')) line += ' ';
        line += part.text;
        previousRight = Math.max(previousRight, part.x + part.width);
      }
      return line;
    });
}

function collectFieldValues(lines: string[]): Map<FieldKey, string[]> {
  const aliasEntries = labels
    .flatMap(({ key, aliases }) => aliases.map((alias) => ({ key, alias, pattern: aliasPattern(alias) })))
    .sort((a, b) => b.alias.length - a.alias.length);
  const allPattern = aliasEntries.map((entry) => `(?<field${aliasEntries.indexOf(entry)}>${entry.pattern})`).join('|');
  const results = new Map<FieldKey, string[]>();

  for (const line of lines) {
    const matches: { key: FieldKey; start: number; end: number }[] = [];
    const expression = new RegExp(allPattern, 'giu');
    Array.from(line.matchAll(expression)).forEach((match) => {
      const groupIndex = match.findIndex((value, index) => index > 0 && value !== undefined);
      const entry = aliasEntries[groupIndex - 1];
      if (entry) matches.push({ key: entry.key, start: match.index || 0, end: (match.index || 0) + match[0].length });
    });

    for (let index = 0; index < matches.length; index += 1) {
      const current = matches[index];
      const nextStart = matches[index + 1]?.start ?? line.length;
      const value = line.slice(current.end, nextStart).replace(/^\s*[:：]?\s*/, '').trim();
      if (!value || /^[:：\-–—]+$/.test(value)) continue;
      const values = results.get(current.key) || [];
      values.push(value.replace(/[|¦]+/g, '').trim());
      results.set(current.key, values);
    }
  }
  return results;
}

function cleanValue(value: string | undefined): string {
  return (value || '').replace(/^\s*[:：\-–—]+\s*/, '').replace(/\s+/g, ' ').trim();
}

function normalizeThaiDate(value: string): string {
  const monthNames: Record<string, string> = {
    'มกราคม': '01', 'ม.ค.': '01', 'กุมภาพันธ์': '02', 'ก.พ.': '02', 'มีนาคม': '03', 'มี.ค.': '03',
    'เมษายน': '04', 'เม.ย.': '04', 'พฤษภาคม': '05', 'พ.ค.': '05', 'มิถุนายน': '06', 'มิ.ย.': '06',
    'กรกฎาคม': '07', 'ก.ค.': '07', 'สิงหาคม': '08', 'ส.ค.': '08', 'กันยายน': '09', 'ก.ย.': '09',
    'ตุลาคม': '10', 'ต.ค.': '10', 'พฤศจิกายน': '11', 'พ.ย.': '11', 'ธันวาคม': '12', 'ธ.ค.': '12',
  };
  const text = cleanValue(value).replace(/\s+/g, ' ');
  const match = text.match(/(\d{1,2})\s+([ก-๙.]+)\s+(\d{4})/);
  if (!match) return text;
  const month = monthNames[match[2]];
  const day = Number(match[1]);
  let year = Number(match[3]);
  if (!month || !day || day > 31) return text;
  if (year > 2400) year -= 543;
  if (year < 1900 || year > 2200) return text;
  return `${year}-${month}-${String(day).padStart(2, '0')}`;
}

function splitStudentName(value: string): Pick<CreateStudentInput, 'prefix' | 'first_name' | 'last_name'> {
  const name = cleanValue(value).replace(/\s+/g, ' ');
  const match = name.match(/^(ด\.?\s*ช\.?|ด\.?\s*ญ\.?|เด็กชาย|เด็กหญิง|นาย|นางสาว|นาง)\s*(.*)$/i);
  const prefixLabel = match?.[1]?.replace(/\s/g, '').replace(/\./g, '').toLowerCase();
  const prefix = prefixLabel === 'ดช' || prefixLabel === 'เด็กชาย' ? 'เด็กชาย'
    : prefixLabel === 'ดญ' || prefixLabel === 'เด็กหญิง' ? 'เด็กหญิง'
      : prefixLabel === 'นาย' ? 'นาย'
        : prefixLabel === 'นางสาว' ? 'นางสาว'
          : prefixLabel === 'นาง' ? 'นางสาว' : '';
  const parts = (match?.[2] || name).trim().split(/\s+/).filter(Boolean);
  return { prefix, first_name: parts.shift() || '', last_name: parts.join(' ') };
}

function normalizedNationalId(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.length === 13 ? digits : cleanValue(value);
}

function formatAddress(profile: StudentProfileData): string {
  return [
    profile.house_no && `บ้านเลขที่ ${profile.house_no}`,
    profile.moo && `หมู่ ${profile.moo}`,
    profile.alley && `ซอย ${profile.alley}`,
    profile.road && `ถนน ${profile.road}`,
    profile.subdistrict && `ตำบล${profile.subdistrict}`,
    profile.district && `อำเภอ${profile.district}`,
    profile.province,
    profile.postal_code,
  ].filter(Boolean).join(' ');
}

export async function readStudentDocument(file: File): Promise<{
  data: Partial<CreateStudentInput>;
  matchedFields: string[];
  pageCount: number;
  roomLabel: string;
}> {
  if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
    throw new Error('ขณะนี้รองรับไฟล์ PDF ที่มีข้อความเท่านั้น');
  }
  if (file.size > 20 * 1024 * 1024) throw new Error('ไฟล์ต้องมีขนาดไม่เกิน 20 MB');

  const pdfjs = await import('pdfjs-dist/webpack.mjs');
  const pdf = await pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    isEvalSupported: false,
    useSystemFonts: true,
  }).promise;

  if (pdf.numPages > 10) {
    await pdf.destroy();
    throw new Error('เอกสารนี้มีมากกว่า 10 หน้า กรุณาแยกไฟล์ให้เหลือเฉพาะเอกสารนักเรียนคนเดียว');
  }

  const lines: string[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    lines.push(...buildVisualLines(content.items as TextItem[]));
  }
  await pdf.destroy();

  if (lines.join('').replace(/\s/g, '').length < 20) {
    throw new Error('ไม่พบข้อความที่อ่านได้ใน PDF นี้ รองรับเอกสาร PDF ที่มีข้อความ ไม่ใช่ไฟล์สแกนรูปภาพ');
  }

  const extracted = collectFieldValues(lines);
  const value = (key: FieldKey, occurrence = 0) => cleanValue(extracted.get(key)?.[occurrence]);
  const profile: StudentProfileData = {
    nationality: value('nationality', 0),
    ethnicity: value('ethnicity'),
    religion: value('religion'),
    blood_type: value('blood_type'),
    student_age: value('age', 0),
    disability_type: value('disability_type', 0),
    house_registration_no: value('house_registration_no'),
    house_no: value('house_no'),
    moo: value('moo'),
    alley: value('alley'),
    road: value('road'),
    subdistrict: value('subdistrict'),
    district: value('district'),
    province: value('province', 0),
    postal_code: value('postal_code', 0),
    telephone: value('telephone', 0),
    fax: value('fax'),
    email: value('email'),
    enrollment_status_label: value('enrollment_status_label'),
    special_abilities: value('special_abilities'),
    height_cm: value('height_cm'),
    weight_kg: value('weight_kg'),
    opportunity_status: value('opportunity_status'),
    chronic_disease: value('chronic_disease'),
    drug_allergy: value('drug_allergy'),
    food_allergy: value('food_allergy'),
    favorite_foods: value('favorite_foods'),
    admission_date: normalizeThaiDate(value('admission_date')),
    previous_grade: value('previous_grade'),
    previous_student_id: value('previous_student_id'),
    previous_school_affiliation: value('previous_school_affiliation'),
    previous_school_province: value('previous_school_province'),
    previous_school_name: value('previous_school_name'),
    previous_total_credits: value('previous_total_credits'),
    previous_gpa: value('previous_gpa'),
    qualification_status: value('qualification_status'),
    qualification_response_date: normalizeThaiDate(value('qualification_response_date')),
    previous_graduation_date: normalizeThaiDate(value('previous_graduation_date')),
    parents_marital_status: value('parents_marital_status'),
    siblings_count: value('siblings_count'),
    siblings_studying_count: value('siblings_studying_count'),
    father_national_id: normalizedNationalId(value('national_id', 1)),
    father_name: value('father_name'),
    father_nationality: value('nationality', 1),
    father_status: value('status', 0),
    father_disability_type: value('disability_type', 1),
    father_occupation: value('occupation', 0),
    father_monthly_income: value('monthly_income', 0),
    mother_national_id: normalizedNationalId(value('national_id', 2)),
    mother_name: value('mother_name'),
    mother_nationality: value('nationality', 2),
    mother_status: value('status', 1),
    mother_disability_type: value('disability_type', 2),
    mother_occupation: value('occupation', 1),
    mother_monthly_income: value('monthly_income', 1),
    guardian_national_id: normalizedNationalId(value('national_id', 3)),
    guardian_name: value('guardian_name'),
    guardian_relationship: value('guardian_relationship'),
    guardian_age: value('age', 1),
    guardian_status: value('status', 2),
    guardian_occupation: value('occupation', 2),
    guardian_monthly_income: value('monthly_income', 2),
    student_name_en: value('student_name_en'),
    parent_name_en: value('parent_name_en'),
    home_address_en: value('home_address_en'),
  };

  const fullName = splitStudentName(value('full_name'));
  const data: Partial<CreateStudentInput> = {
    ...fullName,
    student_id: value('student_id').replace(/\s/g, ''),
    national_id: normalizedNationalId(value('national_id')),
    gender: value('gender') === 'หญิง' ? 'หญิง' : value('gender') === 'ชาย' ? 'ชาย' : undefined,
    birthday: normalizeThaiDate(value('birthday')),
    parent_name: profile.guardian_name || profile.mother_name || profile.father_name || '',
    parent_phone: value('telephone', 1) || value('telephone', 0),
    address: formatAddress(profile),
    profile_data: profile,
  };

  const matchedFields = Array.from(new Set(Object.entries(data).flatMap(([key, fieldValue]) => {
    if (key === 'profile_data' && fieldValue && typeof fieldValue === 'object') {
      return Object.entries(fieldValue).filter(([, value]) => typeof value === 'string' && value.trim()).map(([profileKey]) => profileKey);
    }
    return typeof fieldValue === 'string' && fieldValue.trim() ? [key] : [];
  })));

  if (matchedFields.length === 0) {
    throw new Error('อ่านข้อความได้ แต่ไม่พบช่องข้อมูลที่รู้จักในแบบฟอร์มนี้ กรุณากรอกข้อมูลด้วยตนเอง');
  }

  return { data, matchedFields, pageCount: pdf.numPages, roomLabel: value('room_label') };
}
