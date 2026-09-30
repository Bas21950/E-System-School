'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Header from '@/components/layout/Header';
import { api } from '@/lib/api';
import { useFinance } from '@/modules/finance/hooks/useFinance';
import { useStudents } from '@/modules/students/hooks/useStudents';
import type { FeePlan, MonthlyBillingPreview } from '@/modules/finance/types/finance';
import { HiOutlineMagnifyingGlass, HiOutlinePlus, HiOutlineReceiptPercent } from 'react-icons/hi2';

type AcademicYear = { id: string; year: string; is_current?: boolean };
type Semester = { id: string; academic_year_id: string; semester: string };

const thaiMonths = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

function toThaiYear(date = new Date()) {
  return date.getFullYear() + 543;
}

export default function MonthlyBillingPage() {
  const {
    fetchFeePlans,
    prepareMonthlyBillingRoster,
    updateMonthlyBillingRosterMember,
    previewMonthlyBilling,
    postMonthlyBilling,
  } = useFinance();
  const [feePlans, setFeePlans] = useState<FeePlan[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [feePlanId, setFeePlanId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [billingMonth, setBillingMonth] = useState(new Date().getMonth() + 1);
  const [billingYear, setBillingYear] = useState(toThaiYear());
  const [dueDate, setDueDate] = useState('');
  const [preview, setPreview] = useState<MonthlyBillingPreview | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const { students: searchedStudents } = useStudents({ search: studentSearch, limit: 10 });

  const currentPlan = feePlans.find((plan) => plan.id === feePlanId);
  const visibleSemesters = semesters.filter((semester) => semester.academic_year_id === academicYearId);
  const activeMembers = useMemo(
    () => (preview?.members || []).filter((member) => member.is_active),
    [preview]
  );

  const loadInitialData = useCallback(async () => {
    try {
      const [plans, years, semesterData] = await Promise.all([
        fetchFeePlans(),
        api.get<{ data: AcademicYear[] }>('/academic-years'),
        api.get<{ data: Semester[] }>('/semesters'),
      ]);
      setFeePlans(plans.filter((plan) => plan.billing_cycle === 'monthly'));
      const resolvedYears = years.data || [];
      setAcademicYears(resolvedYears);
      setSemesters(semesterData.data || []);
      const monthlyPlan = plans.find((plan) => plan.billing_cycle === 'monthly');
      const currentYear = resolvedYears.find((year) => year.is_current) || resolvedYears[0];
      setFeePlanId((current) => current || monthlyPlan?.id || '');
      setAcademicYearId((current) => current || currentYear?.id || '');
    } catch (error) {
      setMessage({ tone: 'error', text: error instanceof Error ? error.message : 'โหลดข้อมูลตั้งต้นไม่สำเร็จ' });
    }
  }, [fetchFeePlans]);

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (semesterId && !visibleSemesters.some((semester) => semester.id === semesterId)) {
      setSemesterId('');
    }
  }, [semesterId, visibleSemesters]);

  const requestInput = useCallback(() => ({
    feePlanId,
    academicYearId: academicYearId || null,
    semesterId: semesterId || null,
    billingMonth,
    billingYear,
  }), [academicYearId, billingMonth, billingYear, feePlanId, semesterId]);

  const refreshPreview = useCallback(async () => {
    if (!feePlanId) return;
    setLoading(true);
    setMessage(null);
    try {
      const data = await previewMonthlyBilling(requestInput());
      setPreview(data);
      setSelectedIds(new Set(data.members.filter((member) => member.is_active && !member.student_fee_id).map((member) => member.student_id)));
    } catch (error) {
      setPreview(null);
      setMessage({ tone: 'error', text: error instanceof Error ? error.message : 'ตรวจสอบรอบบิลไม่สำเร็จ' });
    } finally {
      setLoading(false);
    }
  }, [feePlanId, previewMonthlyBilling, requestInput]);

  const prepareRoster = async () => {
    if (!feePlanId) {
      setMessage({ tone: 'error', text: 'กรุณาเลือกรายการค่าใช้จ่ายรายเดือน' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      await prepareMonthlyBillingRoster(requestInput());
      await refreshPreview();
      setMessage({ tone: 'success', text: 'เตรียมรายชื่อสำหรับรอบนี้แล้ว กรุณาตรวจสอบก่อนสร้างบิล' });
    } catch (error) {
      setMessage({ tone: 'error', text: error instanceof Error ? error.message : 'เตรียมรายชื่อไม่สำเร็จ' });
    } finally {
      setLoading(false);
    }
  };

  const setMemberActive = async (studentId: string, isActive: boolean) => {
    if (!feePlanId) return;
    try {
      await updateMonthlyBillingRosterMember(studentId, { ...requestInput(), isActive });
      await refreshPreview();
    } catch (error) {
      setMessage({ tone: 'error', text: error instanceof Error ? error.message : 'แก้ไขรายชื่อไม่สำเร็จ' });
    }
  };

  const submitBilling = async () => {
    if (!preview || selectedIds.size === 0) {
      setMessage({ tone: 'error', text: 'กรุณาเลือกรายการที่ต้องการสร้างบิลอย่างน้อย 1 รายการ' });
      return;
    }
    const selectedMembers = activeMembers.filter((member) => selectedIds.has(member.student_id) && !member.student_fee_id);
    if (selectedMembers.length === 0) {
      setMessage({ tone: 'error', text: 'รายการที่เลือกมีบิลแล้วทั้งหมด' });
      return;
    }
    const gross = selectedMembers.reduce(
      (sum, member) => sum + Number(preview.roster.amount) * Math.max(member.course_codes?.length || 0, 1),
      0
    );
    if (!window.confirm(`ยืนยันสร้างบิล ${selectedMembers.length} รายการ สำหรับ${thaiMonths[billingMonth - 1]} ${billingYear} ยอดก่อนส่วนลด ${gross.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท`)) {
      return;
    }
    setPosting(true);
    setMessage(null);
    try {
      const idempotencyKey = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;
      const result = await postMonthlyBilling({
        ...requestInput(),
        dueDate: dueDate || null,
        idempotencyKey,
        studentIds: selectedMembers.map((member) => member.student_id),
      });
      await refreshPreview();
      setMessage({
        tone: 'success',
        text: result.idempotent_replay
          ? 'คำขอเดิมได้รับการประมวลผลแล้ว ระบบไม่ได้สร้างบิลซ้ำ'
          : `สร้างบิลสำเร็จ ${result.created_count} รายการ มีบิลเดิม ${result.existing_count} รายการ ยอดสุทธิ ${Number(result.total_amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท`,
      });
    } catch (error) {
      setMessage({ tone: 'error', text: error instanceof Error ? error.message : 'สร้างบิลไม่สำเร็จ' });
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <Header
        title="สร้างบิลค่าใช้จ่ายรายเดือน"
        subtitle="เตรียมรายชื่อ ตรวจสอบ และยืนยันสร้างบิลหลายคนในครั้งเดียว โดยไม่สร้างรายการเดิมซ้ำ"
      />

      <section className="rounded-sm border border-sky-200 bg-white shadow-sm">
        <div className="border-b border-sky-100 bg-sky-600 px-4 py-2 text-sm font-bold text-white">เงื่อนไขรอบบิล</div>
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-6">
          <label className="text-xs font-bold text-slate-700 xl:col-span-2">รายการค่าใช้จ่ายรายเดือน
            <select value={feePlanId} onChange={(event) => setFeePlanId(event.target.value)} className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm">
              <option value="">เลือกรายการ</option>
              {feePlans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} — {Number(plan.amount).toLocaleString()} บาท</option>)}
            </select>
          </label>
          <label className="text-xs font-bold text-slate-700">ปีการศึกษา
            <select value={academicYearId} onChange={(event) => setAcademicYearId(event.target.value)} className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm">
              <option value="">ไม่ระบุ</option>
              {academicYears.map((year) => <option key={year.id} value={year.id}>{year.year}{year.is_current ? ' (ปัจจุบัน)' : ''}</option>)}
            </select>
          </label>
          <label className="text-xs font-bold text-slate-700">ภาคเรียน
            <select value={semesterId} onChange={(event) => setSemesterId(event.target.value)} className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm">
              <option value="">ไม่ระบุ</option>
              {visibleSemesters.map((semester) => <option key={semester.id} value={semester.id}>ภาคเรียน {semester.semester}</option>)}
            </select>
          </label>
          <label className="text-xs font-bold text-slate-700">เดือน
            <select value={billingMonth} onChange={(event) => setBillingMonth(Number(event.target.value))} className="mt-1 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm">
              {thaiMonths.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}
            </select>
          </label>
          <label className="text-xs font-bold text-slate-700">ปี พ.ศ.
            <input type="number" min="2500" max="3000" value={billingYear} onChange={(event) => setBillingYear(Number(event.target.value))} className="mt-1 w-full rounded-sm border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-bold text-slate-700">ครบกำหนดชำระ
            <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="mt-1 w-full rounded-sm border border-slate-300 px-3 py-2 text-sm" />
          </label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-4 py-3">
          <div className="text-xs text-slate-600">รายการที่เลือก: <span className="font-bold text-slate-900">{currentPlan?.name || '-'}</span></div>
          <div className="flex gap-2">
            <button onClick={prepareRoster} disabled={loading || !feePlanId} className="rounded-sm border border-sky-300 bg-white px-3 py-2 text-xs font-bold text-sky-800 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? 'กำลังโหลด...' : 'เตรียมรายชื่อ / ยกจากเดือนก่อน'}
            </button>
            <button onClick={refreshPreview} disabled={loading || !feePlanId} className="rounded-sm bg-sky-700 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
              ตรวจสอบบิลรอบนี้
            </button>
          </div>
        </div>
      </section>

      {message && (
        <div className={`rounded-sm border px-4 py-3 text-sm ${message.tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
          {message.text}
        </div>
      )}

      {preview && (
        <>
          <section className="grid gap-3 md:grid-cols-4">
            {[
              ['ผู้เรียนในรอบนี้', preview.summary.students],
              ['รอสร้างบิล', preview.summary.pending_count],
              ['มีบิลแล้ว', preview.summary.existing_count],
              ['ยอดก่อนส่วนลด', `${Number(preview.summary.gross_amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท`],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-sm border border-sky-200 bg-white px-4 py-3 shadow-sm">
                <div className="text-[11px] font-bold text-slate-500">{label}</div>
                <div className="mt-1 text-xl font-black text-sky-800">{value}</div>
              </div>
            ))}
          </section>

          <section id="roster" className="scroll-mt-4 overflow-hidden rounded-sm border border-sky-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-100 bg-sky-50 px-4 py-3">
              <div>
                <div className="font-bold text-sky-900">รายชื่อเรียนพิเศษประจำ{thaiMonths[billingMonth - 1]} {billingYear}</div>
                <div className="mt-0.5 text-xs text-slate-600">ตารางนี้เป็นรายชื่อของเดือนนี้ การแก้ไขจะไม่กระทบเดือนก่อน</div>
              </div>
              <label className="relative block">
                <HiOutlineMagnifyingGlass className="absolute left-2 top-2.5 text-slate-400" size={16} />
                <input value={studentSearch} onChange={(event) => setStudentSearch(event.target.value)} placeholder="ค้นหาเพื่อเพิ่มนักเรียน" className="w-56 rounded-sm border border-slate-300 py-2 pl-8 pr-3 text-xs" />
              </label>
            </div>
            {studentSearch && (
              <div className="border-b border-slate-200 bg-amber-50 px-4 py-2 text-xs text-slate-700">
                {searchedStudents.length === 0 ? 'ไม่พบรายชื่อนักเรียน' : searchedStudents.map((student) => (
                  <button key={student.id} onClick={() => void setMemberActive(student.id, true)} className="mr-2 inline-flex items-center gap-1 rounded-sm border border-amber-200 bg-white px-2 py-1 font-semibold hover:bg-amber-100">
                    <HiOutlinePlus size={14} /> {student.student_id} {student.first_name} {student.last_name}
                  </button>
                ))}
              </div>
            )}
            <div className="max-h-[520px] overflow-auto">
              <table className="w-full min-w-[930px] border-collapse text-[13px]">
                <thead className="sticky top-0 z-10 bg-slate-100 text-slate-700">
                  <tr>
                    <th className="border-b border-slate-200 px-3 py-2 text-center"><input type="checkbox" checked={activeMembers.length > 0 && activeMembers.filter((member) => !member.student_fee_id).every((member) => selectedIds.has(member.student_id))} onChange={(event) => setSelectedIds(event.target.checked ? new Set(activeMembers.filter((member) => !member.student_fee_id).map((member) => member.student_id)) : new Set())} /></th>
                    <th className="border-b border-slate-200 px-3 py-2 text-left">รหัสนักเรียน</th>
                    <th className="border-b border-slate-200 px-3 py-2 text-left">ชื่อ–นามสกุล</th>
                    <th className="border-b border-slate-200 px-3 py-2 text-left">ชั้น/ห้อง</th>
                    <th className="border-b border-slate-200 px-3 py-2 text-right">ยอดบิล</th>
                    <th className="border-b border-slate-200 px-3 py-2 text-center">สถานะบิล</th>
                    <th className="border-b border-slate-200 px-3 py-2 text-center">อยู่ในรายชื่อ</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.members.map((member) => {
                    const billExists = Boolean(member.student_fee_id);
                    return (
                      <tr key={member.student_id} className={!member.is_active ? 'bg-slate-50 text-slate-400' : 'hover:bg-sky-50/50'}>
                        <td className="border-b border-slate-100 px-3 py-2 text-center"><input type="checkbox" disabled={!member.is_active || billExists} checked={selectedIds.has(member.student_id)} onChange={(event) => setSelectedIds((current) => { const next = new Set(current); if (event.target.checked) next.add(member.student_id); else next.delete(member.student_id); return next; })} /></td>
                        <td className="border-b border-slate-100 px-3 py-2 font-mono text-xs">{member.student_code}</td>
                        <td className="border-b border-slate-100 px-3 py-2 font-semibold">{member.first_name} {member.last_name}</td>
                        <td className="border-b border-slate-100 px-3 py-2">{member.grade_name || '-'} / {member.room_number || '-'}</td>
                        <td className="border-b border-slate-100 px-3 py-2 text-right font-bold">{Number(member.student_fee_amount ?? Number(preview.roster.amount) * Math.max(member.course_codes?.length || 0, 1)).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                        <td className="border-b border-slate-100 px-3 py-2 text-center">{billExists ? <span className="rounded-sm bg-emerald-100 px-2 py-1 text-[11px] font-bold text-emerald-700">สร้างแล้ว</span> : <span className="rounded-sm bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-700">รอสร้าง</span>}</td>
                        <td className="border-b border-slate-100 px-3 py-2 text-center"><button onClick={() => void setMemberActive(member.student_id, !member.is_active)} disabled={billExists} className={`rounded-sm border px-2 py-1 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50 ${member.is_active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-300 bg-white text-slate-500'}`}>{member.is_active ? 'อยู่ในรายชื่อ' : 'นำกลับเข้ารายชื่อ'}</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs text-slate-700">เลือกสร้าง <span className="font-bold">{selectedIds.size}</span> รายการ · ยอดก่อนส่วนลด <span className="font-bold">{activeMembers.filter((member) => selectedIds.has(member.student_id) && !member.student_fee_id).reduce((sum, member) => sum + Number(preview.roster.amount) * Math.max(member.course_codes?.length || 0, 1), 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span> บาท</div>
              <button onClick={submitBilling} disabled={posting || selectedIds.size === 0} className="inline-flex items-center gap-2 rounded-sm bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"><HiOutlineReceiptPercent size={18} />{posting ? 'กำลังสร้างบิล...' : 'ยืนยันสร้างบิลที่เลือก'}</button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
