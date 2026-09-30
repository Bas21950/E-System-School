'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Header from '@/components/layout/Header';
import Modal from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { useFinance } from '@/modules/finance/hooks/useFinance';
import { useStudents } from '@/modules/students/hooks/useStudents';
import type { BillingRosterMember, FeePlan, MonthlyBillingPreview } from '@/modules/finance/types/finance';
import { HiOutlineMagnifyingGlass, HiOutlinePlus, HiOutlineUsers } from 'react-icons/hi2';

type AcademicYear = { id: string; year: string; is_current?: boolean };
type Semester = { id: string; academic_year_id: string; semester: string };
type RosterData = Omit<MonthlyBillingPreview, 'summary'>;
type CourseCode = 'basic' | 'steam';

const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const courses: { code: CourseCode; label: string }[] = [{ code: 'basic', label: 'พื้นฐาน' }, { code: 'steam', label: 'STEAM' }];
const thaiYear = () => new Date().getFullYear() + 543;
const courseLabels = (codes: CourseCode[]) => codes.map((code) => courses.find((course) => course.code === code)?.label || code).join(', ');

export default function SpecialClassRosterPage() {
  const { fetchFeePlans, prepareMonthlyBillingRoster, updateMonthlyBillingRosterMember } = useFinance();
  const [feePlans, setFeePlans] = useState<FeePlan[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [feePlanId, setFeePlanId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [billingMonth, setBillingMonth] = useState(new Date().getMonth() + 1);
  const [billingYear, setBillingYear] = useState(thaiYear());
  const [roster, setRoster] = useState<RosterData | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [selectedCourses, setSelectedCourses] = useState<Record<string, CourseCode[]>>({});
  const [loading, setLoading] = useState(false);
  const [savingStudentId, setSavingStudentId] = useState<string | null>(null);
  const [savingSelections, setSavingSelections] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const { students: registryStudents, loading: registryLoading } = useStudents({ limit: 100 });

  const currentPlan = feePlans.find((plan) => plan.id === feePlanId);
  const visibleSemesters = semesters.filter((semester) => semester.academic_year_id === academicYearId);
  const activeMembers = useMemo(() => (roster?.members || []).filter((member) => member.is_active), [roster]);
  const selectedStudents = Object.entries(selectedCourses).filter(([, selected]) => selected.length > 0);
  const visibleStudents = registryStudents.filter((student) => {
    const keyword = pickerSearch.trim().toLowerCase();
    return !keyword || `${student.student_id} ${student.first_name} ${student.last_name}`.toLowerCase().includes(keyword);
  });
  const requestInput = useCallback(() => ({ feePlanId, academicYearId: academicYearId || null, semesterId: semesterId || null, billingMonth, billingYear }), [academicYearId, billingMonth, billingYear, feePlanId, semesterId]);
  const clearRoster = () => { setRoster(null); setMessage(null); };

  useEffect(() => {
    const load = async () => {
      try {
        const [plans, years, semesterData] = await Promise.all([fetchFeePlans(), api.get<{ data: AcademicYear[] }>('/academic-years'), api.get<{ data: Semester[] }>('/semesters')]);
        const monthly = plans.filter((plan) => plan.billing_cycle === 'monthly');
        const resolvedYears = years.data || [];
        setFeePlans(monthly); setAcademicYears(resolvedYears); setSemesters(semesterData.data || []);
        setFeePlanId(monthly[0]?.id || '');
        setAcademicYearId((resolvedYears.find((year) => year.is_current) || resolvedYears[0])?.id || '');
      } catch (error) { setMessage({ tone: 'error', text: error instanceof Error ? error.message : 'โหลดข้อมูลตั้งต้นไม่สำเร็จ' }); }
    };
    void load();
  }, [fetchFeePlans]);

  const openRoster = async () => {
    if (!feePlanId) { setMessage({ tone: 'error', text: 'กรุณาเลือกรายการค่าใช้จ่ายรายเดือน' }); return; }
    setLoading(true); setMessage(null);
    try {
      const data = await prepareMonthlyBillingRoster(requestInput());
      setRoster(data);
      setMessage({ tone: 'success', text: 'เปิดรายชื่อของรอบนี้แล้ว ระบบยกรายชื่อจากเดือนก่อนให้เมื่อมีข้อมูล' });
    } catch (error) { setMessage({ tone: 'error', text: error instanceof Error ? error.message : 'เปิดรายชื่อไม่สำเร็จ' }); }
    finally { setLoading(false); }
  };

  const saveMember = async (studentId: string, isActive: boolean, courseCodes?: CourseCode[]) => {
    if (!feePlanId) return null;
    return updateMonthlyBillingRosterMember(studentId, { ...requestInput(), isActive, courseCodes });
  };
  const removeMember = async (member: BillingRosterMember) => {
    if (member.student_fee_id) return;
    setSavingStudentId(member.student_id); setMessage(null);
    try { setRoster(await saveMember(member.student_id, false)); setMessage({ tone: 'success', text: 'นำนักเรียนออกจากรายชื่อของเดือนนี้แล้ว' }); }
    catch (error) { setMessage({ tone: 'error', text: error instanceof Error ? error.message : 'แก้ไขรายชื่อไม่สำเร็จ' }); }
    finally { setSavingStudentId(null); }
  };
  const toggleCourse = (studentId: string, code: CourseCode) => setSelectedCourses((current) => {
    const existing = current[studentId] || [];
    const next = existing.includes(code) ? existing.filter((item) => item !== code) : [...existing, code];
    const result = { ...current }; if (next.length) result[studentId] = next; else delete result[studentId]; return result;
  });
  const openPicker = () => { setPickerSearch(''); setSelectedCourses({}); setIsPickerOpen(true); };
  const addSelected = async () => {
    if (!selectedStudents.length) return;
    setSavingSelections(true); setMessage(null);
    try {
      let updated = roster;
      for (const [studentId, selected] of selectedStudents) updated = await saveMember(studentId, true, selected);
      setRoster(updated); setIsPickerOpen(false); setMessage({ tone: 'success', text: `เพิ่มนักเรียน ${selectedStudents.length} คนเข้ารายชื่อแล้ว` });
    } catch (error) { setMessage({ tone: 'error', text: error instanceof Error ? error.message : 'เพิ่มรายชื่อไม่สำเร็จ' }); }
    finally { setSavingSelections(false); }
  };

  return <div className="space-y-4 animate-fade-in">
    <Header title="จัดการรายชื่อเรียนพิเศษ" subtitle="เพิ่มนักเรียนจากทะเบียน กำหนดวิชาพื้นฐานหรือ STEAM และค่อยนำรายชื่อไปสร้างบิล" />
    <section className="rounded-sm border border-sky-200 bg-white shadow-sm">
      <div className="border-b border-sky-100 bg-sky-600 px-4 py-2 text-sm font-bold text-white">เลือกรอบรายชื่อ</div>
      <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-5">
        <label className="text-xs font-bold text-slate-700">รายการค่าใช้จ่ายรายเดือน<select value={feePlanId} onChange={(event) => { setFeePlanId(event.target.value); clearRoster(); }} className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm"><option value="">เลือกรายการ</option>{feePlans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} — {Number(plan.amount).toLocaleString()} บาท/วิชา</option>)}</select></label>
        <label className="text-xs font-bold text-slate-700">ปีการศึกษา<select value={academicYearId} onChange={(event) => { setAcademicYearId(event.target.value); setSemesterId(''); clearRoster(); }} className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm"><option value="">ไม่ระบุ</option>{academicYears.map((year) => <option key={year.id} value={year.id}>{year.year}{year.is_current ? ' (ปัจจุบัน)' : ''}</option>)}</select></label>
        <label className="text-xs font-bold text-slate-700">ภาคเรียน<select value={semesterId} onChange={(event) => { setSemesterId(event.target.value); clearRoster(); }} className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm"><option value="">ไม่ระบุ</option>{visibleSemesters.map((semester) => <option key={semester.id} value={semester.id}>ภาคเรียน {semester.semester}</option>)}</select></label>
        <label className="text-xs font-bold text-slate-700">เดือน<select value={billingMonth} onChange={(event) => { setBillingMonth(Number(event.target.value)); clearRoster(); }} className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm">{thaiMonths.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}</select></label>
        <label className="text-xs font-bold text-slate-700">ปี พ.ศ.<input type="number" min="2500" max="3000" value={billingYear} onChange={(event) => { setBillingYear(Number(event.target.value)); clearRoster(); }} className="mt-1 w-full rounded-sm border border-slate-300 px-3 py-2 text-sm tabular-nums" /></label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-4 py-3"><p className="text-pretty text-xs text-slate-600">รายการที่เลือก: <span className="font-bold text-slate-900">{currentPlan?.name || '-'}</span> · <span className="font-bold">{Number(currentPlan?.amount || 0).toLocaleString()} บาท/วิชา</span></p><button onClick={openRoster} disabled={loading || !feePlanId} className="inline-flex items-center gap-2 rounded-sm bg-sky-700 px-4 py-2 text-sm font-bold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"><HiOutlineUsers size={18} /> {loading ? 'กำลังเปิดรายชื่อ...' : 'ดึงรายชื่อจากเดือนก่อน'}</button></div>
    </section>
    {message && <div role={message.tone === 'error' ? 'alert' : 'status'} className={`border px-4 py-3 text-sm ${message.tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>{message.text}</div>}
    {roster ? <section className="overflow-hidden rounded-sm border border-sky-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-100 bg-sky-50 px-4 py-3"><div><h2 className="text-balance font-bold text-sky-900">รายชื่อ {roster.roster.fee_plan_name} ประจำ{thaiMonths[roster.roster.billing_month - 1]} {roster.roster.billing_year}</h2><p className="text-pretty mt-0.5 text-xs text-slate-600">มีนักเรียน <span className="font-bold tabular-nums">{activeMembers.length}</span> คน · คิดค่าบริการ <span className="font-bold">{Number(roster.roster.amount).toLocaleString()} บาทต่อวิชา/คน</span></p></div><button type="button" onClick={openPicker} className="inline-flex items-center gap-2 rounded-sm border border-sky-300 bg-white px-3 py-2 text-sm font-bold text-sky-800 hover:bg-sky-50"><HiOutlinePlus size={18} /> เพิ่มรายชื่อจากทะเบียน</button></div>
      {activeMembers.length ? <div className="overflow-x-auto"><table className="w-full min-w-[860px] border-collapse text-[13px]"><thead className="bg-slate-100 text-slate-700"><tr><th className="border-b border-slate-200 px-3 py-2 text-left">รหัสนักเรียน</th><th className="border-b border-slate-200 px-3 py-2 text-left">ชื่อ–นามสกุล</th><th className="border-b border-slate-200 px-3 py-2 text-left">ชั้น/ห้อง</th><th className="border-b border-slate-200 px-3 py-2 text-left">วิชาเรียนพิเศษ</th><th className="border-b border-slate-200 px-3 py-2 text-right">ยอดต่อเดือน</th><th className="border-b border-slate-200 px-3 py-2 text-center">สถานะบิล</th><th className="border-b border-slate-200 px-3 py-2 text-center">จัดการ</th></tr></thead><tbody>{activeMembers.map((member) => {
        const billExists = Boolean(member.student_fee_id); const selected = (member.course_codes?.length ? member.course_codes : ['basic']) as CourseCode[];
        return <tr key={member.student_id} className="hover:bg-sky-50/50"><td className="border-b border-slate-100 px-3 py-2 font-mono text-xs">{member.student_code}</td><td className="border-b border-slate-100 px-3 py-2 font-semibold">{member.first_name} {member.last_name}</td><td className="border-b border-slate-100 px-3 py-2">{member.grade_name || '-'} / {member.room_number || '-'}</td><td className="border-b border-slate-100 px-3 py-2">{courseLabels(selected)}</td><td className="border-b border-slate-100 px-3 py-2 text-right font-semibold tabular-nums">{(Number(roster.roster.amount) * selected.length).toLocaleString()} บาท</td><td className="border-b border-slate-100 px-3 py-2 text-center">{billExists ? <span className="rounded-sm bg-emerald-100 px-2 py-1 text-[11px] font-bold text-emerald-700">มีบิลแล้ว</span> : <span className="rounded-sm bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-700">ยังไม่สร้างบิล</span>}</td><td className="border-b border-slate-100 px-3 py-2 text-center"><button type="button" onClick={() => void removeMember(member)} disabled={billExists || savingStudentId === member.student_id} className="rounded-sm border border-rose-300 bg-white px-2 py-1 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50">{billExists ? 'ล็อกหลังสร้างบิล' : 'นำออก'}</button></td></tr>;
      })}</tbody></table></div> : <div className="px-4 py-10 text-center"><HiOutlineUsers className="mx-auto text-slate-300" size={34} /><p className="mt-3 text-pretty text-sm font-semibold text-slate-600">ยังไม่มีนักเรียนในรายชื่อของรอบนี้</p><button type="button" onClick={openPicker} className="mt-3 text-sm font-bold text-sky-700 hover:text-sky-800">เพิ่มรายชื่อจากทะเบียน</button></div>}
    </section> : <section className="border border-dashed border-slate-300 bg-white px-4 py-8 text-center"><HiOutlineUsers className="mx-auto text-slate-300" size={34} /><p className="mt-3 text-pretty text-sm font-semibold text-slate-700">เลือกรอบ แล้วกด “ดึงรายชื่อจากเดือนก่อน”</p><p className="mt-1 text-pretty text-xs text-slate-500">หากไม่มีข้อมูลเดือนก่อน ระบบจะเปิดรายชื่อว่างเพื่อให้เพิ่มจากทะเบียนนักเรียน</p></section>}
    <Modal isOpen={isPickerOpen} onClose={() => setIsPickerOpen(false)} title="เพิ่มนักเรียนจากทะเบียน" size="xl"><div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-3"><div><p className="text-pretty text-sm font-semibold text-slate-800">ติ๊กวิชาที่นักเรียนเรียน: พื้นฐาน, STEAM หรือทั้งสองวิชา</p><p className="text-pretty mt-1 text-xs text-slate-500">{Number(roster?.roster.amount || 0).toLocaleString()} บาทต่อวิชา/เดือน · เลือกสองวิชา ระบบคิด 2 หน่วย</p></div><label className="relative block"><span className="sr-only">ค้นหานักเรียน</span><HiOutlineMagnifyingGlass className="absolute left-2 top-2.5 text-slate-400" size={16} /><input value={pickerSearch} onChange={(event) => setPickerSearch(event.target.value)} placeholder="ค้นหารหัสหรือชื่อ" className="w-60 rounded-sm border border-slate-300 py-2 pl-8 pr-3 text-xs" /></label></div>
      <div className="max-h-[420px] overflow-auto border border-slate-200"><table className="w-full min-w-[700px] text-left text-sm"><thead className="sticky top-0 bg-slate-100 text-xs text-slate-700"><tr><th className="px-3 py-2">รหัสนักเรียน</th><th className="px-3 py-2">ชื่อ–นามสกุล</th><th className="px-3 py-2 text-center">พื้นฐาน</th><th className="px-3 py-2 text-center">STEAM</th><th className="px-3 py-2 text-center">สถานะ</th></tr></thead><tbody className="divide-y divide-slate-200">{registryLoading ? <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-500">กำลังดึงรายชื่อจากทะเบียนนักเรียน...</td></tr> : visibleStudents.map((student) => {
        const member = roster?.members.find((item) => item.student_id === student.id); const locked = Boolean(member?.student_fee_id); const existing = Boolean(member?.is_active); const selected = selectedCourses[student.id] || [];
        return <tr key={student.id} className={existing ? 'bg-slate-50 text-slate-500' : 'bg-white'}><td className="px-3 py-2 font-mono text-xs">{student.student_id}</td><td className="px-3 py-2 font-semibold">{student.first_name} {student.last_name}</td>{courses.map((course) => <td key={course.code} className="px-3 py-2 text-center"><label className="inline-flex items-center"><span className="sr-only">{course.label} สำหรับ {student.first_name} {student.last_name}</span><input type="checkbox" checked={selected.includes(course.code)} disabled={existing || locked} onChange={() => toggleCourse(student.id, course.code)} className="size-4 border-slate-300 text-sky-600 focus:ring-sky-500 disabled:cursor-not-allowed" /></label></td>)}<td className="px-3 py-2 text-center text-xs font-semibold">{locked ? 'มีบิลแล้ว' : existing ? 'อยู่ในรายชื่อแล้ว' : selected.length ? courseLabels(selected) : '-'}</td></tr>;
      })}</tbody></table></div>
      <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-slate-600">เลือกเพิ่ม <span className="font-bold tabular-nums text-slate-900">{selectedStudents.length}</span> คน</p><div className="flex gap-2"><button type="button" onClick={() => setIsPickerOpen(false)} className="border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">ยกเลิก</button><button type="button" onClick={() => void addSelected()} disabled={!selectedStudents.length || savingSelections} className="bg-sky-700 px-3 py-2 text-sm font-bold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-300">{savingSelections ? 'กำลังเพิ่ม...' : `เพิ่มรายชื่อที่เลือก ${selectedStudents.length} คน`}</button></div></div>
    </div></Modal>
  </div>;
}
