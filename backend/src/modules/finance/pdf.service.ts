import fs from 'fs';
import os from 'os';
import path from 'path';
import { chromium } from 'playwright';
import { getPaymentForReceipt } from './payment.service';
import { bahtText } from '../../utils/currency';
import { getReceiptSettingsRecord } from '../../repositories/receiptSettings.repository';

const TEMPLATE_PATH = path.join(process.cwd(), 'src', 'templates', 'receipt_template.html');
const FONT_REGULAR_PATH = path.join(process.cwd(), 'php-receipt', 'THSarabunNew.ttf');
const FONT_BOLD_PATH = path.join(process.cwd(), 'php-receipt', 'THSarabunNew-Bold.ttf');

function resolveBrowserExecutablePath(): string | undefined {
  const candidates = [
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    process.env.CHROME_EXECUTABLE_PATH,
    process.env.EDGE_EXECUTABLE_PATH,
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ].filter(Boolean) as string[];

  return candidates.find((candidate) => fs.existsSync(candidate));
}

function formatMoney(value: number): string {
  return Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toDataUrl(input?: string | null): string {
  if (!input) return '';
  const value = input.trim();
  if (!value) return '';
  if (value.startsWith('data:')) return value;
  if (value.startsWith('http://') || value.startsWith('https://')) return value;

  if (fs.existsSync(value)) {
    const ext = path.extname(value).toLowerCase();
    const mimeType =
      ext === '.png'
        ? 'image/png'
        : ext === '.jpg' || ext === '.jpeg'
          ? 'image/jpeg'
          : ext === '.webp'
            ? 'image/webp'
            : 'application/octet-stream';
    return `data:${mimeType};base64,${fs.readFileSync(value).toString('base64')}`;
  }

  return '';
}

function buildDefaultLogoDataUrl(schoolName: string): string {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <rect width="160" height="160" rx="20" fill="#f5f7fb"/>
    <circle cx="80" cy="80" r="58" fill="#1a5276"/>
    <circle cx="80" cy="80" r="42" fill="#ffffff"/>
    <circle cx="80" cy="80" r="30" fill="#1a5276"/>
    <text x="80" y="146" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="#1a5276">${escapeHtml(
      schoolName || 'โรงเรียน',
    )}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function fileToDataUrl(filePath: string, mimeType: string): string {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Font file not found at ${filePath}`);
  }
  return `data:${mimeType};base64,${fs.readFileSync(filePath).toString('base64')}`;
}

function renderTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => values[key] ?? '');
}

function resolveReceiptOutputDir(receiptOutputDir?: string | null) {
  if (receiptOutputDir && receiptOutputDir.trim()) {
    return path.resolve(receiptOutputDir.trim());
  }

  if (process.env.RECEIPT_OUTPUT_DIR?.trim()) {
    return path.resolve(process.env.RECEIPT_OUTPUT_DIR.trim());
  }

  return path.join(os.homedir(), 'Documents', 'E-System School', 'Receipts');
}

const THAI_MONTH_NAMES = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

function getThaiMonthFolderName(input: Date | string | number): string {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) {
    const fallback = new Date();
    return `${THAI_MONTH_NAMES[fallback.getMonth()]} ${fallback.getFullYear() + 543}`;
  }

  return `${THAI_MONTH_NAMES[date.getMonth()]} ${date.getFullYear() + 543}`;
}

function sanitizeReceiptFileName(parts: Array<string | number | null | undefined>) {
  const name = parts
    .map((part) => String(part ?? '').trim())
    .filter(Boolean)
    .join('_')
    .replace(/[<>:"/\\|?*]+/g, '_')
    .replace(/\s+/g, ' ')
    .replace(/_+/g, '_')
    .trim();

  return `${name || 'receipt'}.pdf`;
}

function buildReceiptItemValues(items: any[]) {
  const values: Record<string, string> = {};
  const normalized = items.slice(0, 10);

  for (let index = 1; index <= 10; index += 1) {
    const item = normalized[index - 1];
    values[`item_no_${index}`] = item ? String(index) : '';
    values[`item_description_${index}`] = item
      ? escapeHtml(item.fee?.plan?.name || item.description || 'รายการค่าใช้จ่าย')
      : '';
    values[`item_amount_${index}`] = item ? formatMoney(Number(item.amount || 0)) : '';
  }

  return values;
}

function buildReceiptRowsHtml(items: any[]) {
  const normalized = items.slice(0, 10);

  const rows = normalized.map((item, index) => {
    const description = escapeHtml(item.fee?.plan?.name || item.description || 'รายการค่าใช้จ่าย');
    const amount = formatMoney(Number(item.amount || 0));

    return `<tr><td class="no-cell">${index + 1}</td><td class="item-cell">${description}</td><td class="amt-cell">${amount}</td></tr>`;
  });

  return rows.join('');
}

export async function generateReceiptPdf(paymentId: string): Promise<Buffer> {
  const paymentRecord = await getPaymentForReceipt(paymentId);
  if (!paymentRecord) throw new Error('Payment record not found');

  const payment: any = paymentRecord;
  const settings = await getReceiptSettingsRecord();

  const student = payment.student;
  const studentName = `${student?.prefix || ''}${student?.first_name || ''} ${student?.last_name || ''}`.trim();
  const studentId = student?.student_id || '';
  const enrollment = student?.enrollments?.[0];
  const room = enrollment?.room;
  const gradeName = room?.grade?.name || '';
  const roomNumber = room?.room_number || '';
  const classRoom = gradeName && roomNumber
    ? `${gradeName}/${roomNumber}`
    : gradeName || roomNumber || '-';
  const firstItem = payment.items?.[0]?.fee;
  const semesterYear = `${firstItem?.sem?.semester || ''}/${firstItem?.ay?.year || ''}`.replace(
    /^\/|\/$/g,
    '',
  ) || '-';
  const paymentDate = new Date(payment.payment_date).toLocaleDateString('en-GB');
  const totalAmount = Number(payment.total_amount || 0);

  if (!fs.existsSync(TEMPLATE_PATH)) {
    throw new Error(`Receipt template not found at ${TEMPLATE_PATH}`);
  }

  if (!fs.existsSync(FONT_REGULAR_PATH) || !fs.existsSync(FONT_BOLD_PATH)) {
    throw new Error('Sarabun font files not found in backend/php-receipt');
  }

  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  const fontCss = `
    @font-face {
      font-family: 'Sarabun';
      font-style: normal;
      font-weight: 400;
      src: url('${fileToDataUrl(FONT_REGULAR_PATH, 'font/ttf')}') format('truetype');
    }
    @font-face {
      font-family: 'Sarabun';
      font-style: normal;
      font-weight: 600;
      src: url('${fileToDataUrl(FONT_REGULAR_PATH, 'font/ttf')}') format('truetype');
    }
    @font-face {
      font-family: 'Sarabun';
      font-style: normal;
      font-weight: 700;
      src: url('${fileToDataUrl(FONT_BOLD_PATH, 'font/ttf')}') format('truetype');
    }
  `;

  const html = renderTemplate(
    template.replace(
      "@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');",
      fontCss,
    ),
    {
      school_name: settings.school_name || 'โรงเรียนสหวิทยานุสรณ์',
      school_logo_url:
        toDataUrl(settings.school_logo_url) ||
        buildDefaultLogoDataUrl(settings.school_name || 'โรงเรียนสหวิทยานุสรณ์'),
      school_address: settings.school_address || '',
      school_phone: settings.school_phone || '',
      receipt_note: settings.receipt_note || '',
      payee_name: settings.payee_name || 'ฝ่ายการเงิน',
      payment_date: paymentDate,
      receipt_no: payment.receipt_no || '',
      student_name: studentName || '-',
      student_id: studentId || '-',
      class: classRoom,
      term: semesterYear,
      cashier_name: settings.payee_name || 'ฝ่ายการเงิน',
      items_rows_html: buildReceiptRowsHtml(payment.items || []),
      ...buildReceiptItemValues(payment.items || []),
      total_amount: formatMoney(totalAmount),
      total_text: bahtText(totalAmount),
      phone_label: 'โทร.',
      watermark_original: 'ต้นฉบับ',
      watermark_copy: 'สำเนา',
      label_receipt_title: 'ใบเสร็จรับเงิน',
      label_finance_copy: '(ฉบับสำเนา สำหรับฝ่ายการเงิน)',
      label_student_copy: '(ฉบับจริง สำหรับนักเรียน)',
      label_date: 'วันที่',
      label_receipt_no: 'เลขที่ใบเสร็จ',
      label_student_name: 'ชื่อ-นามสกุล',
      label_student_id: 'เลขประจำตัวนักเรียน',
      label_class: 'ชั้น',
      label_term: 'ภาคเรียนที่',
      label_no: 'ลำดับที่',
      label_item: 'รายละเอียด',
      label_amount: 'จำนวนเงิน',
      label_baht: 'บาท',
      label_total: 'รวมทั้งสิ้น',
      label_conditions: 'เงื่อนไข',
      label_keep_receipt: 'กรุณาเก็บใบเสร็จไว้เป็นหลักฐาน',
      label_change_note: 'ถ้าต้องการเปลี่ยนแปลงหรือแก้ไขข้อมูล',
      label_change_note_sub: 'ต้องนำต้นฉบับและสำเนามาด้วยทุกครั้ง',
      label_signature_line: 'ลงชื่อ...................................................ผู้รับเงิน',
    },
  );

  const executablePath = resolveBrowserExecutablePath();

  const browser = await chromium.launch({
    headless: true,
    executablePath,
    args: ['--no-sandbox', '--disable-gpu', '--font-render-hinting=none'],
  });

  try {
    const page = await browser.newPage({
      viewport: { width: 1400, height: 1000 },
      deviceScaleFactor: 1,
    });
    await page.setContent(html, { waitUntil: 'networkidle' });
    return Buffer.from(
      await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
      }),
    );
  } finally {
    await browser.close();
  }
}

export async function saveReceiptPdfToDisk(paymentId: string): Promise<string> {
  const paymentRecord = await getPaymentForReceipt(paymentId);
  const settings = await getReceiptSettingsRecord();
  const pdfBuffer = await generateReceiptPdf(paymentId);
  const outputDir = resolveReceiptOutputDir(settings.receipt_output_dir);
  const paymentDate = paymentRecord?.payment_date ? new Date(paymentRecord.payment_date) : new Date();
  const monthFolder = getThaiMonthFolderName(paymentDate);
  const student = paymentRecord?.student || {};
  const studentName = `${student.prefix || ''}${student.first_name || ''} ${student.last_name || ''}`.trim();
  const folderPath = path.join(outputDir, monthFolder);
  const fileName = sanitizeReceiptFileName([
    paymentRecord?.receipt_no || paymentId,
    studentName,
  ]);
  const filePath = path.join(folderPath, fileName);

  fs.mkdirSync(folderPath, { recursive: true });
  fs.writeFileSync(filePath, pdfBuffer);

  try {
    const { getPostgresPool } = await import('../../config/database');
    const pool = getPostgresPool();
    await pool.query('update payments set receipt_file_url = $1 where id = $2', [filePath, paymentId]);
  } catch (error) {
    console.error('Failed to store receipt file path:', error);
  }

  return filePath;
}
