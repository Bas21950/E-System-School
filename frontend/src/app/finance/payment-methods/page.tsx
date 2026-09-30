'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Header from '@/components/layout/Header';
import Modal from '@/components/ui/Modal';
import { useFinance } from '@/modules/finance/hooks/useFinance';
import { PaymentMethod } from '@/modules/finance/types/finance';
import { HiOutlineBanknotes, HiOutlineGlobeAlt, HiOutlinePlus, HiOutlinePencilSquare, HiOutlineQrCode } from 'react-icons/hi2';

const ICON_MAP: Record<string, typeof HiOutlineBanknotes> = {
  cash: HiOutlineBanknotes,
  transfer: HiOutlineGlobeAlt,
  qr: HiOutlineQrCode,
};

export default function PaymentMethodsPage() {
  const { fetchPaymentMethods, createPaymentMethod, updatePaymentMethod } = useFinance();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(10);

  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formActive, setFormActive] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPaymentMethods();
      setMethods(data);
    } finally {
      setLoading(false);
    }
  }, [fetchPaymentMethods]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredMethods = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return methods;
    return methods.filter((method) =>
      [method.name, method.code, method.description || ''].join(' ').toLowerCase().includes(q),
    );
  }, [methods, searchQuery]);

  const openAddModal = () => {
    setEditingMethod(null);
    setFormName('');
    setFormDescription('');
    setFormActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormName(method.name);
    setFormDescription(method.description || '');
    setFormActive(method.is_active);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formName) return;
    setSaving(true);
    try {
      if (editingMethod) {
        await updatePaymentMethod(editingMethod.id, {
          name: formName,
          description: formDescription || undefined,
          is_active: formActive,
        });
      } else {
        await createPaymentMethod({
          name: formName,
          description: formDescription || undefined,
          is_active: formActive,
          sort_order: methods.length + 1,
        });
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      alert('เกิดข้อผิดพลาด: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const currentPageCount = Math.min(pageSize, filteredMethods.length);

  return (
    <div className="animate-fade-in space-y-6">
      <Header
        title="รูปแบบการชำระเงิน (Payment Methods)"
        subtitle="กำหนดช่องทางการรับชำระเงิน และข้อมูลประกอบสำหรับใบเสร็จ"
      >
        <button onClick={openAddModal} className="btn-primary flex items-center gap-2 shadow-lg shadow-primary-500/20">
          <HiOutlinePlus size={20} />
          <span>เพิ่มช่องทางชำระเงิน</span>
        </button>
      </Header>

      <div className="overflow-hidden rounded-sm border border-sky-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-sky-100 bg-sky-50 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm font-bold text-sky-900">รายการรูปแบบการชำระเงิน</div>
            <div className="mt-0.5 text-xs text-slate-500">แสดงช่องทางที่ใช้รับชำระในระบบ</div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>ทั้งหมด {filteredMethods.length} รายการ</span>
            <span className="rounded-sm border border-sky-200 bg-white px-2 py-0.5">หน้า 1/1</span>
          </div>
        </div>

        <div className="border-b border-slate-200 px-4 py-3">
          <div className="grid gap-3 md:grid-cols-[1fr_180px]">
            <div className="relative">
              <HiOutlineBanknotes className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อ รหัส หรือคำอธิบาย"
                className="w-full rounded-sm border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm outline-none transition focus:border-sky-400"
              />
            </div>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value={10}>10 รายการ/หน้า</option>
              <option value={25}>25 รายการ/หน้า</option>
              <option value={50}>50 รายการ/หน้า</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-sky-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="border-b border-slate-200 px-3 py-2 text-left font-bold">#</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-left font-bold">รูปแบบ</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-left font-bold">รหัส</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-left font-bold">คำอธิบาย</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-center font-bold">สถานะ</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-center font-bold">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredMethods.slice(0, currentPageCount).map((method, index) => {
                  const IconComponent = ICON_MAP[method.code] || HiOutlineBanknotes;
                  return (
                    <tr key={method.id} className="hover:bg-sky-50/60">
                      <td className="border-b border-slate-200 px-3 py-2 text-slate-500">{index + 1}</td>
                      <td className="border-b border-slate-200 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-sm border ${
                              method.code === 'cash'
                                ? 'border-emerald-100 bg-emerald-50 text-emerald-600'
                                : method.code === 'transfer'
                                  ? 'border-indigo-100 bg-indigo-50 text-indigo-600'
                                  : 'border-violet-100 bg-violet-50 text-violet-600'
                            }`}
                          >
                            <IconComponent size={15} />
                          </span>
                          <span className="font-bold text-slate-900">{method.name}</span>
                        </div>
                      </td>
                      <td className="border-b border-slate-200 px-3 py-2 text-slate-600">{method.code}</td>
                      <td className="border-b border-slate-200 px-3 py-2 text-slate-600">{method.description || '-'}</td>
                      <td className="border-b border-slate-200 px-3 py-2 text-center">
                        {method.is_active ? (
                          <span className="rounded-sm border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                            ใช้งาน
                          </span>
                        ) : (
                          <span className="rounded-sm border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">
                            ปิดใช้งาน
                          </span>
                        )}
                      </td>
                      <td className="border-b border-slate-200 px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEditModal(method)}
                            className="inline-flex items-center gap-1 rounded-sm border border-sky-200 bg-sky-50 px-2 py-1 text-xs font-bold text-sky-700 transition hover:border-sky-300 hover:bg-sky-100"
                            title="แก้ไข"
                          >
                            <HiOutlinePencilSquare size={14} />
                            แก้ไข
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredMethods.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-12 text-center text-sm text-slate-500">
                      ไม่พบข้อมูลรูปแบบการชำระเงิน
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <div>หน้า 1/1</div>
          <div className="flex items-center gap-2">
            <span>แสดง</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded-sm border border-slate-300 bg-white px-2 py-1 text-xs"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>รายการ/หน้า</span>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMethod ? 'แก้ไขรูปแบบการชำระเงิน' : 'เพิ่มรูปแบบการชำระเงินใหม่'}
      >
        <div className="p-2 space-y-5">
          <div>
            <div className="mb-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
              <p className="mb-1 font-bold">ตัวอย่างที่ใช้บ่อย</p>
              <p>เงินสด, โอนเงิน, QR PromptPay</p>
              <p className="mt-2 text-xs text-blue-700">ระบบจะสร้างรหัสให้โดยอัตโนมัติ ไม่จำเป็นต้องคิดรหัสเอง</p>
            </div>

            <label className="mb-2 block text-xs font-bold text-gray-700">ชื่อรูปแบบ</label>
            <input
              type="text"
              className="input-field w-full"
              placeholder="เช่น เงินสด (Cash)"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold text-gray-700">รายละเอียด</label>
            <textarea
              className="input-field w-full"
              placeholder="คำอธิบายเพิ่มเติม"
              rows={2}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={formActive}
              onChange={(e) => setFormActive(e.target.checked)}
              className="h-5 w-5 cursor-pointer rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="is_active" className="cursor-pointer select-none text-sm font-medium text-gray-700">
              เปิดใช้งาน
            </label>
          </div>

          <div className="flex gap-3 border-t border-gray-100 pt-4">
            <button
              className="flex-[1] rounded-xl py-2.5 font-bold text-gray-500 transition-colors hover:bg-gray-100"
              onClick={() => setIsModalOpen(false)}
              type="button"
            >
              ยกเลิก
            </button>
            <button
              className="flex-[2] rounded-xl bg-primary-600 py-2.5 font-bold text-white shadow-lg shadow-primary-500/20 transition-all hover:bg-primary-700 disabled:opacity-50"
              disabled={!formName || saving}
              onClick={handleSave}
              type="button"
            >
              {saving ? 'กำลังบันทึก...' : editingMethod ? 'บันทึกการแก้ไข' : 'เพิ่มรูปแบบ'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
