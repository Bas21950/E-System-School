'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { 
  HiOutlineUserPlus, 
  HiMagnifyingGlass,
} from 'react-icons/hi2';
import { api } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import { toast } from 'react-hot-toast';

export default function EnrollmentPage() {
  const [academicYears, setAcademicYears] = useState<unknown[]>([]);
  const [grades, setGrades] = useState<unknown[]>([]);
  const [rooms, setRooms] = useState<unknown[]>([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [search, setSearch] = useState('');
  const [enrollments, setEnrollments] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [eligibleStudents, setEligibleStudents] = useState<unknown[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [targetRoomId, setTargetRoomId] = useState('');

  useEffect(() => {
    fetchMasterData();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      fetchEnrollments();
    }
  }, [selectedYear, selectedGrade, selectedRoom, search]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMasterData = async () => {
    try {
      const [yearsRes, gradesRes, roomsRes]: unknown[] = await Promise.all([
        api.get('/academic-years'),
        api.get('/grade-levels'),
        api.get('/rooms')
      ]);
      setAcademicYears((yearsRes as { data: unknown[] }).data);
      setGrades((gradesRes as { data: unknown[] }).data);
      setRooms((roomsRes as { data: unknown[] }).data);
      
      // Default to current year if exists
      const yData = (yearsRes as { data: { id: string; is_current: boolean }[] }).data;
      const current = yData.find(y => y.is_current);
      if (current) setSelectedYear(current.id);
      else if (yData.length > 0) setSelectedYear(yData[0].id);
    } catch (err: unknown) {
      console.error('Fetch baseline error:', err);
      toast.error('ไม่สามารถโหลดข้อมูลพื้นฐานได้');
    }
  };

  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        academicYearId: selectedYear,
        gradeId: selectedGrade,
        roomId: selectedRoom,
        search: search
      });
      const res: { data: unknown[] } = await api.get(`/enrollments?${params.toString()}`);
      setEnrollments(res.data);
    } catch (err: unknown) {
      console.error('Fetch enrollments error:', err);
      toast.error('ไม่สามารถโหลดข้อมูลการลงทะเบียนได้');
    } finally {
      setLoading(false);
    }
  };

  const fetchEligibleStudents = async () => {
    try {
      const res: { data: unknown[] } = await api.get(`/enrollments/eligible/${selectedYear}`);
      setEligibleStudents(res.data);
      setIsAddModalOpen(true);
    } catch (err: unknown) {
      console.error('Fetch eligible error:', err);
      toast.error('ไม่สามารถโหลดรายชื่อนักเรียนได้');
    }
  };

  const handleAddEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !targetRoomId) {
      toast.error('กรุณาเลือกนักเรียนและห้องเรียน');
      return;
    }

    try {
      await api.post('/enrollments', {
        student_id: selectedStudentId,
        academic_year_id: selectedYear,
        room_id: targetRoomId,
        status: 'active'
      });
      toast.success('ลงทะเบียนเรียบร้อย');
      setIsAddModalOpen(false);
      setSelectedStudentId('');
      setTargetRoomId('');
      fetchEnrollments();
    } catch {
      toast.error('การลงทะเบียนล้มเหลว');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Header 
        title="ลงทะเบียนเรียน" 
        subtitle="จัดการการสังกัดห้องเรียนของนักเรียนแยกตามปีการศึกษา"
      >
        <button 
          onClick={fetchEligibleStudents}
          className="btn-primary flex items-center gap-2"
        >
          <HiOutlineUserPlus size={20} />
          <span>ลงทะเบียนนักเรียนใหม่</span>
        </button>
      </Header>

      {/* Filters */}
      <div className="glass-card p-6 border-none shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-1 font-sans">ปีการศึกษา</label>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full bg-gray-50/50 border-gray-200 rounded-xl focus:ring-primary-500 focus:border-primary-500 transition-all font-sans"
            >
              {academicYears.map((y: unknown) => {
                const year = y as { id: string, year: string, is_current: boolean };
                return (
                  <option key={year.id} value={year.id}>{year.year} {year.is_current ? '(ปัจจุบัน)' : ''}</option>
                );
              })}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-1 font-sans">ระดับชั้น</label>
            <select 
              value={selectedGrade}
              onChange={(e) => {
                setSelectedGrade(e.target.value);
                setSelectedRoom('');
              }}
              className="w-full bg-gray-50/50 border-gray-200 rounded-xl focus:ring-primary-500 focus:border-primary-500 transition-all font-sans"
            >
              <option value="">ทั้งหมด</option>
              {grades.map((g: unknown) => {
                const grade = g as { id: string, name: string };
                return (
                  <option key={grade.id} value={grade.id}>{grade.name}</option>
                );
              })}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-1 font-sans">ห้องเรียน</label>
            <select 
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="w-full bg-gray-50/50 border-gray-200 rounded-xl focus:ring-primary-500 focus:border-primary-500 transition-all font-sans"
            >
              <option value="">ทั้งหมด</option>
              {rooms
                .map((r: unknown) => r as { id: string, room_number: string, grade_id: string })
                .filter(r => !selectedGrade || r.grade_id === selectedGrade)
                .map(r => (
                  <option key={r.id} value={r.id}>{r.room_number}</option>
                ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-1 font-sans">ค้นหา</label>
            <div className="relative">
              <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text"
                placeholder="ชื่อ, นามสกุล, รหัส..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 bg-gray-50/50 border-gray-200 rounded-xl focus:ring-primary-500 focus:border-primary-500 transition-all font-sans"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Enrollment Table */}
      <div className="glass-card overflow-hidden border-none shadow-sm">
        <table className="w-full text-left font-sans">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">รหัสนักเรียน</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ชื่อ-นามสกุล</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ห้องเรียน</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">สถานะ</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">การจัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 text-sm">กำลังโหลดข้อมูล...</p>
                  </div>
                </td>
              </tr>
            ) : enrollments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  ไม่พบข้อมูลนักเรียนในปีการศึกษานี้
                </td>
              </tr>
            ) : (
              enrollments.map((en: unknown) => {
                const enrollment = en as { id: string, student: { student_id: string, first_name: string, last_name: string }, room: { room_number: string, grade: { name: string } }, status: string };
                return (
                <tr key={enrollment.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4 font-medium text-primary-600">{enrollment.student.student_id}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {enrollment.student.first_name} {enrollment.student.last_name}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">
                        {enrollment.room?.grade?.name || '-'}
                      </span>
                      <span className="text-gray-600">/{enrollment.room?.room_number || '-'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      enrollment.status === 'active' ? 'bg-green-50 text-green-600' :
                      enrollment.status === 'graduated' ? 'bg-purple-50 text-purple-600' :
                      enrollment.status === 'transferred' ? 'bg-orange-50 text-orange-600' :
                      'bg-gray-50 text-gray-600'
                    }`}>
                      {enrollment.status === 'active' ? 'กำลังศึกษา' : 
                       enrollment.status === 'graduated' ? 'จบการศึกษา' : 
                       enrollment.status === 'transferred' ? 'ย้ายสถานศึกษา' : 'ซ้ำชั้น'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-primary-600 hover:text-primary-700 font-semibold text-sm">
                      แก้ไข
                    </button>
                  </td>
                </tr>
              )
            })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        title="ลงทะเบียนนักเรียนเข้าปีการศึกษา"
      >
        <form onSubmit={handleAddEnrollment} className="space-y-6">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">ปีการศึกษาที่ลงทะเบียน</label>
            <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-600 font-bold">
              {(academicYears as { id: string, year: string }[]).find(y => y.id === selectedYear)?.year || 'ไม่ทราบ'}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">เลือกนักเรียน</label>
            <select 
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full bg-white border-gray-200 rounded-xl focus:ring-primary-500 focus:border-primary-500 transition-all font-sans"
              required
            >
              <option value="">-- โปรดเลือกนักเรียน --</option>
              {eligibleStudents.map((s: unknown) => {
                const student = s as { id: string, student_id: string, first_name: string, last_name: string };
                return (
                  <option key={student.id} value={student.id}>{student.student_id} - {student.first_name} {student.last_name}</option>
                );
              })}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">ห้องเรียนเป้าหมาย</label>
            <select 
              value={targetRoomId}
              onChange={(e) => setTargetRoomId(e.target.value)}
              className="w-full bg-white border-gray-200 rounded-xl focus:ring-primary-500 focus:border-primary-500 transition-all font-sans"
              required
            >
              <option value="">-- โปรดระบุห้องเรียน --</option>
              {rooms.map((r: unknown) => {
                const room = r as { id: string, room_number: string, grade: { name: string } };
                return (
                  <option key={room.id} value={room.id}>{room.grade?.name}/{room.room_number}</option>
                );
              })}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
            >
              ยกเลิก
            </button>
            <button 
              type="submit"
              className="flex-1 bg-primary-600 text-white rounded-xl font-bold py-3 hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/30"
            >
              บันทึกการลงทะเบียน
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
