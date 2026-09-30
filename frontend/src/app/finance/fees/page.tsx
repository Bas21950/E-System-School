'use client';

import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { 
  HiOutlineBanknotes, 
  HiOutlinePlus, 
  HiOutlineTrash,
  HiOutlineUsers
} from 'react-icons/hi2';
import Modal from '@/components/ui/Modal';
import { useFinance } from '@/modules/finance/hooks/useFinance';
import { useStudents } from '@/modules/students/hooks/useStudents';
import { FeePlan, ReceiptType, StudentFeeAssignment } from '@/modules/finance/types/finance';
export default function FeeConfigPage() {
  const { 
    fetchFeePlans, fetchReceiptTypes, createFeePlan, deleteFeePlan, loading: financeLoading,
    fetchFeeAssignments, assignFeeToStudent, unassignFeeFromStudent
  } = useFinance();
  
  const [studentSearch, setStudentSearch] = useState('');
  const { filterOptions, students: studentList } = useStudents({ search: studentSearch, limit: 10 });
  
  const [feePlans, setFeePlans] = useState<FeePlan[]>([]);
  const [receiptTypes, setReceiptTypes] = useState<ReceiptType[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<FeePlan | null>(null);
  const [assignments, setAssignments] = useState<StudentFeeAssignment[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    receipt_type_id: '',
    description: '',
    billing_cycle: 'once' as 'once' | 'monthly' | 'semester' | 'yearly',
    billing_day: '',
    target_grade_id: '',
    target_room_id: '',
  });

  const loadData = useCallback(async () => {
    const [planData, receiptData] = await Promise.all([
      fetchFeePlans(),
      fetchReceiptTypes()
    ]);
    setFeePlans(planData);
    setReceiptTypes(receiptData);
  }, [fetchFeePlans, fetchReceiptTypes]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAssign = async (plan: FeePlan) => {
    setSelectedPlan(plan);
    setIsAssignModalOpen(true);
    const data = await fetchFeeAssignments(plan.id);
    setAssignments(data);
  };

  const handleAddAssignment = async (studentId: string) => {
    if (!selectedPlan) return;
    try {
      await assignFeeToStudent(selectedPlan.id, studentId);
      const data = await fetchFeeAssignments(selectedPlan.id);
      setAssignments(data);
    } catch (err) {
      console.error('Failed to assign:', err);
      alert('Failed to assign student');
    }
  };

  const handleRemoveAssignment = async (studentId: string) => {
    if (!selectedPlan) return;
    try {
      await unassignFeeFromStudent(selectedPlan.id, studentId);
      const data = await fetchFeeAssignments(selectedPlan.id);
      setAssignments(data);
    } catch (err) {
      console.error('Failed to unassign:', err);
      alert('Failed to unassign student');
    }
  };

  // SWR automatically handles searching when studentSearch changes
  /*
  useEffect(() => {
    if (studentSearch.length >= 2) {
      fetchStudents({ school_id: studentSearch }); // search by ID or name if supported
    }
  }, [studentSearch, fetchStudents]);
  */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createFeePlan({
        ...formData,
        amount: Number(formData.amount),
        billing_day: formData.billing_day ? Number(formData.billing_day) : null,
        target_grade_id: formData.target_grade_id || null,
        target_room_id: formData.target_room_id || null,
      });
      setIsModalOpen(false);
      setFormData({ 
        name: '', amount: '', receipt_type_id: '', description: '',
        billing_cycle: 'once', billing_day: '', target_grade_id: '', target_room_id: ''
      });
      loadData();
    } catch (err: unknown) {
      alert('Failed to create fee plan: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ยืนยันการลบรายการนี้?')) return;
    try {
      await deleteFeePlan(id);
      loadData();
    } catch (err: unknown) {
      alert('Delete failed: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [generatePeriod, setGeneratePeriod] = useState({
    year: '', semester: '', month: '', bYear: ''
  });
  const { generateFees, generateFeesByRoom } = useFinance();

  const handleOpenGenerate = (plan: FeePlan) => {
    setSelectedPlan(plan);
    setIsGenerateModalOpen(true);
    // Reset period
    setGeneratePeriod({ year: '', semester: '', month: '', bYear: '' });
  };

  const handleGenerate = async () => {
    if (!selectedPlan) return;
    try {
      let result;
      if (selectedPlan.target_room_id) {
        result = await generateFeesByRoom(
          selectedPlan.id, 
          selectedPlan.target_room_id,
          generatePeriod.semester || null,
          generatePeriod.year || null,
          generatePeriod.month ? Number(generatePeriod.month) : null,
          generatePeriod.bYear ? Number(generatePeriod.bYear) : null
        );
      } else {
        result = await generateFees(
          selectedPlan.id,
          generatePeriod.semester || null,
          generatePeriod.year || null,
          generatePeriod.month ? Number(generatePeriod.month) : null,
          generatePeriod.bYear ? Number(generatePeriod.bYear) : null
        );
      }
      alert(`เรียกเก็บเงินสำเร็จ: ${result.count} รายการ`);
      setIsGenerateModalOpen(false);
    } catch (err: unknown) {
      alert('Generation failed: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <Header 
        title="กำหนดเรียกเก็บเงิน (Fee Configuration)" 
        subtitle="จัดการรายการค่าเทอมและค่าธรรมเนียมต่างๆ เพื่อเรียกเก็บเงินนักเรียน"
      >
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2 shadow-lg shadow-primary-500/20"
        >
          <HiOutlinePlus size={20} />
          <span>สร้างรายการเรียกเก็บใหม่</span>
        </button>
      </Header>

      <div className="grid gap-6">
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/50 text-gray-600 font-bold border-b">
                <tr>
                  <th className="px-3 py-2 text-xs">ชื่อรายการ / กลุ่มเป้าหมาย</th>
                  <th className="px-3 py-2 text-xs">รอบบิล</th>
                  <th className="px-3 py-2 text-xs">ประเภทใบเสร็จ</th>
                  <th className="px-3 py-2 text-xs text-right">จำนวนเงิน</th>
                  <th className="px-3 py-2 text-xs text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {feePlans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-3 py-1.5">
                      <div className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors text-sm">{plan.name}</div>
                      <div className="text-[10px] text-primary-500 font-bold uppercase mt-0.5">
                        {plan.target_grade_id ? `เป้าหมาย: ทั้งระดับชั้น` : plan.target_room_id ? `เป้าหมาย: เฉพาะห้อง` : 'เป้าหมาย: รายบุคคล/กำหนดเอง'}
                      </div>
                      <div className="text-xs text-gray-400">{plan.description || '-'}</div>
                    </td>
                    <td className="px-3 py-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${plan.billing_cycle === 'once' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}>
                        {plan.billing_cycle === 'once' ? 'ครั้งเดียว' : plan.billing_cycle === 'monthly' ? `ทุกวันที่ ${plan.billing_day}` : plan.billing_cycle}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-gray-600 font-medium text-sm">
                      <span className="px-2 py-0.5 bg-gray-50 text-gray-600 font-bold border border-gray-200 rounded text-[11px]">
                        {plan.receipt_type_info?.name || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-right font-black text-primary-600 text-sm">
                      {Number(plan.amount).toLocaleString()} ฿
                    </td>
                    <td className="px-3 py-1.5">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenGenerate(plan)}
                          title="เรียกเก็บเงิน (Generate Fees)"
                          className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        >
                          <HiOutlineBanknotes size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenAssign(plan)}
                          title="จัดการรายชื่อนักเรียน"
                          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                        >
                          <HiOutlineUsers size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(plan.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <HiOutlineTrash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {feePlans.length === 0 && !financeLoading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3 grayscale opacity-30">
                        <HiOutlineBanknotes size={64} />
                        <p className="text-gray-500 font-medium text-lg">ยังไม่มีรายการเรียกเก็บเงิน</p>
                        <p className="text-gray-400 text-sm">เริ่มสร้างรายการใหม่ได้ที่ปุ่ม &quot;สร้างรายการเรียกเก็บใหม่&quot; ด้านบน</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="✨ สร้างรายการเรียกเก็บใหม่"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-primary-50/50 p-4 rounded-2xl border border-primary-100">
            <label className="label text-primary-900 font-bold mb-2">ชื่อรายการเรียกเก็บ</label>
            <input
              type="text"
              required
              className="input-field bg-white"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="เช่น ค่าเทอม 1/2569, ค่าสมุดและอุปกรณ์"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label font-bold text-gray-700">รอบบิล (Billing Cycle)</label>
              <select
                required
                className="select-field"
                value={formData.billing_cycle}
                onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value as typeof formData.billing_cycle })}
              >
                <option value="once">เรียกเก็บครั้งเดียว (Once)</option>
                <option value="monthly">รายเดือน (Monthly)</option>
                <option value="semester">รายเทอม (Semester)</option>
                <option value="yearly">รายปี (Yearly)</option>
              </select>
            </div>
            {formData.billing_cycle === 'monthly' && (
              <div className="animate-fade-in">
                <label className="label font-bold text-gray-700">เรียกเก็บทุกวันที่</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  required
                  className="input-field"
                  value={formData.billing_day}
                  onChange={(e) => setFormData({ ...formData, billing_day: e.target.value })}
                  placeholder="1-31"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label font-bold text-gray-700">กลุ่มเป้าหมาย (ระดับชั้น)</label>
              <select
                className="select-field"
                value={formData.target_grade_id}
                onChange={(e) => setFormData({ ...formData, target_grade_id: e.target.value, target_room_id: '' })}
              >
                <option value="">-- ทั้งโรงเรียน หรือ ระบุภายหลัง --</option>
                {filterOptions.grades.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label font-bold text-gray-700">กลุ่มเป้าหมาย (ห้องเรียน)</label>
              <select
                className="select-field"
                value={formData.target_room_id}
                onChange={(e) => setFormData({ ...formData, target_room_id: e.target.value, target_grade_id: '' })}
              >
                <option value="">-- ไม่ระบุ --</option>
                {filterOptions.rooms
                  .filter(r => !formData.target_grade_id || r.grade_id === formData.target_grade_id)
                  .map(r => (
                    <option key={r.id} value={r.id}>{r.room_number}</option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label font-bold text-gray-700">จำนวนเงิน (บาท)</label>
              <div className="relative">
                <input
                  type="number"
                  required
                  className="input-field pr-12 font-bold text-primary-600"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">฿</span>
              </div>
            </div>
            <div>
              <label className="label font-bold text-gray-700">ประเภทใบเสร็จ</label>
              <select
                required
                className="select-field"
                value={formData.receipt_type_id}
                onChange={(e) => setFormData({ ...formData, receipt_type_id: e.target.value })}
              >
                <option value="">เลือกประเภทใบเสร็จ</option>
                {receiptTypes.map(r => (
                  <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
                ))}
              </select>
            </div>
          </div>


          <div>
            <label className="label font-bold text-gray-700">หมายเหตุ / คำอธิบาย</label>
            <textarea
              className="input-field min-h-[100px]"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="รายละเอียดสำหรับพิมพ์ในใบเสร็จ หรือข้อความแจ้งเตือนผู้ปกครอง..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-colors">
              ยกเลิก
            </button>
            <button type="submit" className="btn-primary px-10 py-3 shadow-lg shadow-primary-500/20">
              บันทึกรายการ
            </button>
          </div>
        </form>
      </Modal>
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={`👥 จัดการรายชื่อนักเรียน: ${selectedPlan?.name}`}
      >
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-xl space-y-3">
            <label className="text-xs font-bold text-gray-500 uppercase">เพิ่มนักเรียนเข้ากลุ่ม</label>
            <div className="relative">
              <input
                type="text"
                className="input-field pl-10"
                placeholder="ค้นหาด้วยชื่อ หรือ รหัสนักเรียน..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <HiOutlineUsers size={18} />
              </div>
            </div>
            
            {studentSearch.length >= 2 && studentList.length > 0 && (
              <div className="bg-white border rounded-xl overflow-hidden mt-2 shadow-xl max-h-48 overflow-y-auto divide-y">
                {studentList.map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      handleAddAssignment(s.id);
                      setStudentSearch('');
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-primary-50 transition-colors flex justify-between items-center group"
                  >
                    <div>
                      <div className="font-bold text-sm text-gray-900 group-hover:text-primary-600">{s.first_name} {s.last_name}</div>
                      <div className="text-[10px] text-gray-500">{s.student_id}</div>
                    </div>
                    <HiOutlinePlus className="text-gray-300 group-hover:text-primary-500" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-500 uppercase flex justify-between">
              <span>รายชื่อนักเรียนที่ลงทะเบียน ({assignments.length})</span>
            </label>
            <div className="glass-card overflow-hidden max-h-80 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-100/50 sticky top-0 font-bold border-b">
                  <tr>
                    <th className="px-3 py-2">ชื่อ-นามสกุล</th>
                    <th className="px-3 py-2 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {assignments.map((asgn) => (
                    <tr key={asgn.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-3 py-2">
                        <div className="font-bold text-gray-900">{asgn.student_info?.first_name} {asgn.student_info?.last_name}</div>
                        <div className="text-[10px] text-gray-500">{asgn.student_info?.student_id}</div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => handleRemoveAssignment(asgn.student_id)}
                          className="p-1 px-3 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-full font-bold transition-all text-[10px]"
                        >
                          ลบออก
                        </button>
                      </td>
                    </tr>
                  ))}
                  {assignments.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-4 py-10 text-center text-gray-400">
                        ยังไม่มีนักเรียนรายบุคคลในกลุ่มนี้
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title={`⚡ เรียกเก็บเงิน: ${selectedPlan?.name}`}
      >
        <div className="space-y-6">
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
            <p className="text-sm text-emerald-800">
              ทำการสร้างรายการเรียกเก็บเงินสำหรับนักเรียนที่เกี่ยวข้องโดยระบุงวดเงิน
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">ปีการศึกษา</label>
              <select
                className="select-field w-full"
                value={generatePeriod.year}
                onChange={(e) => setGeneratePeriod({ ...generatePeriod, year: e.target.value })}
              >
                <option value="">-- ไม่ระบุ --</option>
                {filterOptions.academicYears?.map(y => (
                  <option key={y.id} value={y.id}>{y.year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">ภาคเรียน</label>
              <select
                className="select-field w-full"
                value={generatePeriod.semester}
                onChange={(e) => setGeneratePeriod({ ...generatePeriod, semester: e.target.value })}
              >
                <option value="">-- ไม่ระบุ --</option>
                {filterOptions.semesters
                  ?.filter((s) => !generatePeriod.year || s.academic_year_id === generatePeriod.year)
                  .map((s) => (
                    <option key={s.id} value={s.id}>เทอม {s.semester}</option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">เดือน (สำหรับรายเดือน)</label>
              <select
                className="select-field w-full"
                value={generatePeriod.month}
                onChange={(e) => setGeneratePeriod({ ...generatePeriod, month: e.target.value })}
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
                value={generatePeriod.bYear}
                onChange={(e) => setGeneratePeriod({ ...generatePeriod, bYear: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button 
              onClick={() => setIsGenerateModalOpen(false)} 
              className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-colors"
            >
              ยกเลิก
            </button>
            <button 
              onClick={handleGenerate}
              disabled={financeLoading}
              className="btn-primary px-10 py-3 shadow-lg shadow-primary-500/20 bg-emerald-600 hover:bg-emerald-700 border-emerald-700"
            >
              {financeLoading ? 'กำลังสร้าง...' : 'เริ่มเรียกเก็บเงิน'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
