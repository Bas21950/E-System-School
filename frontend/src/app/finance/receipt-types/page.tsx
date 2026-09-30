'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Header from '@/components/layout/Header';
import Modal from '@/components/ui/Modal';
import { useFinance } from '@/modules/finance/hooks/useFinance';
import { ReceiptType } from '@/modules/finance/types/finance';
import { HiOutlineCheckCircle, HiOutlineMagnifyingGlass, HiOutlinePencil, HiOutlinePlus, HiOutlineTrash, HiOutlineXCircle } from 'react-icons/hi2';

export default function ReceiptTypesPage() {
  const { fetchReceiptTypes, createReceiptType, updateReceiptType, deleteReceiptType, loading } = useFinance();
  const [receiptTypes, setReceiptTypes] = useState<ReceiptType[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(10);

  const [formData, setFormData] = useState<{
    code: string;
    name: string;
    prefix: string;
    current_number: number;
    is_active: boolean;
  }>({
    code: '',
    name: '',
    prefix: '',
    current_number: 1,
    is_active: true,
  });

  const loadData = useCallback(async () => {
    const data = await fetchReceiptTypes();
    setReceiptTypes(data);
  }, [fetchReceiptTypes]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredTypes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return receiptTypes;
    return receiptTypes.filter((item) =>
      [item.code, item.name, item.prefix, String(item.current_number)]
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [receiptTypes, searchQuery]);

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      prefix: '',
      current_number: 1,
      is_active: true,
    });
    setEditingId(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (type: ReceiptType) => {
    setFormData({
      code: type.code,
      name: type.name,
      prefix: type.prefix,
      current_number: type.current_number,
      is_active: type.is_active,
    });
    setEditingId(type.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ยืนยันการลบประเภทใบเสร็จนี้?')) return;
    try {
      await deleteReceiptType(id);
      await loadData();
    } catch (err: unknown) {
      alert('ไม่สามารถลบได้: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        current_number: Number(formData.current_number),
      };

      if (editingId) {
        await updateReceiptType(editingId, payload);
      } else {
        await createReceiptType(payload);
      }
      setIsModalOpen(false);
      resetForm();
      await loadData();
    } catch (err: unknown) {
      alert('เกิดข้อผิดพลาด: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const currentPageCount = Math.min(pageSize, filteredTypes.length);

  return (
    <div className="animate-fade-in space-y-6">
      <Header
        title="ประเภทใบเสร็จรับเงิน (Receipt Types)"
        subtitle="ใช้กำหนดรหัสและเลขรันของใบเสร็จแต่ละประเภท เช่น ค่าเทอม ค่าเรียนพิเศษ หรือค่ากิจกรรม"
      >
        <button onClick={openAddModal} className="btn-primary flex items-center gap-2 shadow-lg shadow-primary-500/20">
          <HiOutlinePlus size={20} />
          <span>เพิ่มประเภทใบเสร็จ</span>
        </button>
      </Header>

      <div className="overflow-hidden rounded-sm border border-sky-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-sky-100 bg-sky-50 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm font-bold text-sky-900">รายการประเภทใบเสร็จ</div>
            <div className="mt-0.5 text-xs text-slate-500">แสดงรหัส ประเภท และเลขรันล่าสุดแบบตาราง</div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>ทั้งหมด {filteredTypes.length} รายการ</span>
            <span className="rounded-sm border border-sky-200 bg-white px-2 py-0.5">หน้า 1/1</span>
          </div>
        </div>

        <div className="border-b border-slate-200 px-4 py-3">
          <div className="grid gap-3 md:grid-cols-[1fr_180px]">
            <div className="relative">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหารหัส ชื่อ หรือคำนำหน้า"
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

        {loading && receiptTypes.length === 0 ? (
          <div className="flex min-h-[240px] items-center justify-center text-slate-400">
            กำลังโหลดข้อมูล...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="border-b border-slate-200 px-3 py-2 text-left font-bold">#</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-left font-bold">รหัส</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-left font-bold">ประเภทใบเสร็จ</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-left font-bold">คำอธิบายเพิ่ม</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-left font-bold">เลขรันล่าสุด</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-center font-bold">สถานะ</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-center font-bold">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredTypes.slice(0, currentPageCount).map((type, index) => (
                  <tr key={type.id} className="hover:bg-sky-50/60">
                    <td className="border-b border-slate-200 px-3 py-2 text-slate-500">{index + 1}</td>
                    <td className="border-b border-slate-200 px-3 py-2 font-bold text-slate-700">{type.code}</td>
                    <td className="border-b border-slate-200 px-3 py-2 font-bold text-slate-900">{type.name}</td>
                    <td className="border-b border-slate-200 px-3 py-2 text-slate-600">{type.prefix || '-'}</td>
                    <td className="border-b border-slate-200 px-3 py-2 text-slate-700">
                      {String(type.current_number).padStart(4, '0')}
                    </td>
                    <td className="border-b border-slate-200 px-3 py-2 text-center">
                      {type.is_active ? (
                        <span className="rounded-sm border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                          <span className="inline-flex items-center gap-1">
                            <HiOutlineCheckCircle size={12} />
                            ใช้งาน
                          </span>
                        </span>
                      ) : (
                        <span className="rounded-sm border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <HiOutlineXCircle size={12} />
                            ปิด
                          </span>
                        </span>
                      )}
                    </td>
                    <td className="border-b border-slate-200 px-3 py-2">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditModal(type)}
                          className="inline-flex items-center gap-1 rounded-sm border border-sky-200 bg-sky-50 px-2 py-1 text-xs font-bold text-sky-700 transition hover:border-sky-300 hover:bg-sky-100"
                        >
                          <HiOutlinePencil size={14} />
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleDelete(type.id)}
                          className="inline-flex items-center gap-1 rounded-sm border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
                        >
                          <HiOutlineTrash size={14} />
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredTypes.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-12 text-center text-sm text-slate-500">
                      ไม่พบข้อมูลประเภทใบเสร็จ
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
        title={editingId ? 'แก้ไขประเภทใบเสร็จ' : 'เพิ่มประเภทใบเสร็จ'}
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
            <p className="mb-1 font-bold">ตัวอย่างชื่อที่ใช้บ่อย</p>
            <p>ค่าเทอม, ค่าเรียนพิเศษ, ค่ากิจกรรม, ค่ารถ, ค่าหนังสือ</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label font-bold text-gray-700">รหัส</label>
              <input
                type="text"
                required
                placeholder="เช่น TUI"
                className="input-field uppercase"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              />
              <p className="mt-1 text-xs text-gray-400">ใช้รหัสสั้น ๆ เพื่อแยกประเภทและค้นหาได้ง่าย</p>
            </div>
            <div>
              <label className="label font-bold text-gray-700">ชื่อประเภท</label>
              <input
                type="text"
                required
                placeholder="เช่น ค่าเทอม"
                className="input-field"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <p className="mt-1 text-xs text-gray-400">ใช้ชื่อที่คนในโรงเรียนอ่านแล้วเข้าใจทันที</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label font-bold text-gray-700">เลขนำหน้าใบเสร็จ</label>
              <input
                type="text"
                required
                placeholder="เช่น RCT-"
                className="input-field uppercase"
                value={formData.prefix}
                onChange={(e) => setFormData({ ...formData, prefix: e.target.value.toUpperCase() })}
              />
              <p className="mt-1 text-xs text-gray-400">จะอยู่หน้าหมายเลขใบเสร็จ เช่น RCT-0001</p>
            </div>
            <div>
              <label className="label font-bold text-gray-700">เลขเริ่มต้น/ปัจจุบัน</label>
              <input
                type="number"
                required
                min="1"
                className="input-field"
                value={formData.current_number}
                onChange={(e) => setFormData({ ...formData, current_number: Number(e.target.value) })}
              />
              <p className="mt-1 text-xs text-gray-400">กำหนดเลขรันถัดไปของใบเสร็จ</p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="is_active"
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            />
            <label htmlFor="is_active" className="font-bold text-gray-700 cursor-pointer">
              เปิดใช้งาน
            </label>
          </div>

          <div className="pt-6 flex gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 rounded-xl bg-gray-100 px-4 py-2 font-bold text-gray-600 transition-colors hover:bg-gray-200"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-primary-600 px-4 py-2 font-bold text-white shadow-lg shadow-primary-500/30 transition-all hover:bg-primary-700 active:scale-95"
            >
              บันทึก
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
