'use client';

import { Semester } from '@/types/master-data';
import { HiOutlinePencilSquare, HiOutlineTrash } from 'react-icons/hi2';
import { formatThaiDate } from '@/lib/dateUtils';

interface SemesterTableProps {
  data: Semester[];
  onEdit: (item: Semester) => void;
  onDelete: (item: Semester) => void;
  loading?: boolean;
}

export default function SemesterTable({ data, onEdit, onDelete, loading }: SemesterTableProps) {
  if (loading) {
    return (
      <div className="table-container min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="table-container min-h-[400px] flex flex-col items-center justify-center text-gray-500 bg-gray-50/50">
        <p className="text-lg font-medium text-gray-600">ไม่พบข้อมูลภาคเรียน</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 border-b border-gray-100 font-bold">
            <tr>
              <th className="px-3 py-2 text-xs">ปีการศึกษา</th>
              <th className="px-3 py-2 text-xs text-center">ภาคเรียน</th>
              <th className="px-3 py-2 text-xs">วันที่เริ่ม</th>
              <th className="px-3 py-2 text-xs">วันที่สิ้นสุด</th>
              <th className="px-3 py-2 text-xs text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item: Semester) => (
              <tr key={item.id} className="bg-white border-b border-gray-50 hover:bg-primary-50/30 transition-colors">
                <td className="px-3 py-1.5 font-bold text-gray-900 text-sm">{item.academic_year_info?.year || item.academic_year || '-'}</td>
                <td className="px-3 py-1.5 text-center">
                   <span className="inline-flex px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-[11px] font-bold">
                     ภาคเรียนที่ {item.semester}
                   </span>
                </td>
                <td className="px-3 py-1.5 text-sm">{formatThaiDate(item.start_date)}</td>
                <td className="px-3 py-1.5 text-sm">{formatThaiDate(item.end_date)}</td>
                <td className="px-3 py-1.5">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => onEdit(item)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors">
                      <HiOutlinePencilSquare size={16} />
                    </button>
                    <button onClick={() => onDelete(item)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors">
                      <HiOutlineTrash size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
