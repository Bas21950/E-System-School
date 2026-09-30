'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import StatsCard from '@/components/ui/StatsCard';
import { useFinance } from '@/modules/finance/hooks/useFinance';
import { FinanceStats } from '@/modules/finance/types/finance';
import {
  HiOutlineBanknotes,
  HiOutlineClock,
  HiOutlineUsers,
  HiOutlineDocumentText,
  HiOutlinePlus,
  HiOutlineArrowRight,
  HiOutlineSquares2X2,
  HiOutlineCog6Tooth,
} from 'react-icons/hi2';

type QuickAction = {
  href: string;
  title: string;
  detail: string;
  icon: React.ComponentType<{ size?: number }>;
  primary?: boolean;
};

export default function FinanceDashboardPage() {
  const { fetchStats } = useFinance();
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const statsData = await fetchStats();
        setStats(statsData);
      } catch (err) {
        console.error('Failed to load finance dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [fetchStats]);

  const pendingCount = stats?.pendingStudents ?? stats?.pendingStudentsCount ?? 0;
  const todayTotal = stats?.todayTotal ?? 0;
  const pendingAmount = stats?.pendingAmount ?? 0;
  const paidAmount = stats?.paidAmount ?? stats?.totalAmount ?? 0;

  const quickActions = useMemo<QuickAction[]>(
    () => [
      {
        href: '/finance/student-payments',
        title: 'รับชำระเงิน',
        detail: 'ค้นหานักเรียนและบันทึกการรับชำระจากหน้ารวม',
        icon: HiOutlineBanknotes,
        primary: true,
      },
      {
        href: '/finance/fees',
        title: 'เพิ่มยอดชำระ',
        detail: 'สร้างรายการค่าใช้จ่ายหรือค่าธรรมเนียมใหม่',
        icon: HiOutlinePlus,
      },
      {
        href: '/finance/reports',
        title: 'ออกรายงาน',
        detail: 'ดูยอดรวม, ยอดค้าง, และส่งออกรายงาน',
        icon: HiOutlineDocumentText,
      },
      {
        href: '/finance/settings',
        title: 'ตั้งค่าการเงิน',
        detail: 'รวมใบเสร็จ, ช่องทางชำระ, และผู้รับเงิน',
        icon: HiOutlineCog6Tooth,
      },
    ],
    []
  );

  const workItems = useMemo(() => {
    return [
      {
        title: 'ยอดเก็บวันนี้',
        value: todayTotal,
        helper: 'ยอดเงินที่รับเข้าวันนี้',
        tone: 'emerald',
      },
      {
        title: 'ยอดค้างทั้งหมด',
        value: pendingAmount,
        helper: pendingCount > 0 ? `ยังมี ${pendingCount.toLocaleString()} คนค้างชำระ` : 'ยังไม่พบยอดค้าง',
        tone: 'amber',
      },
      {
        title: 'ยอดชำระสะสม',
        value: paidAmount,
        helper: 'ยอดรวมที่บันทึกเข้าระบบแล้ว',
        tone: 'indigo',
      },
    ];
  }, [paidAmount, pendingAmount, pendingCount, todayTotal]);

  return (
    <div className="animate-fade-in space-y-5">
      <Header
        title="ภาพรวมการเงิน"
        subtitle="หน้าเดียวสำหรับเริ่มงาน: รับชำระเงิน, เพิ่มยอด, ดูยอดค้าง, และไปที่รายงานทันที"
      />

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
        </div>
      ) : (
        <>
          <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_360px]">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatsCard
                title="เก็บได้วันนี้"
                value={todayTotal}
                suffix=" บาท"
                icon={<HiOutlineBanknotes size={24} />}
                color="emerald"
              />
              <StatsCard
                title="ยอดค้างทั้งหมด"
                value={pendingAmount}
                suffix=" บาท"
                icon={<HiOutlineClock size={24} />}
                color="amber"
              />
              <StatsCard
                title="นักเรียนค้าง"
                value={pendingCount}
                suffix=" คน"
                icon={<HiOutlineUsers size={24} />}
                color="red"
              />
              <div className="glass-card p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl rounded-2xl">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-white/60 uppercase tracking-[0.2em]">โหมดใช้งาน</p>
                    <p className="mt-2 font-bold text-base">งานหลักวันนี้</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center">
                    <HiOutlineSquares2X2 size={24} />
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm text-white/80">
                  <p>1. รับชำระเงิน</p>
                  <p>2. เพิ่มยอดชำระ</p>
                  <p>3. ออกรายงานและตรวจยอด</p>
                </div>
              </div>
            </div>

            <div className="glass-card p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-bold text-gray-900">สิ่งที่ควรทำต่อ</h3>
                  <p className="text-sm text-gray-500 mt-1">สรุปแบบสั้นสำหรับคนใช้งานหน้างาน</p>
                </div>
                <span className="text-[10px] uppercase font-black tracking-widest text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  Fast Path
                </span>
              </div>
              <div className="space-y-3">
                {workItems.map((item, idx) => (
                  <div key={item.title} className="rounded-2xl border border-gray-100 bg-white p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-gray-500 font-bold">{idx + 1}. {item.title}</p>
                        <p className="text-lg font-black text-gray-900 mt-1">{item.value.toLocaleString()} บาท</p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                          item.tone === 'emerald'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : item.tone === 'amber'
                              ? 'bg-amber-50 text-amber-700 border border-amber-100'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                        }`}
                      >
                        {item.tone === 'emerald' ? 'วันนี้' : item.tone === 'amber' ? 'ค้าง' : 'สะสม'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{item.helper}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className={`group rounded-2xl border p-4 transition-all hover:-translate-y-1 hover:shadow-lg ${
                    action.primary
                      ? 'bg-primary-600 border-primary-500 text-white shadow-primary-500/20'
                      : 'bg-white border-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                        action.primary ? 'bg-white/15 text-white' : 'bg-primary-50 text-primary-600'
                      }`}>
                        <Icon size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold">{action.title}</p>
                        <p className={`text-xs mt-1 leading-relaxed ${action.primary ? 'text-white/75' : 'text-gray-500'}`}>
                          {action.detail}
                        </p>
                      </div>
                    </div>
                    <HiOutlineArrowRight
                      size={18}
                      className={action.primary ? 'text-white/70' : 'text-gray-300 group-hover:text-primary-500'}
                    />
                  </div>
                </Link>
              );
            })}
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="glass-card p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-bold text-gray-900">รายการลัดสำหรับงานบ่อย</h3>
                  <p className="text-sm text-gray-500 mt-1">เปิดหน้าใช้งานที่เจอบ่อยได้ทันที</p>
                </div>
                <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-1 rounded-full">4 รายการ</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Link href="/finance/student-payments" className="rounded-2xl border border-gray-100 bg-white p-4 hover:border-primary-200 hover:shadow-sm transition-all">
                  <p className="font-bold text-gray-900">ค้นหาและรับชำระ</p>
                  <p className="text-xs text-gray-500 mt-1">เปิดหน้าค้นหานักเรียนและรับเงิน</p>
                </Link>
                <Link href="/finance/fees" className="rounded-2xl border border-gray-100 bg-white p-4 hover:border-primary-200 hover:shadow-sm transition-all">
                  <p className="font-bold text-gray-900">จัดการรายการค่าใช้จ่าย</p>
                  <p className="text-xs text-gray-500 mt-1">เพิ่ม/แก้ไขยอดที่ต้องเรียกเก็บ</p>
                </Link>
                <Link href="/finance/reports" className="rounded-2xl border border-gray-100 bg-white p-4 hover:border-primary-200 hover:shadow-sm transition-all">
                  <p className="font-bold text-gray-900">สรุปและออกรายงาน</p>
                  <p className="text-xs text-gray-500 mt-1">ดูรายงานยอดวัน, ยอดค้าง, และพิมพ์ออก</p>
                </Link>
                <Link href="/finance/settings" className="rounded-2xl border border-gray-100 bg-white p-4 hover:border-primary-200 hover:shadow-sm transition-all">
                  <p className="font-bold text-gray-900">ตั้งค่าการเงิน</p>
                  <p className="text-xs text-gray-500 mt-1">ใบเสร็จ, วิธีชำระ, ผู้รับเงิน</p>
                </Link>
              </div>
            </div>

            <div className="glass-card p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-bold text-gray-900">เช็กลิสต์งานประจำวัน</h3>
                  <p className="text-sm text-gray-500 mt-1">ใช้หน้านี้เป็นจุดเริ่มต้นของงานเงิน</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="rounded-2xl border border-gray-100 bg-white p-4">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">1. รับเงิน</p>
                  <p className="font-semibold text-gray-900 mt-1">ค้นหานักเรียน → เลือกยอดค้าง → บันทึก</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-white p-4">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">2. เพิ่มยอด</p>
                  <p className="font-semibold text-gray-900 mt-1">สร้างรายการใหม่เมื่อมีค่าใช้จ่ายเพิ่ม</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-white p-4">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">3. ตรวจยอด</p>
                  <p className="font-semibold text-gray-900 mt-1">ดูยอดค้างและรายงานก่อนจบวัน</p>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
