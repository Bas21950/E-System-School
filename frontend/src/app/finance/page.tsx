'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  HiOutlineBanknotes,
  HiOutlineClipboardDocumentList,
  HiOutlineDocumentText,
  HiOutlinePlusCircle,
  HiOutlineReceiptPercent,
  HiOutlineUsers,
} from 'react-icons/hi2';
import LegacyFinanceDashboardPage from './page.legacy';
import { useFinance } from '@/modules/finance/hooks/useFinance';
import type { FinanceStats } from '@/modules/finance/types/finance';

const USE_LEGACY_FINANCE_HOME = false;

type MenuItem = {
  href: string;
  label: string;
  note: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

function FinanceMenuSection({
  title,
  items,
}: {
  title: string;
  items: MenuItem[];
}) {
  return (
    <section className="overflow-hidden rounded-sm border border-sky-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-sky-100 bg-sky-50 px-4 py-2.5">
        <div className="text-sm font-bold text-sky-900">{title}</div>
        <span className="rounded-sm border border-sky-200 bg-white px-2 py-0.5 text-xs text-sky-600">
          {items.length} เมนู
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="border-b border-slate-200 px-3 py-2 text-left font-bold">#</th>
              <th className="border-b border-slate-200 px-3 py-2 text-left font-bold">เมนู</th>
              <th className="border-b border-slate-200 px-3 py-2 text-left font-bold">รายละเอียด</th>
              <th className="border-b border-slate-200 px-3 py-2 text-left font-bold">เปิด</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const Icon = item.icon;
              return (
                <tr key={item.href} className="hover:bg-sky-50/60">
                  <td className="border-b border-slate-200 px-3 py-2 text-slate-500">{index + 1}</td>
                  <td className="border-b border-slate-200 px-3 py-2 font-bold text-slate-900">{item.label}</td>
                  <td className="border-b border-slate-200 px-3 py-2 text-slate-600">{item.note}</td>
                  <td className="border-b border-slate-200 px-3 py-2">
                    <Link
                      href={item.href}
                      className="inline-flex items-center gap-1 rounded-sm border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700 transition hover:border-sky-300 hover:bg-sky-100"
                    >
                      <Icon size={14} />
                      เปิด
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <div>หน้า 1/1</div>
        <div className="flex items-center gap-2">
          <span>แสดง</span>
          <select className="rounded-sm border border-slate-300 bg-white px-2 py-1 text-xs">
            <option>10</option>
            <option>25</option>
            <option>50</option>
          </select>
          <span>รายการ/หน้า</span>
        </div>
      </div>
    </section>
  );
}

export default function FinanceDashboardPage() {
  const { fetchStats } = useFinance();
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await fetchStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to load finance stats', error);
      } finally {
        setLoading(false);
      }
    };

    void loadStats();
  }, [fetchStats]);

  if (USE_LEGACY_FINANCE_HOME) {
    return <LegacyFinanceDashboardPage />;
  }

  const dataItems: MenuItem[] = [
    {
      href: '/finance/payment-methods',
      label: 'รูปแบบการชำระเงิน',
      note: 'กำหนดช่องทางรับเงินที่ใช้งานจริง เช่น เงินสด โอนเงิน และ QR',
      icon: HiOutlineBanknotes,
    },
    {
      href: '/finance/receipt-types',
      label: 'ประเภทใบเสร็จรับเงิน',
      note: 'ตั้งชื่อกลุ่มใบเสร็จ เช่น ค่าเทอม ค่าเรียนพิเศษ หรือค่าใช้จ่ายอื่น',
      icon: HiOutlineReceiptPercent,
    },
    {
      href: '/settings/receipt-settings',
      label: 'ข้อมูลใบเสร็จ',
      note: 'แก้ชื่อโรงเรียน โลโก้ ที่อยู่ เบอร์โทร และที่เก็บไฟล์ใบเสร็จ',
      icon: HiOutlineDocumentText,
    },
  ];

  const paymentItems: MenuItem[] = [
    {
      href: '/finance/special-class-roster',
      label: 'จัดการรายชื่อเรียนพิเศษ',
      note: 'เพิ่มหรือนำรายชื่อนักเรียนออกจากรอบรายเดือน ก่อนเข้าสู่ขั้นตอนสร้างบิล',
      icon: HiOutlineUsers,
    },
    {
      href: '/finance/billing',
      label: 'สร้างบิลรายเดือน',
      note: 'ยกรายชื่อเรียนพิเศษจากเดือนก่อน ตรวจสอบ แล้วสร้างบิลให้หลายคนในครั้งเดียว',
      icon: HiOutlineReceiptPercent,
    },
    {
      href: '/finance/student-payments',
      label: 'รับชำระเงินนักเรียน',
      note: 'ค้นหานักเรียน เปิดรายการค้างชำระ แล้วรับเงินจากหน้าเดียว',
      icon: HiOutlineBanknotes,
    },
    {
      href: '/finance/fees',
      label: 'กำหนดค่าใช้จ่าย',
      note: 'สร้างค่าเทอม ค่าเรียนพิเศษ และรายการเรียกเก็บที่ต้องใช้ซ้ำ',
      icon: HiOutlinePlusCircle,
    },
  ];

  const reportItems: MenuItem[] = [
    {
      href: '/finance/reports',
      label: 'รายงานการค้างชำระ',
      note: 'สรุปรายการค้างชำระแยกตามประเภท เพื่อพิมพ์เสนอผู้บริหาร',
      icon: HiOutlineClipboardDocumentList,
    },
  ];

  return (
    <div className="animate-fade-in space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-sm border border-sky-200 bg-white px-3 py-2 shadow-sm">
          <div className="text-[10px] font-bold text-slate-500">รับวันนี้</div>
          <div className="mt-1 text-xl font-black text-emerald-600">
            {loading ? '...' : Number(stats?.todayTotal || 0).toLocaleString()}
          </div>
        </div>
        <div className="rounded-sm border border-sky-200 bg-white px-3 py-2 shadow-sm">
          <div className="text-[10px] font-bold text-slate-500">ยอดค้างรวม</div>
          <div className="mt-1 text-xl font-black text-rose-600">
            {loading ? '...' : Number(stats?.pendingAmount || 0).toLocaleString()}
          </div>
        </div>
        <div className="rounded-sm border border-sky-200 bg-white px-3 py-2 shadow-sm">
          <div className="text-[10px] font-bold text-slate-500">นักเรียนค้างชำระ</div>
          <div className="mt-1 text-xl font-black text-sky-700">
            {loading
              ? '...'
              : Number(stats?.pendingStudents || stats?.pendingStudentsCount || 0).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <FinanceMenuSection title="ข้อมูลหลัก" items={dataItems} />
        <FinanceMenuSection title="ชำระเงินค่าเทอม" items={paymentItems} />
        <FinanceMenuSection title="รายงานการชำระเงิน" items={reportItems} />
      </div>
    </div>
  );
}
