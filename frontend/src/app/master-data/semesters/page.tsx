'use client';

import { useEffect, useState } from 'react';
import { HiOutlinePlus } from 'react-icons/hi2';
import Header from '@/components/layout/Header';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useMasterData } from '@/hooks/useMasterData';
import { Semester } from '@/types/master-data';
import SemesterTable from '@/modules/master-data/components/SemesterTable';
import SemesterForm from '@/modules/master-data/components/SemesterForm';

export default function SemestersPage() {
  const { data, loading, fetchData, create, update, remove } = useMasterData<Semester>('/semesters');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Semester | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; item: Semester | null }>({
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

  const openEditForm = (item: Semester) => {
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

  const openDeleteConfirm = (item: Semester) => {
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
        title="จัดการภาคเรียน (Semesters)" 
        subtitle="จัดการข้อมูลภาคเรียนในแต่ละปีการศึกษาเพื่อกำหนดช่วงเวลาการเรียน"
      >
        <button 
          onClick={openAddForm}
          className="btn-primary flex items-center gap-2 shadow-lg shadow-primary-500/20"
        >
          <HiOutlinePlus size={20} />
          <span>เพิ่มภาคเรียนใหม่</span>
        </button>
      </Header>

      <div className="glass-card mt-6">
        <SemesterTable 
          data={data} 
          loading={loading} 
          onEdit={openEditForm} 
          onDelete={openDeleteConfirm} 
        />
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingItem ? '✏️ แก้ไขข้อมูลภาคเรียน' : '✨ เพิ่มภาคเรียนใหม่'}
        size="md"
      >
        <SemesterForm 
          initialData={editingItem}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsFormOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, item: null })}
        onConfirm={handleDeleteConfirm}
        title="ยืนยันการลบภาคเรียน"
        message={`คุณต้องการลบภาคเรียนที่ ${deleteConfirm.item?.semester} ใช่หรือไม่? การกระทำนี้ไม่สามารถกู้คืนได้`}
        confirmText="ลบข้อมูล"
      />
    </div>
  );
}
