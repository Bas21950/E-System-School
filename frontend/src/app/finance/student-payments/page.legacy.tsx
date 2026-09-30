'use client';

import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { useStudents } from '@/modules/students/hooks/useStudents';
import { api } from '@/lib/api';
import Link from 'next/link';
import { HiOutlineMagnifyingGlass, HiOutlineArrowRightCircle } from 'react-icons/hi2';

export default function StudentPaymentsPage() {
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');

  const { 
    students: hookStudents, 
    loading: hookLoading, 
    filterOptions 
  } = useStudents({ 
    academicYearId: selectedYear, 
    room: selectedRoom, 
    limit: 100 
  });
  
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [loadingBalances, setLoadingBalances] = useState(false);

  // Set defaults: ปีการศึกษาปัจจุบัน, อนุบาล 1, ห้อง 1
  useEffect(() => {
    const years = filterOptions?.academicYears;
    if (years && years.length > 0 && !selectedYear) {
      // เลือกปีที่ตั้งเป็นปีปัจจุบัน หรือปีแรกในลิสต์
      const currentYear = years.find(y => y.is_current) || years[0];
      setSelectedYear(currentYear.id);
    }

    const grades = filterOptions?.grades;
    if (grades && grades.length > 0 && !selectedGrade) {
      // หา "อนุบาล 1" หรือใช้ตัวแรก
      const defaultGrade = grades.find(g => g.name === 'อนุบาล 1') || grades[0];
      setSelectedGrade(defaultGrade.id);
    }
  }, [filterOptions?.academicYears, filterOptions?.grades, selectedYear, selectedGrade]);

  // Set default room to ห้อง 1 เมื่อเลือกระดับชั้นแล้ว
  useEffect(() => {
    if (selectedGrade && !selectedRoom) {
      const rooms = filterOptions?.rooms?.filter(r => r.grade_id === selectedGrade);
      if (rooms && rooms.length > 0) {
        // หาห้อง 1 หรือใช้ห้องแรก
        const defaultRoom = rooms.find(r => r.room_number === '1') || rooms[0];
        setSelectedRoom(defaultRoom.id);
      }
    }
  }, [selectedGrade, filterOptions?.rooms, selectedRoom]);
  
  // Fetch balances for all students in the room via batch endpoint
  const loadBalances = useCallback(async () => {
    if (!selectedRoom) {
      setBalances({});
      return;
    }
    
    setLoadingBalances(true);
    try {
      const balancesRes = await api.get<{ data: Record<string, number> }>(`/finance/fees/rooms/${selectedRoom}/balances`);
      setBalances(balancesRes.data || {});
    } catch (e) {
      console.error(`Failed to fetch balances for room ${selectedRoom}`, e);
      setBalances({});
    } finally {
      setLoadingBalances(false);
    }
  }, [selectedRoom]);

  useEffect(() => {
    loadBalances();
  }, [loadBalances]);

  const students = hookStudents;
  const loading = hookLoading;

  const filteredRooms = filterOptions?.rooms?.filter(
    (r) => !selectedGrade || r.grade_id === selectedGrade
  );

  return (
    <div className="animate-fade-in space-y-6">
      <Header
        title="ชำระเงินนักเรียน (Student Payments)"
        subtitle="จัดการการเงินของนักเรียนทั้งหมด แสดงยอดค้างชำระและประวัติ"
      />

      {/* Filters */}
      <div className="glass-card p-5">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <HiOutlineMagnifyingGlass className="text-primary-600" />
          ค้นหานักเรียนตามห้องเรียน
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">ปีการศึกษา</label>
            <select
              className="select-field bg-white"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="">เลือกปีการศึกษา</option>
              {filterOptions?.academicYears?.map((y) => (
                <option key={y.id} value={y.id}>{y.year}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">ระดับชั้น</label>
            <select
              className="select-field bg-white"
              value={selectedGrade}
              onChange={(e) => { setSelectedGrade(e.target.value); setSelectedRoom(''); }}
            >
              <option value="">เลือกระดับชั้น</option>
              {filterOptions?.grades?.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">ห้องเรียน</label>
            <select
              className="select-field bg-white"
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              disabled={!selectedGrade}
            >
              <option value="">เลือกห้องเรียน</option>
              {filteredRooms?.map((r) => (
                <option key={r.id} value={r.id}>ห้อง {r.room_number}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Student List */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-10 flex justify-center text-primary-600">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : selectedRoom ? (
          students.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-gray-600 font-bold border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3">รหัสนักเรียน</th>
                    <th className="px-4 py-3">ชื่อ - นามสกุล</th>
                    <th className="px-4 py-3">ชั้น</th>
                    <th className="px-4 py-3">ห้อง</th>
                    <th className="px-4 py-3 text-right">ยอดคงเหลือ</th>
                    <th className="px-4 py-3 text-center w-32">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-primary-50/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{student.student_id}</td>
                      <td className="px-4 py-3 font-bold text-primary-700">{student.first_name} {student.last_name}</td>
                      <td className="px-4 py-3 text-gray-600">{student.room_info?.grade_info?.name || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{student.room_info?.room_number || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        {loadingBalances ? (
                           <div className="inline-block w-16 h-4 bg-gray-200 animate-pulse rounded"></div>
                        ) : balances[student.id] > 0 ? (
                          <span className="font-black text-rose-500">{balances[student.id].toLocaleString()} ฿</span>
                        ) : (
                          <span className="font-bold text-emerald-500">ครบถ้วน</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link 
                          href={`/finance/student-payments/${student.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 hover:bg-primary-600 hover:text-white rounded-lg text-xs font-bold transition-colors"
                        >
                          <HiOutlineArrowRightCircle size={16} />
                          ดูการเงิน
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center text-gray-500">
              ไม่มีข้อมูลนักเรียนในห้องนี้
            </div>
          )
        ) : (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-gray-300">
              <HiOutlineMagnifyingGlass size={32} className="text-gray-300" />
            </div>
            <p className="text-gray-500 font-bold">กรุณาเลือก ระดับชั้น และ ห้องเรียน</p>
            <p className="text-xs text-gray-400 mt-1">เพื่อแสดงรายชื่อนักเรียนในห้อง</p>
          </div>
        )}
      </div>

    </div>
  );
}
