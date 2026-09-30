'use client';

import { useEffect, useState } from 'react';
import { HiOutlinePlus } from 'react-icons/hi2';
import Header from '@/components/layout/Header';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useMasterData } from '@/hooks/useMasterData';
import { EducationLevel } from '@/types/master-data';
import EducationLevelTable from '@/modules/master-data/components/EducationLevelTable';
import EducationLevelForm from '@/modules/master-data/components/EducationLevelForm';

export default function EducationLevelsPage() {
  const { data, loading, fetchData, create, update, remove } = useMasterData<EducationLevel>('/education-levels');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EducationLevel | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; item: EducationLevel | null }>({
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

  const openEditForm = (item: EducationLevel) => {
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

  const openDeleteConfirm = (item: EducationLevel) => {
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
        title="ตั้งค่าระดับชั้นเรียน (Education Levels)" 
        subtitle="กำหนดช่วงชั้นการศึกษา (เช่น ประถมศึกษา, มัธยมศึกษา)"
      >
        <button 
          onClick={openAddForm}
          className="btn-primary flex items-center gap-2 shadow-lg shadow-primary-500/20"
        >
          <HiOutlinePlus size={20} />
          <span>เพิ่มระดับการศึกษา</span>
        </button>
      </Header>

      <div className="glass-card mt-6">
        <EducationLevelTable 
          data={data} 
          loading={loading} 
          onEdit={openEditForm} 
          onDelete={openDeleteConfirm} 
        />
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingItem ? '✏️ แก้ไขข้อมูลระดับการศึกษา' : '✨ เพิ่มระดับการศึกษาใหม่'}
        size="md"
      >
        <EducationLevelForm 
          initialData={editingItem}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsFormOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, item: null })}
        onConfirm={handleDeleteConfirm}
        title="ยืนยันการลบข้อมูล"
        message={`คุณแน่ใจหรือไม่ที่จะลบระดับการศึกษา "${deleteConfirm.item?.name}"? การดำเนินการนี้ไม่สามารถย้อนกลับได้`}
        confirmText="ลบข้อมูล"
      />
    </div>
  );
}
