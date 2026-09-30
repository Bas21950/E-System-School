'use client';

import { Student } from '../types/student';
import { HiOutlinePencilSquare, HiOutlineTrash, HiOutlineEye } from 'react-icons/hi2';

interface StudentTableProps {
  students: Student[];
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
  onView: (student: Student) => void;
  loading?: boolean;
  page?: number;
  limit?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

export default function StudentTable({
  students, onEdit, onDelete, onView, loading,
  page = 1, limit = 10, total = 0, onPageChange, onLimitChange,
}: StudentTableProps) {
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, total);
  const visiblePages = 5;

  const getPageNumbers = () => {
    if (totalPages <= visiblePages) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const half = Math.floor(visiblePages / 2);
    let startPage = Math.max(1, page - half);
    let endPage = startPage + visiblePages - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - visiblePages + 1);
    }

    return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
  };

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-sky-600" />
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center bg-slate-50 text-slate-500">
        <svg className="mb-3 h-14 w-14 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <p className="text-base font-bold text-slate-600">ไม่พบข้อมูลนักเรียน</p>
        <p className="text-sm">ลองค้นหาด้วยเงื่อนไขอื่น หรือเพิ่มข้อมูลนักเรียนใหม่</p>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="border border-slate-200 px-2 py-2 text-left font-bold">ลำดับ</th>
              <th className="border border-slate-200 px-2 py-2 text-left font-bold">รหัสนักเรียน</th>
              <th className="border border-slate-200 px-2 py-2 text-left font-bold">ชื่อ-นามสกุล</th>
              <th className="border border-slate-200 px-2 py-2 text-center font-bold">เพศ</th>
              <th className="border border-slate-200 px-2 py-2 text-center font-bold">ชั้น</th>
              <th className="border border-slate-200 px-2 py-2 text-center font-bold">ห้อง</th>
              <th className="border border-slate-200 px-2 py-2 text-center font-bold">ปีการศึกษา</th>
              <th className="border border-slate-200 px-2 py-2 text-center font-bold">สถานะ</th>
              <th className="border border-slate-200 px-2 py-2 text-center font-bold">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-sky-50/50">
                <td className="border border-slate-200 px-2 py-2 text-xs text-slate-500">{student.sequence_no}</td>
                <td className="border border-slate-200 px-2 py-2 text-xs font-bold text-slate-800">{student.student_id}</td>
                <td className="border border-slate-200 px-2 py-2">
                  <div className="font-semibold text-slate-900">
                    {student.prefix || ''}{student.first_name} {student.last_name}
                  </div>
                </td>
                <td className="border border-slate-200 px-2 py-2 text-center">
                  <span className={student.gender === 'ชาย' ? 'badge-male' : student.gender === 'หญิง' ? 'badge-female' : 'badge-inactive'}>
                    {student.gender || '-'}
                  </span>
                </td>
                <td className="border border-slate-200 px-2 py-2 text-center text-xs font-semibold text-slate-800">
                  {student.room_info?.grade_info?.name || '-'}
                </td>
                <td className="border border-slate-200 px-2 py-2 text-center text-xs font-semibold text-slate-800">
                  {student.room_info?.room_number ? `${student.room_info.room_number}` : '-'}
                </td>
                <td className="border border-slate-200 px-2 py-2 text-center text-xs text-slate-600">
                  {student.academic_year_info?.year || '-'}
                </td>
                <td className="border border-slate-200 px-2 py-2 text-center">
                  <span className={student.status === 'กำลังศึกษาอยู่' ? 'badge-active' : 'badge-inactive'}>
                    {student.status}
                  </span>
                </td>
                <td className="border border-slate-200 px-2 py-2">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => onView(student)}
                      className="rounded-sm p-1 text-sky-700 transition-colors hover:bg-sky-100"
                      title="ดูข้อมูล"
                    >
                      <HiOutlineEye size={15} />
                    </button>
                    <button
                      onClick={() => onEdit(student)}
                      className="rounded-sm p-1 text-indigo-700 transition-colors hover:bg-indigo-100"
                      title="แก้ไข"
                    >
                      <HiOutlinePencilSquare size={15} />
                    </button>
                    <button
                      onClick={() => onDelete(student)}
                      className="rounded-sm p-1 text-rose-700 transition-colors hover:bg-rose-100"
                      title="ลบ"
                    >
                      <HiOutlineTrash size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > 0 && onPageChange && onLimitChange && (
        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span>แสดง {startIndex}-{endIndex} จาก {total} รายการ</span>
            <div className="flex items-center gap-2">
              <span>แสดง:</span>
              <select
                className="rounded-sm border border-slate-300 px-2 py-1 text-sm"
                value={limit}
                onChange={(e) => onLimitChange(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="rounded-sm border border-slate-300 bg-white px-3 py-1 text-sm disabled:opacity-50"
            >
              ก่อนหน้า
            </button>
            {getPageNumbers().map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`h-8 min-w-8 rounded-sm px-2 text-sm ${
                  page === pageNum ? 'bg-sky-700 text-white' : 'bg-white text-slate-700 border border-slate-300'
                }`}
              >
                {pageNum}
              </button>
            ))}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages || totalPages === 0}
              className="rounded-sm border border-slate-300 bg-white px-3 py-1 text-sm disabled:opacity-50"
            >
              ถัดไป
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
