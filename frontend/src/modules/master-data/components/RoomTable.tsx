'use client';

import { Room, GradeLevel } from '@/types/master-data';
import { HiOutlinePencilSquare, HiOutlineTrash } from 'react-icons/hi2';

interface RoomTableProps {
  data: Room[];
  gradeLevels: GradeLevel[];
  onEdit: (item: Room) => void;
  onDelete: (item: Room) => void;
  loading?: boolean;
}

export default function RoomTable({ data, gradeLevels, onEdit, onDelete, loading }: RoomTableProps) {
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
        <p className="text-lg font-medium text-gray-600">ไม่พบข้อมูลห้องเรียน</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 border-b border-gray-100 font-bold">
            <tr>
              <th className="px-3 py-2 text-xs">ห้องเรียน</th>
              <th className="px-3 py-2 text-xs">เลขห้อง/รหัส</th>
              <th className="px-3 py-2 text-xs">ระดับชั้น</th>
              <th className="px-3 py-2 text-xs text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => {
              const grade = gradeLevels.find(g => g.id === item.grade_id);
              return (
                <tr key={item.id} className="bg-white border-b border-gray-50 hover:bg-primary-50/30 transition-colors">
                  <td className="px-3 py-1.5 font-bold text-gray-900 text-base">ห้องที่ {item.room_number}</td>
                  <td className="px-3 py-1.5">
                     <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[11px] font-bold border border-indigo-100">{item.room_code || '-'}</span>
                  </td>
                  <td className="px-3 py-1.5 text-gray-600 font-medium text-sm">
                    {grade?.name || '-'}
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
