'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { 
  HiOutlineArrowLeft, 
  HiOutlineClock, 
  HiOutlinePlus, 
  HiOutlineBanknotes,
  HiOutlinePencilSquare,
  HiOutlineTrash
} from 'react-icons/hi2';
import { useFinance } from '@/modules/finance/hooks/useFinance';
import { api } from '@/lib/api';
import { Student } from '@/modules/students/types/student';
import { StudentFee, FeePlan, AcademicYear, Semester } from '@/modules/finance/types/finance';
import Modal from '@/components/ui/Modal';

export default function StudentFinanceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.studentId as string;

  const { 
    fetchStudentFees, processPayment, loading: financeLoading, 
    fetchFeePlans, createIndividualFee, 
    updateStudentFee, deleteStudentFee,
    uploadTransferSlip, fetchPaymentMethods
  } = useFinance();
  
  const [student, setStudent] = useState<Student | null>(null);
  const [fees, setFees] = useState<StudentFee[]>([]);
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

      // Init payment amounts
      const initialAmounts: Record<string, string> = {};
      feesData.forEach(f => {
        if (f.status !== 'paid') {
          initialAmounts[f.id] = String(f.total_amount - (f.paid_amount || 0));
        }
      });
      setPayAmounts(initialAmounts);

      const [plans, methodsData] = await Promise.all([
        fetchFeePlans(),
        fetchPaymentMethods()
      ]);
      setFeePlans(plans);
      setPaymentMethods(methodsData.filter(m => m.is_active));

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
  const totalOutstanding = fees.reduce((sum, f) => sum + (f.status !== 'paid' ? f.total_amount - (f.paid_amount || 0) : 0), 0);

  const handlePayment = async () => {
    if (!student || totalToPay <= 0 || isPaying) return;
    setIsPaying(true);
    
    const items = Object.entries(payAmounts)
      .filter(([, amount]) => Number(amount) > 0)
      .map(([id, amount]) => ({
        student_fee_id: id,
        amount: Number(amount)
      }));

    try {
      const result = await processPayment({
        student_id: student.id,
        payment_method: paymentMethod as 'cash' | 'transfer' | 'qr',
        payment_date: new Date().toISOString().split('T')[0],
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
      loadData();
    } catch (err: unknown) {
      alert('Payment failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
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

  const handleDeleteFee = async (id: string) => {
    if (!confirm('ยืนยันการลบรายการเรียกเก็บเงินนี้?')) return;
    try {
      await deleteStudentFee(id);
      loadData();
    } catch (err: unknown) {
      alert('เกิดข้อผิดพลาด: ' + (err instanceof Error ? err.message : 'Unknown error'));
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
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-2 bg-white text-gray-400 hover:text-primary-600 border border-gray-200 hover:border-primary-200 rounded-xl shadow-sm transition-all"
        >
          <HiOutlineArrowLeft size={20} />
        </button>
        <Header 
          title="รายละเอียดการชำระเงิน" 
          subtitle="ประวัติการเรียกเก็บและรับชำระเงินของนักเรียนรายบุคคล"
          className="!mb-0"
        />
      </div>

      <div className="space-y-4">
        <div className="glass-card p-4 lg:p-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.8fr)_minmax(260px,0.8fr)] items-start">
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-100 to-primary-100 flex items-center justify-center text-primary-600 font-black text-xl border border-white shadow-md">
                    {student.first_name[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 leading-tight text-lg">
                      {student.first_name} {student.last_name}
                    </h3>
                    <p className="text-xs font-bold text-primary-600 mt-1">รหัส: {student.student_id}</p>
                  </div>
                </div>

                <button
                  onClick={() => router.push(`/finance/student-payments/${studentId}/history`)}
                  className="py-1.5 px-3 bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-600 rounded-lg font-bold text-xs flex items-center gap-2 transition-colors shadow-sm w-fit"
                >
                  <HiOutlineClock size={16} /> ประวัติการชำระเงิน
                </button>
              </div>

              <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-2">
                <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
                  <p className="text-[10px] text-gray-500 font-bold mb-1">ระดับชั้น</p>
                  <p className="font-bold text-gray-900">{currentEnrollment?.room_info?.grade_info?.name || '-'}</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
                  <p className="text-[10px] text-gray-500 font-bold mb-1">ห้องเรียน</p>
                  <p className="font-bold text-gray-900">{currentEnrollment?.room_info?.room_number || '-'}</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
                  <p className="text-[10px] text-gray-500 font-bold mb-1">ปีการศึกษา</p>
                  <p className="font-bold text-gray-900">{currentEnrollment?.academic_year_info?.year || '-'}</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
                  <p className="text-[10px] text-gray-500 font-bold mb-1">สถานะ</p>
                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                    student.status === 'กำลังศึกษาอยู่' || currentEnrollment?.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {currentEnrollment?.status === 'active' ? 'กำลังศึกษาอยู่' : (currentEnrollment?.status || student.status)}
                  </span>
                </div>
              </div>
            </div>

            <div className={`rounded-xl border p-4 ${totalOutstanding > 0 ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
              <p className={`text-[10px] font-bold mb-1.5 ${totalOutstanding > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                ยอดค้างชำระรวมสุทธิ
              </p>
              <h2 className={`text-3xl font-black ${totalOutstanding > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {totalOutstanding.toLocaleString()} <span className="text-base">฿</span>
              </h2>

              <div className="mt-3 flex flex-col gap-2">
                <button
                  onClick={() => setIsPayModalOpen(true)}
                  disabled={totalOutstanding <= 0}
                  className="w-full btn-primary py-2.5 flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:shadow-none text-sm"
                >
                  <HiOutlineBanknotes size={18} /> รับชำระเงิน
                </button>
                <button
                  onClick={() => setIsAddFeeModalOpen(true)}
                  className="w-full py-2.5 bg-white border border-gray-200 hover:border-primary-200 text-gray-700 hover:text-primary-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <HiOutlinePlus size={18} /> เพิ่มยอดชำระ
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-gray-900 text-sm">รายการค่าใช้จ่ายทั้งหมด</h3>
              <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200 shadow-sm">{fees.length} รายการ</span>
            </div>
          </div>
          
          {fees.length > 0 ? (
            <table className="w-full text-xs">
              <thead className="bg-white text-gray-500 border-b border-gray-200 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left font-bold">รายการ</th>
                  <th className="px-4 py-3 text-left font-bold w-36">งวด</th>
                  <th className="px-4 py-3 text-right font-bold w-24">จำนวนเงิน</th>
                  <th className="px-4 py-3 text-right font-bold text-emerald-600 w-24">ชำระแล้ว</th>
                  <th className="px-4 py-3 text-right font-bold text-rose-500 w-24 whitespace-nowrap">ยอดคงเหลือ</th>
                  <th className="px-4 py-3 text-center font-bold w-24">สถานะ</th>
                  <th className="px-4 py-3 text-center font-bold w-14">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {fees.map(f => (
                  <tr key={f.id} className="hover:bg-primary-50/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-gray-900">{f.fee_plan_info?.name}</div>
                        {f.source === 'legacy' && (
                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-black rounded uppercase border border-amber-200">Legacy</span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono mt-1">Ref: {f.id.split('-')[0]}</div>
                    </td>
                    <td className="px-4 py-3 text-left">
                      <div className="text-[11px] font-bold text-gray-600">{formatBillingPeriod(f)}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-600">{Number(f.total_amount).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600">{(f.paid_amount || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-black text-rose-500 whitespace-nowrap">
                      {(f.total_amount - (f.paid_amount || 0)).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {f.status === 'paid' ? (
                        <span className="inline-flex items-center justify-center px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-bold border border-emerald-100 w-full">
                          ชำระแล้ว
                        </span>
                      ) : f.status === 'unpaid' ? (
                        <span className="inline-flex items-center justify-center px-2 py-1 bg-rose-50 text-rose-600 rounded-md text-[10px] font-bold border border-rose-100 w-full">
                          ค้างชำระ
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center px-2 py-1 bg-amber-50 text-amber-600 rounded-md text-[10px] font-bold border border-amber-100 w-full">
                          จ่ายบางส่วน
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => {
                            setEditingFee(f);
                            setEditAmount(String(f.total_amount));
                            setIsEditFeeModalOpen(true);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="แก้ไข"
                        >
                          <HiOutlinePencilSquare size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteFee(f.id)}
                          className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="ลบ"
                        >
                          <HiOutlineTrash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-16 text-center text-gray-500">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-gray-300">
                <HiOutlineBanknotes size={32} className="text-gray-300" />
              </div>
              <p className="font-bold text-gray-400">ยังไม่มีรายการค่าใช้จ่าย</p>
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
        <div className="p-2 space-y-6">
          <div className="bg-gradient-to-r from-primary-600 to-indigo-600 px-6 py-5 rounded-2xl flex justify-between items-center shadow-lg shadow-primary-500/20">
            <span className="font-bold text-white/80 text-sm">ยอดรวมที่ต้องการรับชำระ</span>
            <span className="text-3xl font-black text-white px-2">
              {totalToPay.toLocaleString()} <span className="text-sm font-medium text-white/60">฿</span>
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center mb-1">
              <h4 className="font-bold text-sm text-gray-700">รายการที่ทำรายการได้</h4>
              <button 
                type="button"
                onClick={() => {
                  const unpaidFees = fees.filter(f => f.status !== 'paid');
                  const allSelected = unpaidFees.every(f => !!payAmounts[f.id]);
                  if (allSelected) {
                    setPayAmounts({});
                  } else {
                    const newAmounts: Record<string, string> = {};
                    unpaidFees.forEach(f => {
                      newAmounts[f.id] = String(f.total_amount - (f.paid_amount || 0));
                    });
                    setPayAmounts(newAmounts);
                  }
                }}
                className="text-[10px] text-primary-600 hover:text-primary-700 font-bold bg-primary-50 px-2.5 py-1 rounded-lg border border-primary-100 transition-all uppercase tracking-wider"
              >
                {fees.filter(f => f.status !== 'paid').every(f => !!payAmounts[f.id]) && fees.filter(f => f.status !== 'paid').length > 0 ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
              </button>
            </div>
            <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {fees.filter(f => f.status !== 'paid').map(f => {
                const balance = f.total_amount - (f.paid_amount || 0);
                const isSelected = !!payAmounts[f.id];
                
                return (
                  <div key={f.id} className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${
                    isSelected ? 'bg-primary-50 border-primary-200' : 'bg-white border-gray-100 hover:border-gray-200'
                  }`}>
                    <input 
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
                      className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => {
                      if (isSelected) {
                        const newAmounts = { ...payAmounts };
                        delete newAmounts[f.id];
                        setPayAmounts(newAmounts);
                      } else {
                        setPayAmounts({ ...payAmounts, [f.id]: String(balance) });
                      }
                    }}>
                      <div className="font-bold text-gray-900 truncate text-sm">{f.fee_plan_info?.name}</div>
                      <div className="flex gap-2 items-center mt-0.5">
                        <div className="text-[10px] text-gray-400 font-mono italic">Ref: {f.id.split('-')[0]}</div>
                        <div className="text-[10px] font-bold text-primary-600 bg-primary-100/50 px-1.5 rounded-md">
                          {formatBillingPeriod(f)}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">คงค้าง: {balance.toLocaleString()}</div>
                      <div className="w-28 relative">
                        <input
                          type="number"
                          className={`w-full bg-white border rounded-lg px-2.5 py-1.5 text-right font-black pr-8 focus:ring-2 focus:ring-primary-500/50 outline-none h-9 text-xs ${
                            isSelected ? 'border-primary-300 text-primary-700' : 'border-gray-200 text-gray-400'
                          }`}
                          value={payAmounts[f.id] || ''}
                          onChange={(e) => setPayAmounts({ ...payAmounts, [f.id]: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-[10px] select-none">฿</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="font-bold text-sm text-gray-700 mb-3 block">ช่องทางการรับเงิน</label>
            <div className="grid grid-cols-3 gap-3">
              {paymentMethods.length > 0 ? paymentMethods.map(m => {
                let icon = '💵';
                if (m.code === 'transfer') icon = '🏦';
                else if (m.code === 'qr') icon = '📱';

                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.code)}
                    className={`
                      flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all
                      ${paymentMethod === m.code 
                        ? 'border-primary-500 bg-primary-50 text-primary-700' 
                        : 'border-gray-100 text-gray-500 hover:border-gray-200'}
                    `}
                  >
                    <span className="text-2xl">{icon}</span>
                    <span className="font-bold text-xs truncate w-full px-2 text-center">{m.name}</span>
                  </button>
                );
              }) : (
                <div className="col-span-3 text-center text-gray-400 py-4 text-xs font-bold bg-gray-50 rounded-xl">
                  ไม่พบช่องทางชำระเงินที่เปิดใช้งาน
                </div>
              )}
            </div>
          </div>

          {/* Transfer Slip Upload (shown only for 'transfer') */}
          {paymentMethod === 'transfer' && (
            <div className="animate-fade-in">
              <label className="font-bold text-sm text-gray-700 mb-3 block">แนบสลิปโอนเงิน (ไม่บังคับ)</label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-primary-300 transition-colors">
                {slipFile ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                        <span className="text-lg">🖼️</span>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-gray-900 truncate max-w-[200px]">{slipFile.name}</p>
                        <p className="text-[10px] text-gray-400">{(slipFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setSlipFile(null)}
                      className="text-xs text-rose-500 hover:text-rose-700 font-bold px-2 py-1 hover:bg-rose-50 rounded-lg transition-colors"
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
                    <div className="text-2xl mb-1">📎</div>
                    <p className="text-xs text-gray-500 font-bold">คลิกเพื่อแนบสลิปโอนเงิน</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">รองรับไฟล์ภาพ (JPG, PNG) และ PDF</p>
                  </label>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button 
              className="flex-[1] py-3 text-gray-500 hover:bg-gray-100 rounded-xl font-bold transition-colors" 
              onClick={() => setIsPayModalOpen(false)}
            >
              ยกเลิก
            </button>
            <button 
              className="flex-[2] btn-primary py-3 font-black shadow-lg shadow-primary-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none"
              disabled={totalToPay <= 0 || financeLoading || isPaying}
              onClick={handlePayment}
            >
              {isPaying ? 'กำลังประมวลผล...' : 'ยืนยันการรับชำระเงิน'}
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
