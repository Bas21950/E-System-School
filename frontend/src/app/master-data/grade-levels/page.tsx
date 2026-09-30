'use client';

import { useEffect, useState } from 'react';
import { HiOutlinePlus } from 'react-icons/hi2';
import Header from '@/components/layout/Header';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useMasterData } from '@/hooks/useMasterData';
import { GradeLevel, EducationLevel } from '@/types/master-data';
import GradeLevelTable from '@/modules/master-data/components/GradeLevelTable';
import GradeLevelForm from '@/modules/master-data/components/GradeLevelForm';

export default function GradeLevelsPage() {
  const { data, loading, fetchData, create, update, remove } = useMasterData<GradeLevel>('/grade-levels');
  const { data: educationLevels, fetchData: fetchEduLevels } = useMasterData<EducationLevel>('/education-levels');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GradeLevel | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; item: GradeLevel | null }>({
    isOpen: false,
    item: null
  });

  useEffect(() => {
    fetchData();
    fetchEduLevels();
  }, [fetchData, fetchEduLevels]);

  const openAddForm = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const openEditForm = (item: GradeLevel) => {
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

  const openDeleteConfirm = (item: GradeLevel) => {
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
        title="จัดการระดับชั้น (Grade Levels)" 
        subtitle="จัดการตั้งค่าระดับชั้นเรียนแต่ละช่วงการศึกษา (เช่น ป.1, ป.2)"
      >
        <button 
          onClick={openAddForm}
          className="btn-primary flex items-center gap-2 shadow-lg shadow-primary-500/20"
        >
          <HiOutlinePlus size={20} />
          <span>เพิ่มระดับชั้น</span>
        </button>
      </Header>

      <div className="glass-card mt-6">
        <GradeLevelTable 
          data={data} 
          educationLevels={educationLevels}
          loading={loading} 
          onEdit={openEditForm} 
          onDelete={openDeleteConfirm} 
        />
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingItem ? '✏️ แก้ไขข้อมูลระดับชั้น' : '✨ เพิ่มระดับชั้นใหม่'}
        size="md"
      >
        <GradeLevelForm 
          initialData={editingItem}
          educationLevels={educationLevels}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsFormOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, item: null })}
        onConfirm={handleDeleteConfirm}
        title="ยืนยันการลบข้อมูล"
        message={`คุณต้องการลบระดับชั้น "${deleteConfirm.item?.name}" ใช่หรือไม่? การดำเนินการนี้จะส่งผลต่อห้องเรียนที่สังกัด`}
        confirmText="ลบข้อมูล"
      />
    </div>
  );
}
