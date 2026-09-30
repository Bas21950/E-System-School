// Run after npm run build: node --test tests/student-document.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const { PDFDocument } = require('pdf-lib');
const { renderStudentDocument, studentDocumentPdf, documentDate } = require('../dist/modules/students/student-document.service');

const student = {
  id: 'test', student_id: 'TEST-001', prefix: 'ด.ช.', first_name: 'ทดสอบ', last_name: 'เอกสาร',
  birthday: '2019-07-19T00:00:00.000Z', gender: 'ชาย', status: 'active',
  parent_name: 'ผู้ปกครองทดสอบ', profile_data: { nationality: 'ไทย', religion: 'พุทธ' },
};

test('Calendar dates and ISO timestamps never produce NaN or invalid dates', () => {
  assert.equal(documentDate(student.birthday), '19 กรกฎาคม 2562');
  assert.equal(documentDate('2024-02-29'), '29 กุมภาพันธ์ 2567');
  for (const value of [null, undefined, '', 'invalid', '2026-02-30', '2025-02-29', '2026-13-01']) assert.equal(documentDate(value), '');
});

test('HTML embeds the exact font family and logo, escapes user data and preserves all source sections', () => {
  const html = renderStudentDocument({ ...student, first_name: '<script>unsafe()</script>', profile_data: { home_address_en: '<img onerror="unsafe()">' } });
  assert(html.includes('&lt;script&gt;unsafe()&lt;/script&gt;'));
  assert(!html.includes('<script>unsafe()</script>'));
  assert(html.includes('&lt;img onerror=&quot;unsafe()&quot;&gt;'));
  assert(html.includes('data:font/ttf;base64,'));
  assert(html.includes('data:image/png;base64,'));
  assert(html.includes('THSarabunPSK'));
  assert(html.includes('viewBox="0 0 595 842"'));
  for (const section of ['ข้อมูลที่อยู่', 'ข้อมูลรายละเอียดนักเรียน', 'ข้อมูลประวัติการศึกษา', 'ข้อมูลบิดา-มารดา', 'ข้อมูลผู้ปกครอง', 'ข้อมูลนักเรียน (ภาษาอังกฤษ)']) assert(html.includes(section));
  assert(!html.match(/<svg[\s\S]*<\/svg>/)[0].includes('>NaN'));
});

test('HTML renders into one A4 PDF page, including long and missing field values', async () => {
  const html = renderStudentDocument({ ...student, profile_data: { home_address_en: 'Long address '.repeat(50), guardian_name: 'ชื่อผู้ปกครอง'.repeat(15) } });
  const pdf = await PDFDocument.load(await studentDocumentPdf(html));
  assert.equal(pdf.getPageCount(), 1);
  const { width, height } = pdf.getPage(0).getSize();
  assert(Math.abs(width - 595.28) < 1);
  assert(Math.abs(height - 841.89) < 1);
});
