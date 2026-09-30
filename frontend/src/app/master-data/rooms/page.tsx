'use client';

import { useEffect, useState } from 'react';
import { HiOutlinePlus } from 'react-icons/hi2';
import Header from '@/components/layout/Header';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useMasterData } from '@/hooks/useMasterData';
import { Room, GradeLevel } from '@/types/master-data';
import RoomTable from '@/modules/master-data/components/RoomTable';
import RoomForm from '@/modules/master-data/components/RoomForm';

export default function RoomsPage() {
  const { data, loading, fetchData, create, update, remove } = useMasterData<Room>('/rooms');
  const { data: gradeLevels, fetchData: fetchGradeLevels } = useMasterData<GradeLevel>('/grade-levels');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Room | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; item: Room | null }>({
    isOpen: false,
    item: null
  });

  useEffect(() => {
    fetchData();
    fetchGradeLevels();
  }, [fetchData, fetchGradeLevels]);

  const openAddForm = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const openEditForm = (item: Room) => {
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

  const openDeleteConfirm = (item: Room) => {
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
        title="จัดการห้องเรียน (Classrooms)" 
        subtitle="กำหนดรายชื่อห้องเรียนและครูประจำชั้นภายใต้แต่ละระดับชั้น"
      >
        <button 
          onClick={openAddForm}
          className="btn-primary flex items-center gap-2 shadow-lg shadow-primary-500/20"
        >
          <HiOutlinePlus size={20} />
          <span>เพิ่มห้องเรียนใหม่</span>
        </button>
      </Header>

      <div className="glass-card mt-6">
        <RoomTable 
          data={data} 
          gradeLevels={gradeLevels}
          loading={loading} 
          onEdit={openEditForm} 
          onDelete={openDeleteConfirm} 
        />
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingItem ? '✏️ แก้ไขข้อมูลห้องเรียน' : '✨ เพิ่มห้องเรียนใหม่'}
        size="md"
      >
        <RoomForm 
          initialData={editingItem}
          gradeLevels={gradeLevels}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsFormOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, item: null })}
        onConfirm={handleDeleteConfirm}
        title="ยืนยันการลบห้องเรียน"
        message={`คุณต้องการลบห้องเรียนหมายเลข "${deleteConfirm.item?.room_number}" ใช่หรือไม่? รอยืนยันว่าไม่มีนักเรียนอยู่ในห้องนี้ก่อนดำเนินการ`}
        confirmText="ลบข้อมูล"
      />
    </div>
  );
}
