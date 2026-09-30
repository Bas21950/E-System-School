'use client';

import { useState, useEffect, type ChangeEvent } from 'react';
import { Student, CreateStudentInput, ApiResponse, StudentProfileData } from '../types/student';
import { api } from '@/lib/api';
import { AcademicYear, GradeLevel, Room } from '@/types/master-data';
import ThaiDatePicker from '@/components/ui/ThaiDatePicker';
import { readStudentDocument } from '../utils/readStudentDocument';
import { HiOutlineDocumentArrowUp, HiOutlineCheckCircle, HiOutlineExclamationTriangle } from 'react-icons/hi2';

type ProfileFieldKey = string;
type ProfileField = { key: ProfileFieldKey; label: string; wide?: boolean; date?: boolean };

const PROFILE_SECTIONS: { title: string; fields: ProfileField[]; columns?: string }[] = [
  {
    title: 'ข้อมูลส่วนบุคคลและสุขภาพ',
    columns: 'grid-cols-2 xl:grid-cols-4',
    fields: [
      { key: 'nationality', label: 'สัญชาติ' }, { key: 'ethnicity', label: 'เชื้อชาติ' },
      { key: 'religion', label: 'ศาสนา' }, { key: 'blood_type', label: 'กรุ๊ปเลือด' },
      { key: 'student_age', label: 'อายุตามเอกสาร (ปี)' },
      { key: 'height_cm', label: 'ส่วนสูง (ซม.)' }, { key: 'weight_kg', label: 'น้ำหนัก (กก.)' },
      { key: 'disability_type', label: 'ประเภทความพิการ' },
    ],
  },
  {
    title: 'ที่อยู่ตามทะเบียนบ้าน',
    columns: 'grid-cols-2 xl:grid-cols-4',
    fields: [
      { key: 'house_registration_no', label: 'รหัสประจำบ้าน' }, { key: 'house_no', label: 'บ้านเลขที่' },
      { key: 'moo', label: 'หมู่ที่' }, { key: 'alley', label: 'ซอย' }, { key: 'road', label: 'ถนน' },
      { key: 'subdistrict', label: 'ตำบล / แขวง' }, { key: 'district', label: 'อำเภอ / เขต' },
      { key: 'province', label: 'จังหวัด' }, { key: 'postal_code', label: 'รหัสไปรษณีย์' },
      { key: 'telephone', label: 'โทรศัพท์' }, { key: 'fax', label: 'โทรสาร' }, { key: 'email', label: 'อีเมล' },
    ],
  },
  {
    title: 'รายละเอียดนักเรียน',
    columns: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
    fields: [
      { key: 'enrollment_status_label', label: 'สถานะตามเอกสาร' }, { key: 'admission_date', label: 'วันที่เข้าเรียน', date: true },
      { key: 'special_abilities', label: 'ความสามารถพิเศษ', wide: true }, { key: 'opportunity_status', label: 'ความด้อยโอกาส' },
      { key: 'chronic_disease', label: 'โรคประจำตัว' }, { key: 'drug_allergy', label: 'การแพ้ยา' },
      { key: 'food_allergy', label: 'การแพ้อาหาร' }, { key: 'favorite_foods', label: 'อาหารที่ชอบ' },
    ],
  },
  {
    title: 'ประวัติการศึกษาเดิม',
    columns: 'grid-cols-2 xl:grid-cols-4',
    fields: [
      { key: 'previous_grade', label: 'ชั้นเรียนเดิม' }, { key: 'previous_student_id', label: 'รหัสนักเรียนเดิม' },
      { key: 'previous_school_affiliation', label: 'สังกัดโรงเรียนเดิม' }, { key: 'previous_school_name', label: 'ชื่อโรงเรียนเดิม', wide: true },
      { key: 'previous_school_province', label: 'จังหวัดโรงเรียนเดิม' }, { key: 'previous_total_credits', label: 'หน่วยกิตรวม' },
      { key: 'previous_gpa', label: 'ผลการเรียนเฉลี่ย GPA' }, { key: 'qualification_status', label: 'สถานะการตรวจวุฒิ' },
      { key: 'qualification_response_date', label: 'วันที่ตอบกลับ', date: true }, { key: 'previous_graduation_date', label: 'วันที่จบการศึกษา', date: true },
    ],
  },
  {
    title: 'ข้อมูลครอบครัว',
    columns: 'grid-cols-2 xl:grid-cols-4',
    fields: [
      { key: 'parents_marital_status', label: 'สถานภาพสมรสของบิดามารดา' },
      { key: 'siblings_count', label: 'จำนวนพี่น้อง' }, { key: 'siblings_studying_count', label: 'พี่น้องที่กำลังศึกษา' },
      { key: 'father_national_id', label: 'เลขประชาชนบิดา' }, { key: 'father_name', label: 'ชื่อบิดา', wide: true },
      { key: 'father_nationality', label: 'สัญชาติบิดา' }, { key: 'father_status', label: 'สถานภาพบิดา' },
      { key: 'father_disability_type', label: 'ความพิการบิดา' }, { key: 'father_occupation', label: 'อาชีพบิดา' },
      { key: 'father_monthly_income', label: 'รายได้บิดา' },
      { key: 'mother_national_id', label: 'เลขประชาชนมารดา' }, { key: 'mother_name', label: 'ชื่อมารดา', wide: true },
      { key: 'mother_nationality', label: 'สัญชาติมารดา' }, { key: 'mother_status', label: 'สถานภาพมารดา' },
      { key: 'mother_disability_type', label: 'ความพิการมารดา' }, { key: 'mother_occupation', label: 'อาชีพมารดา' },
      { key: 'mother_monthly_income', label: 'รายได้มารดา' },
      { key: 'guardian_national_id', label: 'เลขประชาชนผู้ปกครอง' }, { key: 'guardian_name', label: 'ชื่อผู้ปกครอง', wide: true },
      { key: 'guardian_relationship', label: 'ความสัมพันธ์' }, { key: 'guardian_age', label: 'อายุผู้ปกครอง' },
      { key: 'guardian_status', label: 'สถานภาพผู้ปกครอง' }, { key: 'guardian_occupation', label: 'อาชีพผู้ปกครอง' },
      { key: 'guardian_monthly_income', label: 'รายได้ผู้ปกครอง' },
    ],
  },
  {
    title: 'ข้อมูลภาษาอังกฤษ',
    columns: 'grid-cols-1 md:grid-cols-2',
    fields: [
      { key: 'student_name_en', label: 'ชื่อนักเรียน (Student Name)' },
      { key: 'parent_name_en', label: 'ชื่อผู้ปกครอง (Name of Parent)' },
      { key: 'home_address_en', label: 'ที่อยู่นักเรียน (Home Address)', wide: true },
    ],
  },
];

