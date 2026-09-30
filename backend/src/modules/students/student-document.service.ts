import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { Student } from './student.types';
import { getBrandingDir, getBundledSchoolLogoPath } from '../../config/storage';

// Coordinates in PDF points, measured from the supplied A4 registration form.
// HTML preview and PDF export deliberately share this single vector layout.
const assetRoot = path.resolve(__dirname, '../../../assets');
const escape = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const data = (file: string, mime: string) => `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`;
const months = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const shortMonths = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

export function documentDate(value: unknown, short = false): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(String(value));
  if (!Number.isFinite(date.getTime())) return '';
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})(?:T|$)/);
  const [y, m, d] = match ? match.slice(1).map(Number) : [date.getFullYear(), date.getMonth() + 1, date.getDate()];
  const check = new Date(Date.UTC(y, m - 1, d));
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d) return '';
  return `${d} ${(short ? shortMonths : months)[m - 1]} ${y + 543}`;
}

export function renderStudentDocument(student: Student, settings: { school_name?: string | null; school_logo_url?: string | null } = {}): string {
  const p = student.profile_data || {};
  const parts: string[] = [];
  const text = (x: number, y: number, value: unknown, width?: number, bold = false, size = 13) => {
    parts.push(`<text x="${x}" y="${y}" font-size="${size}"${bold ? ' font-weight="700"' : ''}${width ? ` data-width="${width}"` : ''}>${escape(value)}</text>`);
  };
  const field = (y: number, label: string, x: number, colon: number, value: unknown, width: number) => {
    text(x, y, label); text(colon, y, ':'); text(colon + 7, y, value, width);
  };
  const heading = (y: number, label: string) => {
    text(20, y, label, undefined, true, 14);
    parts.push(`<path d="M20 ${y + 5.88}H575" stroke="black" stroke-width="0.5"/>`);
  };
  let logo = getBundledSchoolLogoPath();
  // Existing custom local branding wins; never read arbitrary URL/file input.
  if (settings.school_logo_url) {
    try {
      const url = new URL(settings.school_logo_url);
      const name = decodeURIComponent(url.pathname.replace('/api/files/branding/', ''));
      if (['localhost','127.0.0.1','[::1]'].includes(url.hostname) && url.pathname.startsWith('/api/files/branding/') && name === path.basename(name)) {
        const candidate = path.join(getBrandingDir(), name);
        if (fs.existsSync(candidate)) logo = candidate;
      }
    } catch { /* Use packaged school seal when branding is unavailable. */ }
  }
  const mime = /\.jpe?g$/i.test(logo) ? 'image/jpeg' : /\.webp$/i.test(logo) ? 'image/webp' : 'image/png';
  parts.push(`<image x="259" y="20" width="75" height="75" href="${data(logo, mime)}"/>`);
  parts.push(`<text x="297.5" y="115.9" font-size="18" font-weight="700" text-anchor="middle">${escape(settings.school_name || 'โรงเรียนสหวิทยานุสรณ์')}</text>`);
  parts.push('<rect x="498" y="124" width="77" height="100" fill="white" stroke="black" stroke-width="1"/><text x="536.5" y="165" text-anchor="middle" font-size="14" font-weight="700">รูปภาพ<tspan x="536.5" dy="16">ขนาด 2 นิ้ว</tspan></text>');
  field(138.79,'เลขประจำตัวประชาชน',20,113,student.national_id,123);
  field(138.79,'ชื่อ-นามสกุล',244,297,`${student.prefix || ''}${student.first_name}  ${student.last_name}`,185);
  field(158.79,'เพศ',20,77,student.gender,28);
  field(158.79,'วัน/เดือน/ปีเกิด',115,178,documentDate(student.birthday),84);
  field(158.79,'อายุ',275,297,p.student_age,78);
  field(158.79,'กรุ๊ปเลือด',389,427,p.blood_type,55);
  field(178.79,'สัญชาติ',20,77,p.nationality,54);
  field(178.79,'เชื้อชาติ',143,178,p.ethnicity,70);
  field(178.79,'ศาสนา',265,297,p.religion,180);
  field(198.79,'ความสูง (ซม.)',20,77,p.height_cm,28);
  field(198.79,'น้ำหนัก (กก.)',123,178,p.weight_kg,28);
  field(198.79,'ประเภทความพิการ',222,297,p.disability_type,180);
  heading(221.12,'ข้อมูลที่อยู่');
  const addressRows = [
    ['รหัสประจำบ้าน','house_registration_no','บ้านเลขที่','house_no','หมู่ที่','moo'],
    ['ซอย','alley','ถนน','road','ตำบล/แขวง','subdistrict'],
    ['อำเภอ','district','จังหวัด','province','รหัสไปรษณีย์','postal_code'],
    ['โทรศัพท์','telephone','โทรสาร','fax','อีเมล','email'],
  ];
  addressRows.forEach((row, i) => {
    field(240.79 + i * 20,row[0],20,82,p[row[1]] || (row[1] === 'telephone' ? student.parent_phone : ''),116);
    field(240.79 + i * 20,row[2],212,256,p[row[3]],102);
    field(240.79 + i * 20,row[4],372,428,p[row[5]],140);
  });
  heading(323.12,'ข้อมูลรายละเอียดนักเรียน');
  const enrollment = student.enrollment_history?.[0];
  const room = student.room_info || enrollment?.room_info;
  const grade = room?.grade_info;
  const className = grade ? ('short_name' in grade && grade.short_name || grade.name.replace('ประถมศึกษาปีที่ ', 'ป.').replace('มัธยมศึกษาปีที่ ', 'ม.').replace('อนุบาลปีที่ ', 'อ.')) : '';
  field(342.79,'เลขประจำตัวนักเรียน',20,104,student.student_id,60);
  field(342.79,'ห้องเรียน',179,215,room ? `${className}/${room.room_number}` : '',32);
  field(342.79,'สถานะนักเรียน',260,328,p.enrollment_status_label || ({ active:'กำลังศึกษา',inactive:'ไม่ใช้งาน',graduated:'จบการศึกษา',transferred:'ย้ายสถานศึกษา' } as Record<string,string>)[student.status] || '',108);
  field(342.79,'วันที่เข้าเรียน',450,503,documentDate(p.admission_date,true),65);
  [
    ['ความสามารถพิเศษ','special_abilities','ความด้อยโอกาส','opportunity_status'],
    ['โรคประจำตัว','chronic_disease','การแพ้ยา','drug_allergy'],
    ['การแพ้อาหาร','food_allergy','อาหารที่ชอบ','favorite_foods'],
  ].forEach((row,i) => {
    field(362.79+i*20,row[0],20,104,p[row[1]],145);
    field(362.79+i*20,row[2],260,328,p[row[3]],240);
  });
  heading(425.12,'ข้อมูลประวัติการศึกษา');
  field(444.79,'ชั้นเรียนเดิม',20,72,p.previous_grade,75);
  field(444.79,'เลขประจำตัวนักเรียนเดิม',158,251,p.previous_student_id,65);
  field(444.79,'วันที่จบการศึกษา',327,392,documentDate(p.graduation_date,true),176);
  field(464.79,'สังกัดโรงเรียนเดิม',20,87,p.previous_school_affiliation,38);
  field(464.79,'จังหวัดโรงเรียนเดิม',152,224,p.previous_school_province,94);
  field(464.79,'ชื่อโรงเรียนเดิม',334,392,p.previous_school_name,176);
  field(484.79,'หน่วยกิตรวม',20,72,p.previous_total_credits,58);
  field(484.79,'ผลการเรียนเฉลี่ย GPA',139,224,p.previous_gpa,70);
  field(484.79,'สถานะการตรวจวุฒิ',318,392,p.qualification_check_status,57);
  field(484.79,'วันที่ตอบกลับ',457,509,documentDate(p.qualification_response_date,true),59);
  heading(507.12,'ข้อมูลบิดา-มารดา');
  field(526.79,'สถานภาพการสมรสของผู้ปกครอง',20,142,p.parents_marital_status,83);
  field(526.79,'จำนวนพี่น้อง',235,284,p.siblings_count,32);
  field(526.79,'จำนวนพี่น้องที่กำลังศึกษาอยู่',330,434,p.siblings_studying_count,134);
  ['father','mother'].forEach((parent,i) => {
    const y=546.79+i*40;
    field(y,'เลขประจำตัวประชาชน',20,106,p[`${parent}_national_id`],89);
    field(y,i===0?'ชื่อบิดา':'ชื่อมารดา',206,246,p[`${parent}_name`],117);
    field(y,'สัญชาติ',373,405,p[`${parent}_nationality`],45);
    field(y,'สถานภาพ',464,506,p[`${parent}_status`],62);
    field(y+20,'ประเภทความพิการ',20,106,p[`${parent}_disability_type`],153);
    field(y+20,'อาชีพ',276,306,p[`${parent}_occupation`],145);
    field(y+20,'เงินเดือน',467,506,p[`${parent}_monthly_income`],62);
  });
  heading(629.12,'ข้อมูลผู้ปกครอง');
  field(648.79,'เลขประจำตัวประชาชน',20,106,p.guardian_national_id,89);
  field(648.79,'ชื่อผู้ปกครอง',194,246,p.guardian_name || student.parent_name,164);
  field(648.79,'ความสัมพันธ์',422,474,p.guardian_relationship,94);
  field(668.79,'โทรศัพท์',20,60,student.parent_phone,98);
  field(668.79,'อาชีพ',172,202,p.guardian_occupation,128);
  field(668.79,'เงินเดือน',338,374,p.guardian_monthly_income,194);
  field(688.79,'บ้านเลขที่',20,60,p.house_no,33);
  field(688.79,'หมู่ที่',109,134,p.moo,36);
  field(688.79,'ซอย',180,202,p.alley,143);
  field(688.79,'ถนน',354,374,p.road,194);
  field(708.79,'จังหวัด',20,60,p.province,80);
  field(708.79,'อำเภอ/เขต',155,202,p.district,109);
  field(708.79,'ตำบล/แขวง',327,374,p.subdistrict,92);
  field(708.79,'รหัสไปรษณีย์',479,530,p.postal_code,38);
  heading(731.12,'ข้อมูลนักเรียน (ภาษาอังกฤษ)');
  field(750.79,'ชื่อ - นามสกุลนักเรียน (Student Name)',20,167,p.student_name_en,135);
  field(750.79,'ชื่อผู้ปกครอง (Name of Parent)',311,432,p.parent_name_en,136);
  field(770.79,'ที่อยู่นักเรียน (Home Address)',20,134,p.home_address_en,434);
  return `<!doctype html><html lang="th"><head><meta charset="utf-8"><title>ประวัตินักเรียน</title><style>
  @font-face{font-family:THSarabunPSK;src:url('${data(path.join(assetRoot,'fonts/THSarabunPSK.ttf'),'font/ttf')}')}@font-face{font-family:THSarabunPSK;font-weight:700;src:url('${data(path.join(assetRoot,'fonts/THSarabunPSK-Bold.ttf'),'font/ttf')}')}
  *{box-sizing:border-box}html,body{margin:0;background:#e5e7eb}svg{display:block;width:210mm;height:297mm;margin:12px auto;background:white;font-family:THSarabunPSK;fill:#000}text{white-space:pre} @page{size:A4 portrait;margin:0}@media print{html,body{background:white}svg{margin:0;width:210mm;height:297mm}}
  </style></head><body><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 595 842" role="img" aria-label="เอกสารประวัตินักเรียน">${parts.join('')}</svg><script>
  window.documentReady=document.fonts.ready.then(()=>{document.querySelectorAll('text[data-width]').forEach(t=>{const w=Number(t.dataset.width);if(t.getComputedTextLength()>w){t.setAttribute('textLength',String(w));t.setAttribute('lengthAdjust','spacingAndGlyphs')}})});
  </script></body></html>`;
}

export async function studentDocumentPdf(html: string): Promise<Buffer> {
  const candidates = [process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,process.env.CHROME_EXECUTABLE_PATH,process.env.EDGE_EXECUTABLE_PATH,'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Google/Chrome/Application/chrome.exe'];
  const browser = await chromium.launch({ headless: true, executablePath: candidates.find(p => p && fs.existsSync(p)), args: ['--disable-gpu'] });
  try {
    const page = await browser.newPage();
    await page.setContent(html,{waitUntil:'load'});
    await page.evaluate('window.documentReady');
    return await page.pdf({format:'A4',preferCSSPageSize:true,printBackground:true,margin:{top:0,right:0,bottom:0,left:0}});
  } finally { await browser.close(); }
}
