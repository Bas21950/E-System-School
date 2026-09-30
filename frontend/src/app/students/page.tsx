'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { HiOutlinePlus } from 'react-icons/hi2';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Modal from '@/components/ui/Modal';
import StudentDetail from '@/modules/students/components/StudentDetail';
import StudentFilters from '@/modules/students/components/StudentFilters';
import StudentForm from '@/modules/students/components/StudentForm';
import ImportStudents from '@/modules/students/components/ImportStudents';
import StudentTable from '@/modules/students/components/StudentTable';
import { useStudents } from '@/modules/students/hooks/useStudents';
import type { CreateStudentInput, Student } from '@/modules/students/types/student';
import { exportStudentsCsv } from '@/modules/students/utils/exportCsv';

interface PageFilters extends Record<string, unknown> {
  search?: string;
  academicYearId?: string;
  grade?: string;
  room?: string;
  status?: string;
  page: number;
  limit: number;
}

function StudentsPage() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<PageFilters>({ page: 1, limit: 10 });

  const {
    students,
    total,
    loading,
    filterOptions,
    fetchStudents,
    fetchFilterOptions,
    createStudent,
    updateStudent,
    deleteStudent,
  } = useStudents(filters);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    student: Student | null;
  }>({
    isOpen: false,
    student: null,
  });

  useEffect(() => {
    if (searchParams.get('import') === 'true') {
      setIsImportOpen(true);
    }
  }, [searchParams]);

  const handleSearch = useCallback((newFilters: Partial<PageFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  }, []);

  const handleLimitChange = useCallback((newLimit: number) => {
    setFilters((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  }, []);

  const handleExport = useCallback(() => {
    exportStudentsCsv(students);
  }, [students]);

  const handleFormSubmit = async (data: CreateStudentInput) => {
    const result = editingStudent
      ? await updateStudent(editingStudent.id, data)
      : await createStudent(data);

    if (result.success) {
      setIsFormOpen(false);
      fetchStudents();
      fetchFilterOptions();
    }

    return result;
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.student) {
      return;
    }

    const result = await deleteStudent(deleteConfirm.student.id);
    if (result.success) {
      setDeleteConfirm({ isOpen: false, student: null });
      fetchStudents();
    } else {
      console.error('Delete failed:', result.error);
    }
  };

  return (
    <div className="animate-fade-in space-y-4">
      <div className="overflow-hidden rounded-sm border border-sky-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-sky-100 bg-gradient-to-b from-sky-500 to-sky-700 px-5 py-3 text-white lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xl font-bold">รายชื่อนักเรียน</div>
            <div className="mt-1 text-sm text-sky-50">ฐานข้อมูลนักเรียนทั้งหมดในระบบ ({total} คน)</div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setEditingStudent(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-sm border border-white/20 bg-white px-4 py-2 text-sm font-bold text-sky-800 transition hover:bg-sky-50"
            >
              <HiOutlinePlus size={18} />
              <span>เพิ่มนักเรียนใหม่</span>
            </button>
            <button
              onClick={() => setIsImportOpen(true)}
              className="rounded-sm border border-white/30 bg-sky-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-sky-800"
            >
              นำเข้า Excel
            </button>
          </div>
        </div>

        <div className="p-4">
          <StudentFilters
            onSearch={handleSearch}
            onExport={handleExport}
            exportDisabled={students.length === 0}
            filterOptions={filterOptions}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-sm border border-sky-200 bg-white shadow-sm">
        <div className="overflow-hidden">
          <StudentTable
            students={students}
            loading={loading}
            onEdit={(student) => {
              setEditingStudent(student);
              setIsFormOpen(true);
            }}
            onDelete={(student) => setDeleteConfirm({ isOpen: true, student })}
            onView={(student) => setViewingStudent(student)}
            page={filters.page}
            limit={filters.limit}
            total={total}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
          />
        </div>
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingStudent ? 'แก้ไขข้อมูลนักเรียน' : 'เพิ่มนักเรียนใหม่'}
        size="xl"
      >
        <StudentForm
          initialData={editingStudent}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsFormOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="นำเข้าข้อมูลนักเรียนด้วย Excel"
        size="lg"
      >
        <ImportStudents
          onComplete={() => {
            setIsImportOpen(false);
            fetchStudents();
            fetchFilterOptions();
          }}
          onCancel={() => setIsImportOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={!!viewingStudent}
        onClose={() => setViewingStudent(null)}
        title="ประวัตินักเรียน"
        size="xl"
        rootClassName="student-document-modal-overlay"
        panelClassName="student-document-modal-panel"
        contentClassName="student-document-modal-body"
      >
        {viewingStudent && (
          <StudentDetail student={viewingStudent} onClose={() => setViewingStudent(null)} />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, student: null })}
        onConfirm={handleDeleteConfirm}
        title="ยืนยันการลบข้อมูล"
        message={`คุณต้องการลบข้อมูลของ ${deleteConfirm.student?.first_name} ${deleteConfirm.student?.last_name} ใช่หรือไม่? การกระทำนี้ไม่สามารถกู้คืนได้`}
        confirmText="ลบข้อมูล"
      />
    </div>
  );
}

export default function StudentsPageWrapper() {
  return (
    <Suspense fallback={<div className="animate-pulse p-6 text-center text-gray-500">กำลังโหลดผลลัพธ์การค้นหา...</div>}>
      <StudentsPage />
    </Suspense>
  );
}