interface StudentFormProps {
  initialData?: Student | null;
  onSubmit: (data: CreateStudentInput) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
}

export default function StudentForm({ initialData, onSubmit, onCancel }: StudentFormProps) {
  const [formData, setFormData] = useState<CreateStudentInput>({
    student_id: '',
    national_id: '',
    prefix: '',
    first_name: '',
    last_name: '',
    gender: 'ชาย',
    birthday: '',
    room_id: '',
    academic_year_id: '',
    parent_name: '',
    parent_phone: '',
    address: '',
    status: 'กำลังศึกษาอยู่',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profileData, setProfileData] = useState<StudentProfileData>({});
  const [readingDocument, setReadingDocument] = useState(false);
  const [documentError, setDocumentError] = useState('');
  const [documentInfo, setDocumentInfo] = useState<{ name: string; fields: number; pages: number } | null>(null);
  const [documentReviewed, setDocumentReviewed] = useState(false);
  
  // Master Data Options
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [selectedGradeId, setSelectedGradeId] = useState<string>('');

  useEffect(() => {
    async function fetchMasterData() {
      try {
        const [yearsRes, gradesRes, roomsRes] = await Promise.all([
          api.get<ApiResponse<AcademicYear[]>>('/academic-years'),
          api.get<ApiResponse<GradeLevel[]>>('/grade-levels'),
          api.get<ApiResponse<Room[]>>('/rooms')
        ]);
        
        setAcademicYears(yearsRes.data || []);
        setGradeLevels(gradesRes.data || []);
        setAllRooms(roomsRes.data || []);

        const currentYear = (yearsRes.data || []).find((year) => year.is_current);
        if (initialData?.room_info?.grade_info?.id) setSelectedGradeId(initialData.room_info.grade_info.id);
        else if (!initialData) setSelectedGradeId('');
        if (initialData) {
          setFormData((prev) => ({
            ...prev,
            room_id: initialData.room_info?.id || initialData.room_id || '',
            academic_year_id: initialData.academic_year_info?.id || initialData.academic_year_id || '',
          }));
        } else if (currentYear) {
          setFormData((prev) => ({ ...prev, academic_year_id: prev.academic_year_id || currentYear.id }));
        }
      } catch (err) {
        console.error('Failed to fetch master data', err);
      }
    }
    fetchMasterData();
  }, [initialData]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        student_id: initialData.student_id,
        national_id: initialData.national_id || '',
        prefix: initialData.prefix || '',
        first_name: initialData.first_name,
        last_name: initialData.last_name,
        gender: initialData.gender || 'ชาย',
        birthday: initialData.birthday || '',
        room_id: initialData.room_info?.id || initialData.room_id || '',
        academic_year_id: initialData.academic_year_info?.id || initialData.academic_year_id || '',
        parent_name: initialData.parent_name || '',
        parent_phone: initialData.parent_phone || '',
        address: initialData.address || '',
        status: initialData.status || 'กำลังศึกษาอยู่',
      });
      setProfileData(initialData.profile_data || {});
    } else {
      setFormData({
        student_id: '', national_id: '', prefix: '', first_name: '', last_name: '', gender: 'ชาย', birthday: '',
        room_id: '', academic_year_id: '', parent_name: '', parent_phone: '', address: '', status: 'กำลังศึกษาอยู่',
      });
      setProfileData({});
    }
    setDocumentInfo(null);
    setDocumentError('');
    setDocumentReviewed(false);
  }, [initialData]);

  const filteredRooms = allRooms.filter(r => r.grade_id === selectedGradeId);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData((prev) => {
      const updates: Partial<CreateStudentInput> = { [name]: value };
      
      // Auto-update gender based on prefix
      if (name === 'prefix') {
        if (value === 'เด็กชาย' || value === 'นาย') {
          updates.gender = 'ชาย';
        } else if (value === 'เด็กหญิง' || value === 'นางสาว') {
          updates.gender = 'หญิง';
        }
      }
      
      return { ...prev, ...updates };
    });
  };

  const handleGradeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newGradeId = e.target.value;
    setSelectedGradeId(newGradeId);
    // Reset room when grade changes
    setFormData(prev => ({ ...prev, room_id: '' }));
  };

  const handleProfileChange = (key: ProfileFieldKey, value: string) => {
    setProfileData((previous) => ({ ...previous, [key]: value }));
  };

  const readDocument = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setReadingDocument(true);
    setDocumentError('');
    setError('');
    setDocumentReviewed(false);
    try {
      const result = await readStudentDocument(file);
      const importedBaseFields = Object.fromEntries(
        Object.entries(result.data).filter(([key, value]) => key !== 'profile_data' && typeof value === 'string' && value.trim())
      ) as Partial<CreateStudentInput>;
      const importedProfile = Object.fromEntries(
        Object.entries(result.data.profile_data || {}).filter(([, value]) => typeof value === 'string' && value.trim())
      ) as StudentProfileData;

      setFormData((previous) => ({ ...previous, ...importedBaseFields }));
      setProfileData((previous) => ({ ...previous, ...importedProfile }));

      if (result.roomLabel) {
        const roomMatch = result.roomLabel.match(/^\s*([ก-ฮa-z]+)\.?\s*(\d+)\s*[/-]\s*(\d+)/i);
        if (roomMatch) {
          const prefixMap: Record<string, string> = { p: 'ป', k: 'อ', m: 'ม' };
          const prefix = prefixMap[roomMatch[1].toLowerCase()] || roomMatch[1];
          const gradeNo = roomMatch[2];
          const roomNo = roomMatch[3];
          const normalize = (value: string) => value.toLowerCase().replace(/[^ก-ฮa-z0-9]/gi, '');
          const grade = gradeLevels.find((item) => normalize(item.short_name) === normalize(`${prefix}${gradeNo}`));
          const room = allRooms.find((item) => item.grade_id === grade?.id && item.room_number === roomNo);
          if (grade && room) {
            setSelectedGradeId(grade.id);
            setFormData((previous) => ({ ...previous, room_id: room.id }));
          }
        }
      }

      setDocumentInfo({ name: file.name, fields: result.matchedFields.length, pages: result.pageCount });
    } catch (readError) {
      setDocumentError(readError instanceof Error ? readError.message : 'อ่านเอกสารไม่สำเร็จ');
      setDocumentInfo(null);
    } finally {
      setReadingDocument(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (documentInfo && !documentReviewed) {
      setError('กรุณาตรวจสอบข้อมูลที่อ่านจากเอกสาร แล้วทำเครื่องหมายยืนยันก่อนบันทึก');
      setLoading(false);
      return;
    }

    if (!formData.student_id || !formData.first_name || !formData.last_name || (!initialData && (!formData.room_id || !formData.academic_year_id))) {
      setError('กรุณากรอกข้อมูลที่มีเครื่องหมาย * ให้ครบถ้วน (รหัส, ชื่อ, ระดับชั้น/ห้อง และปีการศึกษาสำหรับนักเรียนใหม่)');
      setLoading(false);
      return;
    }

    const { success, error: submitError } = await onSubmit({ ...formData, profile_data: profileData });
    
    if (!success) {
      setError(submitError || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-sm border border-sky-200 bg-white">
        <div className="flex items-center gap-2 border-b border-sky-200 bg-sky-50 px-4 py-3 text-sm font-bold text-sky-900">
          <HiOutlineDocumentArrowUp size={18} />
          อ่านข้อมูลจากเอกสารนักเรียน (PDF)
        </div>
        <div className="space-y-3 p-4">
          <p className="text-sm text-gray-600">
            เลือก PDF ของนักเรียน ระบบจะอ่านข้อมูลและเติมลงในช่องด้านล่างโดยอัตโนมัติ ข้อมูลจะยังไม่ถูกบันทึกจนกว่าจะตรวจทานและกดยืนยัน
          </p>
          <label className={`inline-flex cursor-pointer items-center gap-2 rounded-sm border border-sky-700 bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800 ${readingDocument ? 'pointer-events-none opacity-60' : ''}`}>
            <HiOutlineDocumentArrowUp size={18} />
            {readingDocument ? 'กำลังอ่านเอกสาร…' : 'เลือกไฟล์ PDF'}
            <input type="file" accept="application/pdf,.pdf" onChange={readDocument} disabled={readingDocument || loading} className="sr-only" />
          </label>
          <p className="text-xs text-gray-500">อ่านไฟล์ในเครื่องนี้เท่านั้น · รองรับ PDF ที่มีข้อความเลือกได้ ขนาดไม่เกิน 20 MB และไม่เกิน 10 หน้า (PDF สแกนเป็นภาพยังอ่านไม่ได้)</p>

          {documentError && (
            <div role="alert" className="flex items-start gap-2 border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <HiOutlineExclamationTriangle className="mt-0.5 shrink-0" size={18} />
              <span>{documentError}</span>
            </div>
          )}
          {documentInfo && (
            <div className="space-y-3 border border-emerald-300 bg-emerald-50 p-3">
              <div className="flex items-start gap-2 text-sm text-emerald-900">
                <HiOutlineCheckCircle className="mt-0.5 shrink-0" size={18} />
                <span>อ่าน “{documentInfo.name}” แล้ว พบข้อมูล {documentInfo.fields} ช่อง จาก {documentInfo.pages} หน้า กรุณาไล่ตรวจข้อมูลทุกหมวดด้านล่าง</span>
              </div>
              <label className="flex cursor-pointer items-start gap-2 border-t border-emerald-200 pt-3 text-sm font-semibold text-gray-800">
                <input type="checkbox" checked={documentReviewed} onChange={(event) => setDocumentReviewed(event.target.checked)} className="mt-1 h-4 w-4 accent-emerald-700" />
                <span>ตรวจทานข้อมูลที่อ่านจากเอกสารแล้ว และยืนยันว่าถูกต้องก่อนบันทึก</span>
              </label>
            </div>
          )}
        </div>
      </section>

      {/* Primary Info */}
      <div>
        <h3 className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-4 border-b pb-2">
          ข้อมูลพื้นฐาน
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รหัสนักเรียน *</label>
            <input
              type="text"
              name="student_id"
              value={formData.student_id}
              onChange={handleChange}
              className="input-field"
              placeholder="e.g. 66001"
              required
              disabled={!!initialData} // Usually code cannot be changed once created
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เลขประจำตัวประชาชน</label>
            <input
              type="text"
              name="national_id"
              value={formData.national_id}
              onChange={handleChange}
              className="input-field"
              placeholder="13 หลัก"
              maxLength={13}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">คำนำหน้า</label>
            <select name="prefix" value={formData.prefix || ''} onChange={handleChange} className="select-field">
              <option value="">เลือกคำนำหน้า</option>
              <option value="เด็กชาย">เด็กชาย</option>
              <option value="เด็กหญิง">เด็กหญิง</option>
              <option value="นาย">นาย</option>
              <option value="นางสาว">นางสาว</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ *</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">นามสกุล *</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เพศ</label>
            <select name="gender" value={formData.gender || 'ชาย'} onChange={handleChange} className="select-field">
              <option value="ชาย">ชาย</option>
              <option value="หญิง">หญิง</option>
            </select>
          </div>
          <div>
            <ThaiDatePicker
              label="วันเกิด"
              value={formData.birthday}
              onChange={(val) => setFormData(prev => ({ ...prev, birthday: val }))}
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {/* Enrollment Info (Step 4 & 6) */}
      <div>
        <h3 className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-4 border-b pb-2">
          {initialData ? 'การจัดห้องเรียนปัจจุบัน' : 'ข้อมูลการลงทะเบียนแรกเข้า'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ระดับชั้น *</label>
            <select value={selectedGradeId} onChange={handleGradeChange} className="select-field" required>
              <option value="">เลือกระดับชั้น</option>
              {gradeLevels.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ห้อง *</label>
            <select name="room_id" value={formData.room_id || ''} onChange={handleChange} className="select-field" required disabled={!selectedGradeId}>
              <option value="">เลือกห้อง</option>
              {filteredRooms.map(r => (
                <option key={r.id} value={r.id}>ห้อง {r.room_number}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ปีการศึกษา</label>
            <select name="academic_year_id" value={formData.academic_year_id || ''} onChange={handleChange} className="select-field">
              <option value="">เลือกปีการศึกษา</option>
              {academicYears.map(y => (
                <option key={y.id} value={y.id}>{y.year}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
            <select name="status" value={formData.status || 'กำลังศึกษาอยู่'} onChange={handleChange} className="select-field">
              <option value="กำลังศึกษาอยู่">กำลังศึกษาอยู่</option>
              <option value="สำเร็จการศึกษา">สำเร็จการศึกษา</option>
              <option value="ลาออก">ลาออก</option>
              <option value="พักการเรียน">พักการเรียน</option>
            </select>
          </div>
        </div>
      </div>

      {/* Parent Info */}
      <div>
        <h3 className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-4 border-b pb-2">
          ข้อมูลผู้ปกครองและที่อยู่
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อผู้ปกครอง</label>
            <input
              type="text"
              name="parent_name"
              value={formData.parent_name}
              onChange={handleChange}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์</label>
            <input
              type="tel"
              name="parent_phone"
              value={formData.parent_phone}
              onChange={handleChange}
              className="input-field"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">ที่อยู่</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="input-field min-h-[80px] resize-none"
              rows={3}
            />
          </div>
        </div>
      </div>

      {PROFILE_SECTIONS.map((section) => (
        <section key={section.title} className="border border-gray-200 bg-white">
          <h3 className="border-b border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-bold text-sky-900">{section.title}</h3>
          <div className={`grid grid-cols-1 gap-x-4 gap-y-3 p-4 sm:grid-cols-2 ${section.columns || ''}`}>
            {section.fields.map((field) => (
              <label key={field.key} className={`block min-w-0 ${field.wide ? 'md:col-span-2' : ''}`}>
                <span className="mb-1 block text-xs font-semibold text-gray-600">{field.label}</span>
                {field.wide && ['special_abilities', 'chronic_disease', 'home_address_en'].includes(field.key) ? (
                  <textarea
                    value={profileData[field.key] || ''}
                    onChange={(event) => handleProfileChange(field.key, event.target.value)}
                    className="input-field min-h-[68px] resize-y"
                    rows={2}
                  />
                ) : (
                  <input
                    type={field.date ? 'date' : 'text'}
                    value={profileData[field.key] || ''}
                    onChange={(event) => handleProfileChange(field.key, event.target.value)}
                    className="input-field"
                  />
                )}
              </label>
            ))}
          </div>
        </section>
      ))}

      <div className="flex gap-4 justify-end pt-6 border-t border-gray-100">
        <button type="button" onClick={onCancel} className="btn-secondary px-8" disabled={loading}>
          ยกเลิก
        </button>
        <button type="submit" className="btn-primary px-8" disabled={loading}>
          {loading ? 'กำลังบันทึก...' : <span>บันทึกข้อมูลนักเรียน</span>}
        </button>
      </div>
    </form>
  );
}
