'use client';

import Header from '@/components/layout/Header';
import { HiOutlineCodeBracketSquare, HiOutlineUserGroup, HiOutlineShieldCheck } from 'react-icons/hi2';

export default function SystemSettingsPage() {
  return (
    <div className="animate-fade-in space-y-6">
      <Header
        title="ตั้งค่าระบบ"
        subtitle="พื้นที่สำหรับจัดการผู้ใช้งาน สิทธิ์ และตัวเลือกภายในโปรแกรม"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
            <HiOutlineUserGroup size={24} />
          </div>
          <h3 className="font-bold text-gray-900">จัดการผู้ใช้งาน</h3>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            สร้าง แก้ไข และกำหนดสิทธิ์ของผู้ที่เข้าใช้ระบบในโรงเรียน
          </p>
        </div>

        <div className="glass-card p-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
            <HiOutlineShieldCheck size={24} />
          </div>
          <h3 className="font-bold text-gray-900">สิทธิ์และบทบาท</h3>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            กำหนดว่าใครเห็นเมนูใดและทำรายการอะไรได้บ้างในแต่ละส่วนของโปรแกรม
          </p>
        </div>

        <div className="glass-card p-6">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4">
            <HiOutlineCodeBracketSquare size={24} />
          </div>
          <h3 className="font-bold text-gray-900">เครื่องมือขั้นสูง</h3>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            ใช้สำหรับค่าระบบเชิงเทคนิคที่ผู้ดูแลระบบหรือผู้พัฒนาเป็นคนจัดการ
          </p>
        </div>
      </div>

      <div className="glass-card p-6 border border-dashed border-gray-200 bg-white/70">
        <p className="font-bold text-gray-900">หมายเหตุ</p>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          ส่วนข้อมูลโรงเรียนที่ใช้ในใบเสร็จ ถูกย้ายไปไว้ในเมนูข้อมูลใบเสร็จแล้ว เพื่อไม่ให้ปนกับการตั้งค่าระบบทั่วไป
        </p>
      </div>
    </div>
  );
}
