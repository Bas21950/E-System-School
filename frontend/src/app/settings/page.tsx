'use client';

import Link from 'next/link';
import { HiOutlineArrowRight, HiOutlineFolderOpen, HiOutlineReceiptPercent } from 'react-icons/hi2';
import Header from '@/components/layout/Header';

type SettingItem = {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

const SETTING_ITEMS: SettingItem[] = [
  {
    href: '/settings/receipt-settings',
    title: 'ข้อมูลใบเสร็จ',
    description: 'แก้ชื่อโรงเรียน โลโก้ ที่อยู่ เบอร์โทร อีเมลส่งใบเสร็จ และที่เก็บไฟล์',
    icon: HiOutlineReceiptPercent,
  },
  {
    href: '/settings/system',
    title: 'ตั้งค่าระบบ',
    description: 'ดูข้อมูลระบบพื้นฐานที่เกี่ยวกับการใช้งานโปรแกรมในเครื่องนี้',
    icon: HiOutlineFolderOpen,
  },
];

export default function SettingsPage() {
  return (
    <div className="animate-fade-in space-y-6">
      <Header
        title="ตั้งค่าระบบ"
        subtitle="รวมค่าที่ต้องใช้จริงไว้ในจุดเดียว เพื่อลดการเปิดหลายหน้า"
      />

      <div className="grid gap-4">
        {SETTING_ITEMS.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-sm border border-sky-200 bg-white p-5 shadow-sm transition hover:border-sky-300 hover:bg-sky-50"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                    <Icon size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-gray-500">{item.description}</p>
                  </div>
                </div>
                <HiOutlineArrowRight
                  className="text-gray-300 transition-colors group-hover:text-sky-600"
                  size={20}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
