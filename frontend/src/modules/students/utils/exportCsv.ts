import { Student } from '../types/student';

export function exportStudentsCsv(students: Student[]) {
  // Headers in Thai
  const headers = [
    'ลำดับ',
    'รหัสนักเรียน',
    'เลขประจำตัวประชาชน',
    'คำนำหน้า',
    'ชื่อ',
    'นามสกุล',
    'เพศ',
    'วันเกิด',
    'ชั้นเรียน',
    'ห้อง',
    'ปีการศึกษา',
    'ชื่อผู้ปกครอง',
    'เบอร์โทรผู้ปกครอง',
    'ที่อยู่',
    'สถานะ'
  ];

  // Convert students to CSV rows
  const rows = students.map((s) => [
    s.sequence_no,
    s.student_id,
    s.national_id || '-',
    s.prefix || '',
    s.first_name,
    s.last_name,
    s.gender || '-',
    s.birthday || '-',
    s.room_info?.grade_info?.name || '-',
    s.room_info?.room_number || '-',
    s.enrollment_history?.[0]?.academic_year_info?.year || '-',
    s.parent_name || '-',
    s.parent_phone || '-',
    s.address || '-',
    s.status
  ]);

  // Add BOM for Excel UTF-8 support
  const bom = '\\uFEFF';
  
  // Format as CSV
  const csvContent =
    bom +
    [
      headers.join(','),
      ...rows.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\\n');

  // Trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `students_export_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
