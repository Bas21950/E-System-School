'use client';

import Header from '@/components/layout/Header';
import { HiOutlineUserPlus, HiOutlinePencilSquare, HiOutlineTrash, HiOutlineCodeBracket, HiOutlineLockClosed } from 'react-icons/hi2';

export default function UserSettingsPage() {
  const users = [
    { name: 'Administrator', role: 'Admin', email: 'admin@esystem.edu', status: 'Active' },
    { name: 'Registry Thai', role: 'Registrar', email: 'registrar@esystem.edu', status: 'Active' },
    { name: 'Finance Staff', role: 'Finance', email: 'finance@esystem.edu', status: 'Active' },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <Header
        title="ตั้งค่าระบบ"
        subtitle="ส่วนนี้จะใช้จัดการบัญชีเข้าใช้งานและสิทธิ์เข้าถึงภายในระบบ"
      >
        <button className="btn-primary flex items-center gap-2 shadow-lg shadow-primary-500/20">
          <HiOutlineUserPlus size={20} />
          <span>เพิ่มบัญชีเข้าใช้งาน</span>
        </button>
      </Header>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass-card p-5 border border-dashed border-gray-200 bg-white/70">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <HiOutlineCodeBracket size={20} />
            </div>
            <div>
              <p className="font-bold text-gray-900">ระบบบัญชีจะย้ายไปอยู่ในโหมดตั้งค่าระบบ</p>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                หน้านี้เป็นพื้นที่ชั่วคราวสำหรับการกำหนดสิทธิ์และเตรียมบัญชีเข้าใช้งาน
              </p>
            </div>
          </div>
        </div>
        <div className="glass-card p-5 border border-dashed border-gray-200 bg-white/70">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <HiOutlineLockClosed size={20} />
            </div>
            <div>
              <p className="font-bold text-gray-900">แยกผู้ใช้หน้างานออกจากผู้ดูแลระบบ</p>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                ผู้ใช้โรงเรียนจะเห็นเฉพาะงานที่จำเป็น ส่วนการตั้งค่าลึกจะอยู่ในเมนูนี้
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50/50 text-gray-600 font-bold border-b">
            <tr>
              <th className="px-6 py-4">บัญชี</th>
              <th className="px-6 py-4">สิทธิ์ (Role)</th>
              <th className="px-6 py-4">อีเมล / ชื่อล็อกอิน</th>
              <th className="px-6 py-4">สถานะ</th>
              <th className="px-6 py-4 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((user) => (
              <tr key={user.email} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-gray-900">{user.name}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-black border border-indigo-100">
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500">{user.email}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black border border-emerald-100">
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center gap-2">
                    <button className="p-2 text-gray-400 hover:text-primary-600 transition-colors">
                      <HiOutlinePencilSquare size={18} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                      <HiOutlineTrash size={18} />
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
