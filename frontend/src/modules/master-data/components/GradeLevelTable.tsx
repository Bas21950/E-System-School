'use client';

import { GradeLevel, EducationLevel } from '@/types/master-data';
import { HiOutlinePencilSquare, HiOutlineTrash } from 'react-icons/hi2';

interface GradeLevelTableProps {
  data: GradeLevel[];
  educationLevels: EducationLevel[];
  onEdit: (item: GradeLevel) => void;
  onDelete: (item: GradeLevel) => void;
  loading?: boolean;
}

export default function GradeLevelTable({ data, educationLevels, onEdit, onDelete, loading }: GradeLevelTableProps) {
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
        <p className="text-lg font-medium text-gray-600">ไม่พบข้อมูลระดับชั้น</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 border-b border-gray-100 font-bold">
            <tr>
              <th className="px-3 py-2 text-xs">ชื่อระดับชั้น</th>
              <th className="px-3 py-2 text-xs">อักษรย่อ</th>
              <th className="px-3 py-2 text-xs">ระดับการศึกษา</th>
              <th className="px-3 py-2 text-xs text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => {
              const eduLevel = educationLevels.find(el => el.id === item.level_id);
              return (
                <tr key={item.id} className="bg-white border-b border-gray-50 hover:bg-primary-50/30 transition-colors">
                  <td className="px-3 py-1.5 font-bold text-gray-900">{item.name}</td>
                  <td className="px-3 py-1.5">
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-600 text-[11px] font-bold uppercase">{item.short_name}</span>
                  </td>
                  <td className="px-3 py-1.5 text-gray-500 italic text-sm">
                    {eduLevel?.name || '-'}
                  </td>
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
