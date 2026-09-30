'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { 
  HiOutlineArrowLeft, 
  HiOutlinePlus, 
  HiOutlineBanknotes,
  HiOutlineEye,
} from 'react-icons/hi2';
import { useFinance } from '@/modules/finance/hooks/useFinance';
import { api, buildApiUrl } from '@/lib/api';
import { Student } from '@/modules/students/types/student';
import { StudentFee, FeePlan, AcademicYear, Semester, Payment } from '@/modules/finance/types/finance';
import Modal from '@/components/ui/Modal';

function remainingBalance(fee: StudentFee) {
  return Math.max(
    Number(fee.total_amount) - Number(fee.discount_amount || 0) - Number(fee.paid_amount || 0),
    0
  );
}

function createIdempotencyKey() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

export default function StudentFinanceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.studentId as string;

  const { 
    fetchStudentFees, processPayment, loading: financeLoading, 
    fetchFeePlans, createIndividualFee, 
    updateStudentFee,
    uploadTransferSlip, fetchPaymentMethods
  } = useFinance();
  
  const [student, setStudent] = useState<Student | null>(null);
  const [fees, setFees] = useState<StudentFee[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [feePlans, setFeePlans] = useState<FeePlan[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isAddFeeModalOpen, setIsAddFeeModalOpen] = useState(false);
  const [isEditFeeModalOpen, setIsEditFeeModalOpen] = useState(false);

  // Payment Form State
  const [paymentMethods, setPaymentMethods] = useState<{ id: string; name: string; code: string; is_active: boolean }[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [payAmounts, setPayAmounts] = useState<Record<string, string>>({});
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentIdempotencyKey, setPaymentIdempotencyKey] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Add Fee Form State
  const [individualPlan, setIndividualPlan] = useState('');
  const [individualAmount, setIndividualAmount] = useState('');
  const [processingFee, setProcessingFee] = useState(false);
  const [feeSource, setFeeSource] = useState<'system' | 'legacy'>('system');
  const [targetYear, setTargetYear] = useState('');
  const [targetSemester, setTargetSemester] = useState('');
  const [billingMonth, setBillingMonth] = useState('');
  const [billingYear, setBillingYear] = useState('');
  const [academicTermOptions, setAcademicTermOptions] = useState<{ years: AcademicYear[], semesters: Semester[] }>({ years: [], semesters: [] });

  // Edit Fee State
  const [editingFee, setEditingFee] = useState<StudentFee | null>(null);
  const [editAmount, setEditAmount] = useState('');

  const loadData = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
      try {
        // Fetch Student
        const stRes = await api.get<{ data: Student }>(`/students/${studentId}`);
        if (stRes.data) setStudent(stRes.data);

      // Fetch Fees
      const feesData = await fetchStudentFees(studentId);
      setFees(feesData);

      const paymentsRes = await api.get<{ data: Payment[] }>(`/finance/students/${studentId}/payments`);
      setPayments(paymentsRes.data || []);

      // Init payment amounts
      const initialAmounts: Record<string, string> = {};
      feesData.forEach(f => {
        if (f.status !== 'paid') {
          initialAmounts[f.id] = String(remainingBalance(f));
        }
      });
      setPayAmounts(initialAmounts);

      const [plans, methodsData] = await Promise.all([
        fetchFeePlans(),
        fetchPaymentMethods()
      ]);
      setFeePlans(plans);
      const activeMethods = methodsData.filter(m => m.is_active);
      setPaymentMethods(activeMethods);
      setPaymentMethod(current => activeMethods.some(method => method.code === current)
        ? current
        : activeMethods[0]?.code || 'cash');

      // Fetch terms for legacy selection
      const [yearsRes, semRes] = await Promise.all([
        api.get<{ data: AcademicYear[] }>('/academic-years'),
        api.get<{ data: Semester[] }>('/semesters')
      ]);
      setAcademicTermOptions({ years: yearsRes.data || [], semesters: semRes.data || [] });

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [studentId, fetchStudentFees, fetchFeePlans, fetchPaymentMethods]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle plan selection in add fee modal
  useEffect(() => {
    if (individualPlan) {
      const plan = feePlans.find(p => p.id === individualPlan);
      if (plan) setIndividualAmount(String(plan.amount));
    }
  }, [individualPlan, feePlans]);

  // Payment total
  const totalToPay = Object.values(payAmounts).reduce((sum, val) => sum + (Number(val) || 0), 0);
  const totalOutstanding = fees.reduce((sum, fee) => sum + (fee.status !== 'paid' ? remainingBalance(fee) : 0), 0);

  const handlePayment = async () => {
    if (!student || totalToPay <= 0 || isPaying) return;
    setPaymentError(null);
    setIsPaying(true);
    
    const items = Object.entries(payAmounts)
      .filter(([, amount]) => Number(amount) > 0)
      .map(([id, amount]) => ({
        student_fee_id: id,
        amount: Number(amount)
      }));

    const idempotencyKey = paymentIdempotencyKey || createIdempotencyKey();
    setPaymentIdempotencyKey(idempotencyKey);
    try {
      const result = await processPayment({
        student_id: student.id,
        payment_method: paymentMethod as 'cash' | 'transfer' | 'qr',
        payment_date: new Date().toISOString().split('T')[0],
        idempotency_key: idempotencyKey,
        items
      });

      // Upload slip if transfer and file attached
      if (paymentMethod === 'transfer' && slipFile) {
        try {
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve) => {
            reader.onload = () => {
              const base64 = (reader.result as string).split(',')[1];
              resolve(base64);
            };
            reader.readAsDataURL(slipFile);
          });
          const slipBase64 = await base64Promise;
          await uploadTransferSlip(result.id, slipBase64, slipFile.type);
        } catch (slipErr) {
          console.error('Slip upload failed (non-blocking):', slipErr);
        }
      }

      alert('ชำระเงินสำเร็จ! เลขที่ใบเสร็จ: ' + result.receipt_no);
      setIsPayModalOpen(false);
      setSlipFile(null);
      setPaymentIdempotencyKey('');
      loadData();
    } catch (err: unknown) {
      setPaymentError(err instanceof Error ? err.message : 'ไม่สามารถบันทึกการรับชำระเงินได้');
    } finally {
      setIsPaying(false);
    }
  };

  const handleAddFee = async () => {
    if (!student || !individualPlan || !individualAmount) return;
    setProcessingFee(true);
    try {
      await createIndividualFee(
        student.id, individualPlan, Number(individualAmount), 
        feeSource, targetSemester || null, targetYear || null,
        billingMonth ? Number(billingMonth) : null,
        billingYear ? Number(billingYear) : null
      );
      setIsAddFeeModalOpen(false);
      setIndividualPlan('');
      setIndividualAmount('');
      setFeeSource('system');
      loadData(); // Refresh fees
    } catch (err: unknown) {
      alert('เกิดข้อผิดพลาด: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setProcessingFee(false);
    }
  };

  const handleUpdateFee = async () => {
    if (!editingFee || !editAmount) return;
    setProcessingFee(true);
    try {
      await updateStudentFee(editingFee.id, Number(editAmount));
      setIsEditFeeModalOpen(false);
      setEditingFee(null);
      setEditAmount('');
      loadData();
    } catch (err: unknown) {
      alert('เกิดข้อผิดพลาด: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setProcessingFee(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="flex animate-pulse items-center gap-4">
          <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
          <div className="h-8 bg-gray-200 rounded w-64"></div>
        </div>
        <div className="glass-card h-[400px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (!student) {
    return <div>ไม่พบข้อมูลนักเรียน</div>;
  }

  const formatBillingPeriod = (fee: {
    billing_month?: number | null;
    billing_year?: number | null;
    semester_info?: { semester: string };
    academic_year_info?: { year: string };
  } | null | undefined) => {
    if (!fee) return '-';
    if (fee.billing_month && fee.billing_year) {
      const months = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
      ];
      return `เดือน ${months[fee.billing_month - 1]} ${fee.billing_year}`;
    }
    if (fee.semester_info && fee.academic_year_info) {
      return `เทอม ${fee.semester_info.semester} / ${fee.academic_year_info.year}`;
    }
    if (fee.academic_year_info) {
      return `ปีการศึกษา ${fee.academic_year_info.year}`;
    }
    
    return '-';
  };

  const currentEnrollment = student.enrollment_history?.[0];

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => router.back()}
          className="rounded-sm border border-slate-300 bg-white p-2 text-slate-500 transition-all hover:border-sky-400 hover:text-sky-700"
        >
          <HiOutlineArrowLeft size={20} />
        </button>
        <Header 
          title="รายละเอียดการชำระเงิน" 
          subtitle="ประวัติการเรียกเก็บและรับชำระเงินของนักเรียนรายบุคคล"
          className="!mb-0"
        />
      </div>

      <div className="space-y-3">
        <div className="overflow-hidden rounded-sm border border-sky-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-sky-100 bg-gradient-to-b from-sky-500 to-sky-600 px-4 py-3 text-white lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xl font-bold">
                {student.first_name} {student.last_name}
              </div>
              <div className="mt-1 text-sm text-sky-50">
                รหัสนักเรียน {student.student_id}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setPaymentIdempotencyKey(createIdempotencyKey());
                  setPaymentError(null);
                  setIsPayModalOpen(true);
                }}
                disabled={totalOutstanding <= 0}
                className="inline-flex items-center justify-center gap-2 rounded-sm border border-white/20 bg-white px-4 py-2 text-sm font-bold text-sky-800 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <HiOutlineBanknotes size={18} /> รับชำระเงิน
              </button>
              <button
                onClick={() => setIsAddFeeModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-sm border border-white/30 bg-sky-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-sky-800"
              >
                <HiOutlinePlus size={18} /> เพิ่มยอดชำระ
              </button>
            </div>
          </div>

          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <tbody>
                  <tr>
                    <td className="w-36 border border-slate-200 bg-slate-50 px-3 py-2 font-bold text-slate-600">ระดับชั้น</td>
                    <td className="border border-slate-200 px-3 py-2 font-semibold text-slate-900">{currentEnrollment?.room_info?.grade_info?.name || '-'}</td>
                    <td className="w-36 border border-slate-200 bg-slate-50 px-3 py-2 font-bold text-slate-600">ห้องเรียน</td>
                    <td className="border border-slate-200 px-3 py-2 font-semibold text-slate-900">{currentEnrollment?.room_info?.room_number || '-'}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 bg-slate-50 px-3 py-2 font-bold text-slate-600">ปีการศึกษา</td>
                    <td className="border border-slate-200 px-3 py-2 font-semibold text-slate-900">{currentEnrollment?.academic_year_info?.year || '-'}</td>
                    <td className="border border-slate-200 bg-slate-50 px-3 py-2 font-bold text-slate-600">สถานะ</td>
                    <td className="border border-slate-200 px-3 py-2">
                      <span className={`inline-flex rounded-sm px-2 py-1 text-xs font-bold ${
                        student.status === 'กำลังศึกษาอยู่' || currentEnrollment?.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {currentEnrollment?.status === 'active' ? 'กำลังศึกษาอยู่' : (currentEnrollment?.status || student.status)}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className={`border-l border-slate-200 px-4 py-4 ${totalOutstanding > 0 ? 'bg-rose-50' : 'bg-emerald-50'}`}>
              <div className={`text-xs font-bold ${totalOutstanding > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                ยอดคงเหลือรวมทุกประเภท
              </div>
              <div className={`mt-2 text-4xl font-black ${totalOutstanding > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {totalOutstanding.toLocaleString()}
              </div>
              <div className="mt-1 text-xs text-slate-500">บาท</div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-sm border border-sky-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-sky-100 bg-sky-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-bold text-sky-900">รายการค่าใช้จ่ายทั้งหมด</h3>
              <span className="rounded-sm border border-sky-200 bg-white px-2 py-0.5 text-xs text-slate-500">{fees.length} รายการ</span>
            </div>
          </div>

          {fees.length > 0 ? (
            <table className="w-full border-collapse text-xs">
              <thead className="border-b border-slate-200 bg-slate-100 text-slate-700">
                <tr>
                  <th className="border border-slate-200 px-3 py-2 text-left font-bold">รายการ</th>
                  <th className="border border-slate-200 px-3 py-2 text-left font-bold w-40">งวด / ภาคเรียน</th>
              <th className="border border-slate-200 px-3 py-2 text-right font-bold w-28">จำนวนเงิน</th>
              <th className="border border-slate-200 px-3 py-2 text-right font-bold text-emerald-700 w-28">ชำระแล้ว</th>
              <th className="border border-slate-200 px-3 py-2 text-right font-bold text-rose-600 w-28 whitespace-nowrap">ยอดคงเหลือ</th>
              <th className="border border-slate-200 px-3 py-2 text-center font-bold w-28">สถานะ</th>
                  <th className="border border-slate-200 px-3 py-2 text-center font-bold w-24">เอกสาร</th>
                </tr>
              </thead>
              <tbody>
                {fees.map(f => (
                  <tr key={f.id} className="hover:bg-sky-50/50">
                    <td className="border border-slate-200 px-3 py-2.5 align-top">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-slate-900">{f.fee_plan_info?.name}</div>
                        {f.source === 'legacy' && (
                          <span className="rounded-sm border border-amber-200 bg-amber-100 px-1.5 py-0.5 text-[9px] font-black uppercase text-amber-700">Legacy</span>
                        )}
                      </div>
                      <div className="mt-1 font-mono text-[10px] text-slate-400">Ref: {f.id.split('-')[0]}</div>
                    </td>
                    <td className="border border-slate-200 px-3 py-2.5 text-left align-top">
                      <div className="text-[11px] font-bold text-slate-600">{formatBillingPeriod(f)}</div>
                    </td>
                    <td className="border border-slate-200 px-3 py-2.5 text-right font-bold text-slate-700">{Number(f.total_amount).toLocaleString()}</td>
                    <td className="border border-slate-200 px-3 py-2.5 text-right font-bold text-emerald-600">{(f.paid_amount || 0).toLocaleString()}</td>
                    <td className="border border-slate-200 px-3 py-2.5 text-right font-black text-rose-500 whitespace-nowrap">
                      {remainingBalance(f).toLocaleString()}
                    </td>
                    <td className="border border-slate-200 px-3 py-2.5 text-center">
                      {f.status === 'paid' ? (
                        <span className="inline-flex w-full items-center justify-center rounded-sm border border-emerald-100 bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                          ชำระแล้ว
                        </span>
                      ) : f.status === 'unpaid' ? (
                        <span className="inline-flex w-full items-center justify-center rounded-sm border border-rose-100 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-600">
                          ค้างชำระ
                        </span>
                      ) : (
                        <span className="inline-flex w-full items-center justify-center rounded-sm border border-amber-100 bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-600">
                          จ่ายบางส่วน
                        </span>
                      )}
                    </td>
                    <td className="border border-slate-200 px-3 py-2.5 text-center">
                      <div className="flex justify-center gap-1">
                        {f.status === 'paid' ? (() => {
                          const payment = payments.find((p) => p.items?.some((item) => item.student_fee_id === f.id));
                          return payment ? (
                            <a
                              href={buildApiUrl(`/finance/receipts/${payment.id}/pdf`)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center gap-1 rounded-sm border border-sky-200 bg-sky-50 px-2 py-1 text-[11px] font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-100"
                              title="ดูใบเสร็จ"
                            >
                              <HiOutlineEye size={14} />
                              PDF
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-300">-</span>
                          );
                        })() : (
                          <span className="text-[10px] text-slate-300">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-16 text-center text-slate-500">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-slate-300 bg-slate-50">
                <HiOutlineBanknotes size={32} className="text-slate-300" />
              </div>
              <p className="font-bold text-slate-400">ยังไม่มีรายการค่าใช้จ่าย</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title="รับชำระเงินนักเรียน"
        size="lg"
      >
        <div className="space-y-4">
          <section className="border border-sky-200 bg-sky-50">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-sky-200 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-slate-800">ยอดรับชำระครั้งนี้</p>
                <p className="mt-0.5 text-xs text-slate-500">ตรวจสอบรายการและจำนวนเงินก่อนบันทึก</p>
              </div>
              <p className="text-3xl font-bold tabular-nums text-sky-800">
                {totalToPay.toLocaleString()} <span className="text-base font-semibold">บาท</span>
              </p>
            </div>
            <div className="grid grid-cols-2 divide-x divide-sky-200 text-xs">
              <div className="px-4 py-2 text-slate-600">ยอดคงค้างทั้งหมด <span className="float-right font-bold tabular-nums text-slate-800">{totalOutstanding.toLocaleString()} บาท</span></div>
              <div className="px-4 py-2 text-slate-600">รายการที่เลือก <span className="float-right font-bold tabular-nums text-slate-800">{Object.values(payAmounts).filter(amount => Number(amount) > 0).length} รายการ</span></div>
            </div>
          </section>

          <section className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-800">รายการที่จะรับชำระ</h4>
                <p className="text-xs text-slate-500">เลือกเฉพาะรายการที่รับเงินในครั้งนี้</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const unpaidFees = fees.filter(f => f.status !== 'paid');
                  const allSelected = unpaidFees.length > 0 && unpaidFees.every(f => Number(payAmounts[f.id]) > 0);
                  if (allSelected) {
                    setPayAmounts({});
                  } else {
                    const newAmounts: Record<string, string> = {};
                    unpaidFees.forEach(f => {
                      newAmounts[f.id] = String(remainingBalance(f));
                    });
                    setPayAmounts(newAmounts);
                  }
                }}
                className="border border-sky-300 bg-white px-3 py-1.5 text-xs font-bold text-sky-700 transition-colors hover:bg-sky-50"
              >
                {fees.filter(f => f.status !== 'paid').every(f => Number(payAmounts[f.id]) > 0) && fees.filter(f => f.status !== 'paid').length > 0 ? 'ยกเลิกเลือกทั้งหมด' : 'เลือกทั้งหมด'}
              </button>
            </div>

            <div className="max-h-[260px] overflow-y-auto border border-slate-200">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="sticky top-0 z-10 bg-slate-100 text-xs font-semibold text-slate-600">
                  <tr>
                    <th className="w-11 px-3 py-2.5 text-center">เลือก</th>
                    <th className="px-3 py-2.5">รายการ</th>
                    <th className="w-28 px-3 py-2.5 text-right">คงค้าง</th>
                    <th className="w-36 px-3 py-2.5 text-right">รับชำระ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {fees.filter(f => f.status !== 'paid').map(f => {
                    const balance = remainingBalance(f);
                    const isSelected = Number(payAmounts[f.id]) > 0;

                    return (
                      <tr key={f.id} className={isSelected ? 'bg-sky-50/70' : 'bg-white'}>
                        <td className="px-3 py-3 text-center">
                          <input
                            aria-label={`เลือกรายการ ${f.fee_plan_info?.name || 'ค่าใช้จ่าย'}`}
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setPayAmounts({ ...payAmounts, [f.id]: String(balance) });
                              } else {
                                const newAmounts = { ...payAmounts };
                                delete newAmounts[f.id];
                                setPayAmounts(newAmounts);
                              }
                            }}
                            className="h-4 w-4 cursor-pointer border-slate-300 text-sky-600 focus:ring-sky-500"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <p className="font-semibold text-slate-800">{f.fee_plan_info?.name || 'รายการค่าใช้จ่าย'}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{formatBillingPeriod(f)}</p>
                        </td>
                        <td className="px-3 py-3 text-right font-semibold tabular-nums text-slate-700">{balance.toLocaleString()}</td>
                        <td className="px-3 py-2">
                          <label className="sr-only" htmlFor={`payment-amount-${f.id}`}>จำนวนเงินที่รับชำระสำหรับ {f.fee_plan_info?.name || 'รายการค่าใช้จ่าย'}</label>
                          <div className="relative">
                            <input
                              id={`payment-amount-${f.id}`}
                              type="number"
                              min="0"
                              max={balance}
                              inputMode="decimal"
                              className={`w-full border bg-white py-1.5 pl-2 pr-8 text-right text-sm font-semibold tabular-nums outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 ${
                                isSelected ? 'border-sky-400 text-sky-800' : 'border-slate-300 text-slate-500'
                              }`}
                              value={payAmounts[f.id] || ''}
                              onChange={(e) => setPayAmounts({ ...payAmounts, [f.id]: e.target.value })}
                              onBlur={(e) => {
                                const amount = Math.max(0, Math.min(Number(e.target.value) || 0, balance));
                                if (amount > 0) {
                                  setPayAmounts({ ...payAmounts, [f.id]: String(amount) });
                                } else {
                                  const newAmounts = { ...payAmounts };
                                  delete newAmounts[f.id];
                                  setPayAmounts(newAmounts);
                                }
                              }}
                            />
                            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">บาท</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <fieldset>
              <legend className="text-sm font-bold text-slate-800">ช่องทางรับเงิน</legend>
              <p className="mt-0.5 text-xs text-slate-500">เลือกช่องทางที่ใช้รับเงินในครั้งนี้</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {paymentMethods.length > 0 ? paymentMethods.map(m => {
                  const isCurrentMethod = paymentMethod === m.code;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      aria-pressed={isCurrentMethod}
                      onClick={() => setPaymentMethod(m.code)}
                      className={`border px-3 py-2 text-left text-sm font-semibold transition-colors ${
                        isCurrentMethod
                          ? 'border-sky-600 bg-sky-600 text-white'
                          : 'border-slate-300 bg-white text-slate-700 hover:border-sky-400 hover:bg-sky-50'
                      }`}
                    >
                      {m.name}
                    </button>
                  );
                }) : (
                  <p className="border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 sm:col-span-3">
                    ไม่พบช่องทางรับเงินที่เปิดใช้งาน กรุณาตั้งค่าช่องทางรับเงินก่อนบันทึก
                  </p>
                )}
              </div>
            </fieldset>
          </section>

          {/* Transfer Slip Upload (shown only for 'transfer') */}
          {paymentMethod === 'transfer' && (
            <div className="border border-slate-200 bg-slate-50 p-3">
              <label className="mb-2 block text-sm font-bold text-slate-800">แนบสลิปโอนเงิน <span className="font-normal text-slate-500">(ไม่บังคับ)</span></label>
              <div className="border border-dashed border-slate-300 bg-white p-3 text-center transition-colors hover:border-sky-400">
                {slipFile ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-left">
                        <p className="max-w-[260px] truncate text-sm font-semibold text-slate-800">{slipFile.name}</p>
                        <p className="text-xs text-slate-500">{(slipFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSlipFile(null)}
                      className="px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                    >
                      ลบ
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setSlipFile(file);
                      }}
                    />
                    <p className="text-xs font-semibold text-sky-700">เลือกไฟล์สลิปโอนเงิน</p>
                    <p className="mt-0.5 text-xs text-slate-500">รองรับไฟล์ภาพ (JPG, PNG) และ PDF</p>
                  </label>
                )}
              </div>
            </div>
          )}

          {paymentError && (
            <p role="alert" className="border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              ไม่สามารถบันทึกการรับชำระเงิน: {paymentError}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              className="border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              onClick={() => {
                setPaymentError(null);
                setIsPayModalOpen(false);
              }}
            >
              ยกเลิก
            </button>
            <button
              className="bg-sky-700 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={totalToPay <= 0 || paymentMethods.length === 0 || financeLoading || isPaying}
              onClick={handlePayment}
            >
              {isPaying ? 'กำลังบันทึก...' : `ยืนยันรับชำระ ${totalToPay.toLocaleString()} บาท`}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Fee Modal */}
      <Modal
         isOpen={isAddFeeModalOpen}
         onClose={() => setIsAddFeeModalOpen(false)}
         title="สร้างรายการเรียกเก็บเงิน"
      >
        <div className="p-2 space-y-5">
            <div className="flex p-1 bg-gray-100 rounded-xl mb-4">
              <button 
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${feeSource === 'system' ? 'bg-white shadow text-primary-600' : 'text-gray-500'}`}
                onClick={() => setFeeSource('system')}
              >
                รายการปกติ (System)
              </button>
              <button 
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${feeSource === 'legacy' ? 'bg-white shadow text-amber-600' : 'text-gray-500'}`}
                onClick={() => setFeeSource('legacy')}
              >
                ยอดคงค้างเก่า (Legacy)
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">เลือกประเภทค่าใช้จ่าย</label>
              <select
                className="select-field w-full"
                value={individualPlan}
                onChange={(e) => setIndividualPlan(e.target.value)}
              >
                <option value="">-- เลือกรายการ --</option>
                {feePlans.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({Number(p.amount).toLocaleString()} ฿)</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4 animate-fade-in mb-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">ปีการศึกษา</label>
                <select
                  className="select-field w-full"
                  value={targetYear}
                  onChange={(e) => setTargetYear(e.target.value)}
                >
                  <option value="">-- ไม่ระบุ --</option>
                  {academicTermOptions.years.map(y => (
                    <option key={y.id} value={y.id}>{y.year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">ภาคเรียน</label>
                <select
                  className="select-field w-full"
                  value={targetSemester}
                  onChange={(e) => setTargetSemester(e.target.value)}
                >
                  <option value="">-- ไม่ระบุ --</option>
                  {academicTermOptions.semesters
                    .filter(s => !targetYear || s.academic_year_id === targetYear)
                    .map(s => (
                      <option key={s.id} value={s.id}>เทอม {s.semester}</option>
                    ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 animate-fade-in mb-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">เดือน (สำหรับรายเดือน)</label>
                <select
                  className="select-field w-full"
                  value={billingMonth}
                  onChange={(e) => setBillingMonth(e.target.value)}
                >
                  <option value="">-- ไม่ระบุ --</option>
                  {[
                    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
                  ].map((m, i) => (
                    <option key={i+1} value={i+1}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">ปี พ.ศ. (สำหรับรายเดือน)</label>
                <input
                  type="number"
                  placeholder="เช่น 2568"
                  className="input-field w-full"
                  value={billingYear}
                  onChange={(e) => setBillingYear(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">
                {feeSource === 'legacy' ? 'จำนวนเงินค้างชำระ (บาท)' : 'จำนวนเงินที่จะเรียกเก็บ (บาท)'}
              </label>
              <input 
                type="number"
                className={`input-field w-full font-bold text-lg ${feeSource === 'legacy' ? 'text-amber-600' : 'text-primary-600'}`}
                value={individualAmount}
                onChange={(e) => setIndividualAmount(e.target.value)}
              />
            </div>

           <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
              <button 
                className="flex-[1] py-2.5 text-gray-500 hover:bg-gray-100 rounded-xl font-bold transition-colors" 
                onClick={() => setIsAddFeeModalOpen(false)}
              >
                ยกเลิก
              </button>
              <button 
                className="flex-[2] btn-primary py-2.5 font-bold shadow-lg shadow-primary-500/20 disabled:opacity-50"
                disabled={!individualPlan || !individualAmount || processingFee}
                onClick={handleAddFee}
              >
                {processingFee ? 'กำลังสร้างยอด...' : 'ยืนยันการสร้างยอดชำระ'}
              </button>
           </div>
        </div>
      </Modal>

      {/* Edit Fee Modal */}
      <Modal
         isOpen={isEditFeeModalOpen}
         onClose={() => {
           setIsEditFeeModalOpen(false);
           setEditingFee(null);
         }}
         title="แก้ไขรายการเรียกเก็บเงิน"
      >
        <div className="p-2 space-y-5">
           <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">รายการ</label>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 font-bold text-gray-900">
                {editingFee?.fee_plan_info?.name}
              </div>
           </div>
           
           <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">จำนวนเงินเรียกเก็บ (บาท)</label>
              <div className="relative">
                <input 
                  type="number"
                  className="input-field w-full font-bold text-lg text-primary-600"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">฿</span>
              </div>
              {editingFee && editingFee.paid_amount > 0 && (
                <p className="mt-2 text-xs text-amber-600 font-medium">
                  * มียอดที่ชำระแล้ว {Number(editingFee.paid_amount).toLocaleString()} ฿ (ไม่สามารถแก้ไขยอดให้น้อยกว่ายอดที่จ่ายมาแล้วได้)
                </p>
              )}
           </div>

           <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
              <button 
                className="flex-[1] py-2.5 text-gray-500 hover:bg-gray-100 rounded-xl font-bold transition-colors" 
                onClick={() => {
                  setIsEditFeeModalOpen(false);
                  setEditingFee(null);
                }}
              >
                ยกเลิก
              </button>
              <button 
                className="flex-[2] btn-primary py-2.5 font-bold shadow-lg shadow-primary-500/20 disabled:opacity-50"
                disabled={!editAmount || processingFee || (!!editingFee && Number(editAmount) < Number(editingFee.paid_amount))}
                onClick={handleUpdateFee}
              >
                {processingFee ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
              </button>
           </div>
        </div>
      </Modal>
    </div>
  );
}
