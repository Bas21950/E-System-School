import type { CSSProperties } from 'react';

type ArrearsFee = {
  fee_name: string;
  category: 'tuition' | 'special' | 'other';
  balance: number;
};

type ArrearsStudent = {
  student_code: string;
  first_name: string;
  last_name: string;
  grade_name: string | null;
  room_number: string | null;
  fees: ArrearsFee[];
  tuitionBalance: number;
  specialBalance: number;
  otherBalance: number;
  totalBalance: number;
};

type ArrearsSummary = {
  totalStudents: number;
  totalBalance: number;
  tuitionBalance: number;
  specialBalance: number;
  otherBalance: number;
};

type ArrearsReportTemplateProps = {
  schoolName: string;
  schoolAddress: string;
  reportDate: string;
  academicYear: string;
  summary: ArrearsSummary;
  rows: ArrearsStudent[];
};

export function ArrearsReportTemplate({
  schoolName,
  schoolAddress,
  reportDate,
  academicYear,
  summary,
  rows,
}: ArrearsReportTemplateProps) {
  return (
    <html lang="th">
      <body style={{ margin: 0, background: '#fff', color: '#000', fontFamily: 'Tahoma, Arial, sans-serif' }}>
        <div style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', padding: '14mm 12mm', boxSizing: 'border-box' }}>
          <div style={{ textAlign: 'center', marginBottom: '8mm' }}>
            <div style={{ fontSize: '18pt', fontWeight: 700, lineHeight: 1.2 }}>{schoolName}</div>
            <div style={{ fontSize: '11pt', marginTop: '2mm' }}>{schoolAddress}</div>
            <div style={{ fontSize: '14pt', fontWeight: 700, marginTop: '5mm' }}>รายงานนักเรียนค้างชำระ</div>
            <div style={{ fontSize: '10.5pt', marginTop: '2mm' }}>
              ปีการศึกษา {academicYear} | วันที่ออกรายงาน {reportDate}
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6mm', fontSize: '10.5pt' }}>
            <tbody>
              <tr>
                <td style={cellLabel}>จำนวนนักเรียนค้าง</td>
                <td style={cellValue}>{summary.totalStudents.toLocaleString()} คน</td>
                <td style={cellLabel}>ยอดค้างรวม</td>
                <td style={cellValue}>{summary.totalBalance.toLocaleString()} บาท</td>
              </tr>
              <tr>
                <td style={cellLabel}>ค่าเทอม</td>
                <td style={cellValue}>{summary.tuitionBalance.toLocaleString()} บาท</td>
                <td style={cellLabel}>ค่าเรียนพิเศษ</td>
                <td style={cellValue}>{summary.specialBalance.toLocaleString()} บาท</td>
              </tr>
              <tr>
                <td style={cellLabel}>ค่าอื่นๆ</td>
                <td style={cellValue}>{summary.otherBalance.toLocaleString()} บาท</td>
                <td style={cellLabel}></td>
                <td style={cellValue}></td>
              </tr>
            </tbody>
          </table>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
            <thead>
              <tr>
                {['ลำดับ', 'รหัสนักเรียน', 'ชื่อ-นามสกุล', 'ชั้น/ห้อง', 'ค่าเทอม', 'ค่าเรียนพิเศษ', 'ค่าอื่นๆ', 'รวมค้าง'].map((head) => (
                  <th key={head} style={tableHead}>
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.student_code}>
                  <td style={tableCellCenter}>{index + 1}</td>
                  <td style={tableCell}>{row.student_code}</td>
                  <td style={tableCell}>{row.first_name} {row.last_name}</td>
                  <td style={tableCell}>{row.grade_name || '-'} / {row.room_number || '-'}</td>
                  <td style={tableCellRight}>{row.tuitionBalance.toLocaleString()}</td>
                  <td style={tableCellRight}>{row.specialBalance.toLocaleString()}</td>
                  <td style={tableCellRight}>{row.otherBalance.toLocaleString()}</td>
                  <td style={tableCellRightBold}>{row.totalBalance.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: '10mm', fontSize: '10pt', lineHeight: 1.7 }}>
            <div style={{ marginBottom: '2mm' }}>หมายเหตุ 1. รายงานฉบับนี้จัดทำเพื่อเสนอผู้บริหาร</div>
            <div style={{ marginBottom: '2mm' }}>         2. กรุณาตรวจสอบรายการค้างชำระก่อนดำเนินการติดตาม</div>
            <div style={{ marginBottom: '2mm' }}>         3. รายการค่าใช้จ่ายแยกตามประเภทค่าเทอม ค่าเรียนพิเศษ และค่าอื่นๆ</div>
          </div>

          <table style={{ width: '100%', marginTop: '14mm', borderCollapse: 'collapse', fontSize: '10pt' }}>
            <tbody>
              <tr>
                <td style={signCell}>
                  <div>....................................................</div>
                  <div style={{ marginTop: '2mm' }}>ผู้จัดทำ</div>
                </td>
                <td style={signCell}>
                  <div>....................................................</div>
                  <div style={{ marginTop: '2mm' }}>หัวหน้างานการเงิน</div>
                </td>
                <td style={signCell}>
                  <div>....................................................</div>
                  <div style={{ marginTop: '2mm' }}>ผู้อำนวยการ</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <style>{`
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        `}</style>
      </body>
    </html>
  );
}

const cellLabel: CSSProperties = {
  width: '20%',
  border: '1px solid #000',
  padding: '3mm 2.5mm',
  fontWeight: 700,
  verticalAlign: 'top',
};

const cellValue: CSSProperties = {
  width: '30%',
  border: '1px solid #000',
  padding: '3mm 2.5mm',
  verticalAlign: 'top',
};

const tableHead: CSSProperties = {
  border: '1px solid #000',
  padding: '2.5mm 2mm',
  textAlign: 'center',
  fontWeight: 700,
};

const tableCell: CSSProperties = {
  border: '1px solid #000',
  padding: '2.5mm 2mm',
  verticalAlign: 'top',
};

const tableCellCenter: CSSProperties = {
  ...tableCell,
  textAlign: 'center',
  width: '6%',
};

const tableCellRight: CSSProperties = {
  ...tableCell,
  textAlign: 'right',
  width: '10%',
};

const tableCellRightBold: CSSProperties = {
  ...tableCellRight,
  fontWeight: 700,
};

const signCell: CSSProperties = {
  width: '33.33%',
  textAlign: 'center',
  verticalAlign: 'top',
};
