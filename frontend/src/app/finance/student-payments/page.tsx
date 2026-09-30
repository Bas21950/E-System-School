'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import LegacyStudentPaymentsPage from './page.legacy';
import { useStudents } from '@/modules/students/hooks/useStudents';
import { api } from '@/lib/api';
import {
  HiOutlineArrowRightCircle,
  HiOutlineMagnifyingGlass,
  HiOutlineBanknotes,
} from 'react-icons/hi2';

const USE_LEGACY_STUDENT_PAYMENT_LIST = false;

export default function StudentPaymentsPage() {
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [search, setSearch] = useState('');

  const {
    students: hookStudents,
    loading: hookLoading,
    filterOptions,
  } = useStudents({
    academicYearId: selectedYear,
    room: selectedRoom,
    search,
    limit: 100,
  });

  const [balances, setBalances] = useState<Record<string, number>>({});
  const [loadingBalances, setLoadingBalances] = useState(false);

  useEffect(() => {
    const years = filterOptions?.academicYears;
    if (years && years.length > 0 && !selectedYear) {
      const currentYear = years.find((y) => y.is_current) || years[0];
      setSelectedYear(currentYear.id);
    }

    const grades = filterOptions?.grades;
    if (grades && grades.length > 0 && !selectedGrade) {
      const defaultGrade = grades.find((g) => g.name === 'อนุบาล 1') || grades[0];
      setSelectedGrade(defaultGrade.id);
    }
  }, [filterOptions?.academicYears, filterOptions?.grades, selectedYear, selectedGrade]);

  useEffect(() => {
    if (selectedGrade && !selectedRoom) {
      const rooms = filterOptions?.rooms?.filter((r) => r.grade_id === selectedGrade);
      if (rooms && rooms.length > 0) {
        const defaultRoom = rooms.find((r) => r.room_number === '1') || rooms[0];
        setSelectedRoom(defaultRoom.id);
      }
    }
  }, [selectedGrade, filterOptions?.rooms, selectedRoom]);

  const loadBalances = useCallback(async () => {
    if (!selectedRoom) {
      setBalances({});
      return;
    }

    setLoadingBalances(true);
    try {
      const balancesRes = await api.get<{ data: Record<string, number> }>(
        `/finance/fees/rooms/${selectedRoom}/balances`
      );
      setBalances(balancesRes.data || {});
    } catch (error) {
      console.error(`Failed to fetch balances for room ${selectedRoom}`, error);
      setBalances({});
    } finally {
      setLoadingBalances(false);
    }
  }, [selectedRoom]);

  useEffect(() => {
    void loadBalances();
  }, [loadBalances]);

  if (USE_LEGACY_STUDENT_PAYMENT_LIST) {
    return <LegacyStudentPaymentsPage />;
  }

  const filteredRooms = filterOptions?.rooms?.filter(
    (room) => !selectedGrade || room.grade_id === selectedGrade
  );

  const students = hookStudents;
  const loading = hookLoading;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="rounded-sm border border-sky-200 bg-white shadow-sm">
        <div className="bg-gradient-to-b from-sky-500 to-sky-600 px-5 py-3 text-xl font-bold text-white">
          รับชำระเงินนักเรียน
        </div>
        <div className="grid gap-4 px-5 py-4 lg:grid-cols-[140px_minmax(0,1fr)_200px_200px]">
          <div className="flex items-center justify-center rounded-sm border border-slate-200 bg-slate-50 text-sky-700">
            <HiOutlineBanknotes size={44} />
          </div>
          <div>
            <div className="text-2xl font-bold text-sky-800">รับชำระเงิน ภาคเรียน / ปีการศึกษา</div>
            <div className="mt-1 text-sm text-slate-500">
              เลือกห้องเรียน ค้นหานักเรียน และเปิดหน้ารับชำระเงินรายบุคคล
            </div>
          </div>
          <div>
            <div className="mb-1 text-xs font-bold text-slate-500">ปีการศึกษา</div>
            <select
              className="w-full rounded-sm border border-slate-300 px-3 py-2 text-sm"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="">เลือกปีการศึกษา</option>
              {filterOptions?.academicYears?.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.year}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="mb-1 text-xs font-bold text-slate-500">ค้นหานักเรียน</div>
            <div className="relative">
              <HiOutlineMagnifyingGlass
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ชื่อหรือรหัสนักเรียน"
                className="w-full rounded-sm border border-slate-300 px-10 py-2 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <div className="mb-1 text-xs font-bold text-slate-500">ระดับชั้น</div>
          <select
            className="w-full rounded-sm border border-slate-300 px-3 py-2 text-sm"
            value={selectedGrade}
            onChange={(e) => {
              setSelectedGrade(e.target.value);
              setSelectedRoom('');
            }}
          >
            <option value="">เลือกระดับชั้น</option>
            {filterOptions?.grades?.map((grade) => (
              <option key={grade.id} value={grade.id}>
                {grade.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="mb-1 text-xs font-bold text-slate-500">ห้องเรียน</div>
          <select
            className="w-full rounded-sm border border-slate-300 px-3 py-2 text-sm"
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            disabled={!selectedGrade}
          >
            <option value="">เลือกห้องเรียน</option>
            {filteredRooms?.map((room) => (
              <option key={room.id} value={room.id}>
                ห้อง {room.room_number}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <div className="w-full rounded-sm border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
            แสดงข้อมูลตามปีการศึกษาและห้องเรียนที่เลือก
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-sm border border-sky-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-sky-100 bg-sky-50 px-4 py-3">
          <div className="text-lg font-bold text-sky-800">รายการนักเรียนในห้อง</div>
          <div className="text-sm text-slate-500">
            ทั้งหมด {students.length.toLocaleString()} รายการ
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">กำลังโหลดข้อมูล...</div>
        ) : !selectedRoom ? (
          <div className="p-12 text-center text-slate-500">กรุณาเลือกห้องเรียนก่อน</div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-slate-500">ไม่พบข้อมูลนักเรียน</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-700">
                  <th className="border border-slate-200 px-3 py-2 text-left">#</th>
                  <th className="border border-slate-200 px-3 py-2 text-left">รหัสนักเรียน</th>
                  <th className="border border-slate-200 px-3 py-2 text-left">ชื่อ-นามสกุล</th>
                  <th className="border border-slate-200 px-3 py-2 text-left">ระดับชั้น</th>
                  <th className="border border-slate-200 px-3 py-2 text-left">ห้อง</th>
                  <th className="border border-slate-200 px-3 py-2 text-right">ยอดค้างชำระ</th>
                  <th className="border border-slate-200 px-3 py-2 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
                  <tr key={student.id} className="hover:bg-sky-50/50">
                    <td className="border border-slate-200 px-3 py-2">{index + 1}</td>
                    <td className="border border-slate-200 px-3 py-2 font-medium text-slate-800">
                      {student.student_id}
                    </td>
                    <td className="border border-slate-200 px-3 py-2 font-semibold text-sky-800">
                      {student.first_name} {student.last_name}
                    </td>
                    <td className="border border-slate-200 px-3 py-2">
                      {student.room_info?.grade_info?.name || '-'}
                    </td>
                    <td className="border border-slate-200 px-3 py-2">
                      {student.room_info?.room_number || '-'}
                    </td>
                    <td className="border border-slate-200 px-3 py-2 text-right font-bold">
                      {loadingBalances ? (
                        '...'
                      ) : balances[student.id] === undefined ? (
                        <span className="text-slate-500">ยังไม่ออกบิล</span>
                      ) : balances[student.id] > 0 ? (
                        <span className="text-rose-600">
                          {balances[student.id].toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-emerald-600">ชำระครบ</span>
                      )}
                    </td>
                    <td className="border border-slate-200 px-3 py-2 text-center">
                      <Link
                        href={`/finance/student-payments/${student.id}`}
                        className="inline-flex items-center gap-1 rounded-sm border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-800 hover:bg-sky-100"
                      >
                        <HiOutlineArrowRightCircle size={16} />
                        เปิดรายการ
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
