'use client';

import Link from 'next/link';
import Header from '@/components/layout/Header';
import {
  HiOutlineBanknotes,
  HiOutlineClipboardDocumentList,
  HiOutlineAdjustmentsHorizontal,
  HiOutlineArrowRight,
} from 'react-icons/hi2';
import type { IconType } from 'react-icons';

type FinanceSetting = {
  href: string;
  title: string;
  description: string;
  icon: IconType;
};

const financeSettings: FinanceSetting[] = [
  {
    href: '/finance/fees',
    title: 'ตั้งค่าค่าใช้จ่าย',
    description: 'สร้างและจัดการรายการค่าใช้จ่าย กำหนดราคา และตั้งค่าเงื่อนไขการออกใบเสร็จ',
    icon: HiOutlineBanknotes,
  },
  {
    href: '/finance/receipt-types',
    title: 'ประเภทใบเสร็จ',
    description: 'กำหนดรูปแบบเอกสารใบเสร็จและรหัสเอกสารที่ใช้กับงานการเงิน',
    icon: HiOutlineClipboardDocumentList,
  },
  {
    href: '/finance/payment-methods',
    title: 'รูปแบบการชำระเงิน',
    description: 'กำหนดวิธีรับชำระที่แสดงในระบบ เช่น เงินสด โอนเงิน หรือ QR',
    icon: HiOutlineAdjustmentsHorizontal,
  },
];

export default function FinanceSettingsHubPage() {
  return (
    <div className="animate-fade-in space-y-6">
      <Header
        title="ตั้งค่าการเงิน"
        subtitle="รวมการตั้งค่าที่เกี่ยวกับค่าใช้จ่าย รูปแบบใบเสร็จ และช่องทางชำระเงินไว้ในหน้าเดียว"
      />

      <div className="glass-card p-4 border border-dashed border-gray-200 bg-white/70">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <HiOutlineAdjustmentsHorizontal size={20} />
          </div>
          <div>
            <p className="font-bold text-gray-900">ศูนย์กลางงานการเงิน</p>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">
              หน้าเริ่มต้นสำหรับงานฝั่งการเงิน ใช้เปิดเมนูหลักที่ต้องแก้บ่อย โดยไม่ต้องย้อนกลับไปหลายหน้า
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {financeSettings.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              className="glass-card group p-5 border border-gray-100 transition-all hover:shadow-xl hover:-translate-y-1"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-primary-50 text-primary-600">
                    <Icon size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{section.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">{section.description}</p>
                  </div>
                </div>
                <HiOutlineArrowRight className="text-gray-300 group-hover:text-primary-500 transition-colors" size={20} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
