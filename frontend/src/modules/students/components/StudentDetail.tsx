'use client';

import Link from 'next/link';
import type { Student, StudentProfileData } from '../types/student';
import { HiOutlineBanknotes, HiOutlinePrinter } from 'react-icons/hi2';
import { formatThaiDate } from '@/lib/dateUtils';

interface StudentDetailProps {
  student: Student;
  onClose: () => void;
}

function display(value: string | number | null | undefined): string {
  if (value === null || value === undefined || String(value).trim() === '') return '—';
  return String(value);
}

function DocumentSection({
  title,
  fields,
  columns = 4,
}: {
  title: string;
  fields: { label: string; value: string | number | null | undefined; wide?: boolean }[];
  columns?: 2 | 3 | 4;
}) {
  return (
    <section className="student-document-section">
      <h3 className="student-document-section-title">{title}</h3>
      <div className={`student-document-grid student-document-grid-${columns}`}>
        {fields.map((field) => (
          <div key={field.label} className={`student-document-field ${field.wide ? 'student-document-field-wide' : ''}`}>
            <span className="student-document-label">{field.label}</span>
            <span className="student-document-value">{display(field.value)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function StudentDetail({ student, onClose }: StudentDetailProps) {
  const profile: StudentProfileData = student.profile_data || {};
  const name = `${student.prefix || ''}${student.first_name} ${student.last_name}`.trim();
  const room = student.room_info
    ? `${student.room_info.grade_info?.name || 'ไม่ระบุระดับชั้น'} ห้อง ${student.room_info.room_number || '—'}`
    : '—';

  return (
    <div className="space-y-4">
      <div className="student-detail-actions flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-gray-600">เอกสารประวัตินักเรียน · ตรวจทานข้อมูลและพิมพ์เป็นกระดาษ A4 ได้</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => window.print()} className="btn-secondary">
            <HiOutlinePrinter size={18} /> พิมพ์เอกสาร
          </button>
          <Link href={`/finance/student-payments/${student.id}`} className="btn-primary">
            <HiOutlineBanknotes size={18} /> ข้อมูลการเงิน
          </Link>
        </div>
      </div>

      <article className="student-document-printable mx-auto w-full max-w-[210mm] border border-gray-300 bg-white p-5 text-gray-900 shadow-sm sm:p-7">
        <header className="student-document-header">
          <div className="student-document-emblem" aria-hidden="true">รร.</div>
          <div className="min-w-0 flex-1 text-center">
            <div className="text-xs font-medium text-gray-600">ระบบบริหารจัดการสารสนเทศโรงเรียน · E-System School</div>
            <h2 className="mt-1 text-xl font-bold tracking-wide">ทะเบียนประวัตินักเรียน</h2>
            <p className="mt-1 text-xs text-gray-600">ข้อมูลสำหรับงานทะเบียนและงานดูแลช่วยเหลือนักเรียน</p>
          </div>
          <div className="student-document-photo">รูปถ่าย<br />นักเรียน</div>
        </header>

        <DocumentSection title="๑. ข้อมูลนักเรียน" fields={[
          { label: 'เลขประจำตัวนักเรียน', value: student.student_id },
          { label: 'เลขประจำตัวประชาชน', value: student.national_id },
          { label: 'ชื่อ–นามสกุล', value: name, wide: true },
          { label: 'เพศ', value: student.gender },
          { label: 'วันเดือนปีเกิด', value: formatThaiDate(student.birthday) },
          { label: 'อายุตามเอกสาร (ปี)', value: profile.student_age },
          { label: 'ชั้น / ห้องปัจจุบัน', value: room },
          { label: 'ปีการศึกษา', value: student.academic_year_info?.year },
          { label: 'สถานะ', value: student.status },
          { label: 'สัญชาติ', value: profile.nationality },
          { label: 'เชื้อชาติ', value: profile.ethnicity },
          { label: 'ศาสนา', value: profile.religion },
          { label: 'กรุ๊ปเลือด', value: profile.blood_type },
          { label: 'ส่วนสูง (ซม.)', value: profile.height_cm },
          { label: 'น้ำหนัก (กก.)', value: profile.weight_kg },
          { label: 'ประเภทความพิการ', value: profile.disability_type },
        ]} />

        <DocumentSection title="๒. ที่อยู่ตามทะเบียนบ้านและการติดต่อ" fields={[
          { label: 'รหัสประจำบ้าน', value: profile.house_registration_no },
          { label: 'บ้านเลขที่', value: profile.house_no },
          { label: 'หมู่ที่', value: profile.moo },
          { label: 'ซอย', value: profile.alley },
          { label: 'ถนน', value: profile.road },
          { label: 'ตำบล / แขวง', value: profile.subdistrict },
          { label: 'อำเภอ / เขต', value: profile.district },
          { label: 'จังหวัด', value: profile.province },
          { label: 'รหัสไปรษณีย์', value: profile.postal_code },
          { label: 'โทรศัพท์นักเรียน', value: profile.telephone || student.parent_phone },
          { label: 'โทรสาร', value: profile.fax },
          { label: 'อีเมล', value: profile.email },
          { label: 'ที่อยู่ที่บันทึกในทะเบียน', value: student.address, wide: true },
          { label: 'Home Address', value: profile.home_address_en, wide: true },
        ]} />

        <DocumentSection title="๓. สถานภาพ สุขภาพ และความสามารถ" fields={[
          { label: 'สถานะตามเอกสาร', value: profile.enrollment_status_label },
          { label: 'วันที่เข้าเรียน', value: formatThaiDate(profile.admission_date) },
          { label: 'ความด้อยโอกาส', value: profile.opportunity_status },
          { label: 'ความสามารถพิเศษ', value: profile.special_abilities, wide: true },
          { label: 'โรคประจำตัว', value: profile.chronic_disease },
          { label: 'การแพ้ยา', value: profile.drug_allergy },
          { label: 'การแพ้อาหาร', value: profile.food_allergy },
          { label: 'อาหารที่ชอบ', value: profile.favorite_foods },
        ]} />

        <DocumentSection title="๔. ประวัติการศึกษาเดิม" fields={[
          { label: 'ชั้นเรียนเดิม', value: profile.previous_grade },
          { label: 'รหัสนักเรียนเดิม', value: profile.previous_student_id },
          { label: 'สังกัดโรงเรียนเดิม', value: profile.previous_school_affiliation },
          { label: 'จังหวัดโรงเรียนเดิม', value: profile.previous_school_province },
          { label: 'ชื่อโรงเรียนเดิม', value: profile.previous_school_name, wide: true },
          { label: 'หน่วยกิตรวม', value: profile.previous_total_credits },
          { label: 'ผลการเรียนเฉลี่ย (GPA)', value: profile.previous_gpa },
          { label: 'สถานะการตรวจวุฒิ', value: profile.qualification_status },
          { label: 'วันที่ตอบกลับ', value: formatThaiDate(profile.qualification_response_date) },
          { label: 'วันที่จบการศึกษา', value: formatThaiDate(profile.previous_graduation_date) },
        ]} />

        <DocumentSection title="๕. ข้อมูลครอบครัว" columns={3} fields={[
          { label: 'สถานภาพสมรสของบิดามารดา', value: profile.parents_marital_status },
          { label: 'จำนวนพี่น้อง', value: profile.siblings_count },
          { label: 'พี่น้องที่กำลังศึกษา', value: profile.siblings_studying_count },
          { label: 'เลขประชาชนบิดา', value: profile.father_national_id },
          { label: 'ชื่อบิดา', value: profile.father_name },
          { label: 'สัญชาติบิดา', value: profile.father_nationality },
          { label: 'สถานภาพบิดา', value: profile.father_status },
          { label: 'ความพิการบิดา', value: profile.father_disability_type },
          { label: 'อาชีพบิดา / รายได้', value: [profile.father_occupation, profile.father_monthly_income].filter(Boolean).join(' / ') },
          { label: 'เลขประชาชนมารดา', value: profile.mother_national_id },
          { label: 'ชื่อมารดา', value: profile.mother_name },
          { label: 'สัญชาติมารดา', value: profile.mother_nationality },
          { label: 'สถานภาพมารดา', value: profile.mother_status },
          { label: 'ความพิการมารดา', value: profile.mother_disability_type },
          { label: 'อาชีพมารดา / รายได้', value: [profile.mother_occupation, profile.mother_monthly_income].filter(Boolean).join(' / ') },
          { label: 'เลขประชาชนผู้ปกครอง', value: profile.guardian_national_id },
          { label: 'ชื่อผู้ปกครอง', value: profile.guardian_name || student.parent_name },
          { label: 'ความสัมพันธ์ / อายุ', value: [profile.guardian_relationship, profile.guardian_age && `${profile.guardian_age} ปี`].filter(Boolean).join(' / ') },
          { label: 'สถานภาพผู้ปกครอง', value: profile.guardian_status },
          { label: 'อาชีพ / รายได้ผู้ปกครอง', value: [profile.guardian_occupation, profile.guardian_monthly_income].filter(Boolean).join(' / ') },
          { label: 'เบอร์โทรศัพท์ผู้ปกครอง', value: student.parent_phone || profile.telephone },
        ]} />

        <DocumentSection title="๖. ข้อมูลภาษาอังกฤษ" columns={2} fields={[
          { label: 'Student Name', value: profile.student_name_en, wide: true },
          { label: 'Name of Parent', value: profile.parent_name_en, wide: true },
        ]} />

        <section className="student-document-section">
          <h3 className="student-document-section-title">๗. ประวัติการลงทะเบียนเรียน</h3>
          <table className="student-document-history">
            <thead><tr><th>ปีการศึกษา</th><th>ระดับชั้น / ห้อง</th><th>สถานะ</th></tr></thead>
            <tbody>
              {(student.enrollment_history || []).map((entry) => (
                <tr key={entry.id}>
                  <td>{display(entry.academic_year_info?.year)}</td>
                  <td>{display(entry.room_info?.grade_info?.name)} ห้อง {display(entry.room_info?.room_number)}</td>
                  <td>{entry.status === 'active' ? 'กำลังศึกษาอยู่' : display(entry.status)}</td>
                </tr>
              ))}
              {(!student.enrollment_history || student.enrollment_history.length === 0) && (
                <tr><td>{display(student.academic_year_info?.year)}</td><td>{room}</td><td>{display(student.status)}</td></tr>
              )}
            </tbody>
          </table>
        </section>

        <footer className="student-document-footer">
          <span>เอกสารจากระบบ E-System School</span>
          <span>รหัสนักเรียน {display(student.student_id)}</span>
        </footer>
      </article>

      <div className="student-detail-actions flex justify-end border-t border-gray-200 pt-3">
        <button type="button" onClick={onClose} className="btn-secondary">ปิดหน้าต่าง</button>
      </div>
    </div>
  );
}
