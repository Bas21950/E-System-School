'use client';

import { useState } from 'react';
import { HiOutlineArrowDownTray, HiOutlineMagnifyingGlass } from 'react-icons/hi2';

interface StudentFiltersProps {
  onSearch: (filters: {
    search?: string;
    academicYearId?: string;
    grade?: string;
    room?: string;
    status?: string;
  }) => void;
  onExport: () => void;
  exportDisabled?: boolean;
  filterOptions?: {
    grades: { id: string; name: string }[];
    rooms: { id: string; room_number: string; grade_id: string }[];
    academicYears?: { id: string; year: string }[];
  };
}

export default function StudentFilters({
  onSearch,
  onExport,
  exportDisabled,
  filterOptions,
}: StudentFiltersProps) {
  const [search, setSearch] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [grade, setGrade] = useState('');
  const [room, setRoom] = useState('');
  const [status, setStatus] = useState('');

  const applyFilters = (next?: Partial<{
    search: string;
    academicYearId: string;
    grade: string;
    room: string;
    status: string;
  }>) => {
    onSearch({
      search: next?.search ?? search,
      academicYearId: next?.academicYearId ?? academicYearId,
      grade: next?.grade ?? grade,
      room: next?.room ?? room,
      status: next?.status ?? status,
    });
  };

  const handleReset = () => {
    setSearch('');
    setAcademicYearId('');
    setGrade('');
    setRoom('');
    setStatus('');
    onSearch({ search: '', academicYearId: '', grade: '', room: '', status: '' });
  };

  const statusOptions = [
    { label: 'ทั้งหมด', value: '' },
    { label: 'กำลังศึกษาอยู่', value: 'กำลังศึกษาอยู่' },
    { label: 'สำเร็จการศึกษา', value: 'สำเร็จการศึกษา' },
    { label: 'ลาออก', value: 'ลาออก' },
    { label: 'พักการเรียน', value: 'พักการเรียน' },
  ];

  return (
    <div className="space-y-3">
      <div className="grid gap-2 lg:grid-cols-[minmax(0,1.6fr)_180px_180px_180px_150px_auto]">
        <div className="relative">
          <HiOutlineMagnifyingGlass
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <input
            type="text"
            className="w-full rounded-sm border border-slate-300 px-9 py-2 text-sm"
            placeholder="ค้นหาชื่อ หรือรหัสนักเรียน"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
          />
        </div>

        <select
          className="rounded-sm border border-slate-300 px-3 py-2 text-sm"
          value={academicYearId}
          onChange={(e) => {
            const value = e.target.value;
            setAcademicYearId(value);
            applyFilters({ academicYearId: value });
          }}
        >
          <option value="">ทุกปีการศึกษา</option>
          {filterOptions?.academicYears?.map((year) => (
            <option key={year.id} value={year.id}>
              {year.year}
            </option>
          ))}
        </select>

        <select
          className="rounded-sm border border-slate-300 px-3 py-2 text-sm"
          value={status}
          onChange={(e) => {
            const value = e.target.value;
            setStatus(value);
            applyFilters({ status: value });
          }}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          className="rounded-sm border border-slate-300 px-3 py-2 text-sm"
          value={grade}
          onChange={(e) => {
            const value = e.target.value;
            setGrade(value);
            setRoom('');
            applyFilters({ grade: value, room: '' });
          }}
        >
          <option value="">ทุกระดับชั้น</option>
          {filterOptions?.grades?.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>

        <select
          className="rounded-sm border border-slate-300 px-3 py-2 text-sm"
          value={room}
          onChange={(e) => {
            const value = e.target.value;
            setRoom(value);
            applyFilters({ room: value });
          }}
        >
          <option value="">ทุกห้อง</option>
          {(() => {
            if (grade) {
              return filterOptions?.rooms
                ?.filter((item) => item.grade_id === grade)
                ?.map((item) => (
                  <option key={item.id} value={item.id}>
                    ห้อง {item.room_number}
                  </option>
                ));
            }

            const uniqueRooms = Array.from(
              new Set(filterOptions?.rooms?.map((item) => item.room_number) || []),
            ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

            return uniqueRooms.map((roomNumber) => (
              <option key={`num-${roomNumber}`} value={`num:${roomNumber}`}>
                ห้อง {roomNumber}
              </option>
            ));
          })()}
        </select>

        <div className="flex gap-2">
          <button
            onClick={() => applyFilters()}
            className="rounded-sm bg-sky-700 px-4 py-2 text-sm font-bold text-white hover:bg-sky-800"
          >
            ค้นหา
          </button>
          <button
            onClick={handleReset}
            className="rounded-sm border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            ล้าง
          </button>
          <button
            onClick={onExport}
            disabled={exportDisabled}
            className="rounded-sm border border-emerald-300 bg-emerald-50 px-3 py-2 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
            title="Export CSV"
          >
            <HiOutlineArrowDownTray size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
