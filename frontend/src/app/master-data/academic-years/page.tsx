'use client';

import { useEffect, useState } from 'react';
import { HiOutlinePlus } from 'react-icons/hi2';
import Header from '@/components/layout/Header';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useMasterData } from '@/hooks/useMasterData';
import { AcademicYear } from '@/types/master-data';
import AcademicYearTable from '@/modules/master-data/components/AcademicYearTable';
import AcademicYearForm from '@/modules/master-data/components/AcademicYearForm';

export default function AcademicYearsPage() {
  const { data, loading, fetchData, create, update, remove } = useMasterData<AcademicYear>('/academic-years');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AcademicYear | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; item: AcademicYear | null }>({
    isOpen: false,
    item: null
  });

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openAddForm = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const openEditForm = (item: AcademicYear) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (formData: unknown) => {
    let result;
    if (editingItem) {
      result = await update(editingItem.id, formData);
    } else {
      result = await create(formData);
    }

    if (result.success) {
      setIsFormOpen(false);
    }
    return result;
  };

  const openDeleteConfirm = (item: AcademicYear) => {
    setDeleteConfirm({ isOpen: true, item });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.item) return;
    const result = await remove(deleteConfirm.item.id);
    if (result.success) {
      setDeleteConfirm({ isOpen: false, item: null });
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <Header 
        title="จัดการปีการศึกษา (Academic Years)" 
        subtitle="จัดการตั้งแปรปีการศึกษาของระบบและกำหนดปีปัจจุบันสำหรับการประมวลผล"
      >
        <button 
          onClick={openAddForm}
          className="btn-primary flex items-center gap-2 shadow-lg shadow-primary-500/20"
        >
          <HiOutlinePlus size={20} />
          <span>เพิ่มปีการศึกษาใหม่</span>
        </button>
      </Header>

      <div className="glass-card mt-6">
        <AcademicYearTable 
          data={data} 
          loading={loading} 
          onEdit={openEditForm} 
          onDelete={openDeleteConfirm} 
        />
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingItem ? '✏️ แก้ไขปีการศึกษา' : '✨ เพิ่มปีการศึกษาใหม่'}
        size="md"
      >
        <AcademicYearForm 
          initialData={editingItem}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsFormOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, item: null })}
        onConfirm={handleDeleteConfirm}
        title="ยืนยันการลบปีการศึกษา"
        message={`คุณต้องการลบปีการศึกษา "${deleteConfirm.item?.year}" ใช่หรือไม่? การกระทำนี้ไม่สามารถกู้คืนได้และอาจส่งผลต่อข้อมูลนักเรียนที่ผูกอยู่`}
        confirmText="ลบข้อมูล"
      />
    </div>
  );
}
