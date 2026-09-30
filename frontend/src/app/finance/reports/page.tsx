'use client';

import { useEffect, useMemo, useState } from 'react';
import Header from '@/components/layout/Header';
import { api } from '@/lib/api';
import {
  HiOutlineArrowDownTray,
  HiOutlineMagnifyingGlass,
  HiOutlinePrinter,
  HiOutlineDocumentText,
  HiOutlineUsers,
  HiOutlineBanknotes,
  HiOutlineSquares2X2,
} from 'react-icons/hi2';

type ArrearsFee = {
  fee_id: string;
  fee_name: string;
  fee_description?: string | null;
  receipt_type_name?: string | null;
  due_date?: string | null;
  billing_month?: number | null;
  billing_year?: number | null;
  total_amount: number;
  paid_amount: number;
  balance: number;
  category: 'tuition' | 'special' | 'other';
};

type ArrearsStudent = {
  student_id: string;
  student_code: string;
  first_name: string;
  last_name: string;
  room_number: string | null;
  grade_name: string | null;
  fees: ArrearsFee[];
  tuitionBalance: number;
  specialBalance: number;
  otherBalance: number;
  totalBalance: number;
};

type ArrearsReport = {
  summary: {
    totalStudents: number;
    totalBalance: number;
    tuitionBalance: number;
    specialBalance: number;
    otherBalance: number;
  };
  rows: ArrearsStudent[];
  grouped: {
    tuition: ArrearsStudent[];
    special: ArrearsStudent[];
    other: ArrearsStudent[];
  };
};

export default function FinanceReportsPage() {
  const [report, setReport] = useState<ArrearsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'tuition' | 'special' | 'other'>('all');

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await api.get<{ data: ArrearsReport }>('/finance/reports/arrears');
        setReport(res.data || null);
      } catch (err) {
        console.error('Failed to load arrears report', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, []);

  const rows = useMemo(() => {
    const base = report?.rows || [];
    return base.filter((row) => {
      const name = `${row.first_name} ${row.last_name}`.toLowerCase();
      const studentCode = row.student_code.toLowerCase();
      const grade = (row.grade_name || '').toLowerCase();
      const room = (row.room_number || '').toLowerCase();
      const q = searchQuery.toLowerCase();
      if (q && !(name.includes(q) || studentCode.includes(q) || grade.includes(q) || room.includes(q))) {
        return false;
      }
      if (activeTab === 'all') return true;
      return row[`${activeTab}Balance` as const] > 0;
    });
  }, [activeTab, report?.rows, searchQuery]);

  const summaryCards = [
    {
      title: 'นักเรียนค้างทั้งหมด',
      value: report?.summary.totalStudents ?? 0,
      icon: HiOutlineUsers,
      tone: 'blue',
    },
    {
      title: 'ยอดค้างรวม',
      value: report?.summary.totalBalance ?? 0,
      suffix: ' บาท',
      icon: HiOutlineBanknotes,
      tone: 'rose',
    },
    {
      title: 'ค่าเทอมค้าง',
      value: report?.summary.tuitionBalance ?? 0,
      suffix: ' บาท',
      icon: HiOutlineSquares2X2,
      tone: 'amber',
    },
    {
      title: 'เรียนพิเศษ/อื่นๆ',
      value: (report?.summary.specialBalance ?? 0) + (report?.summary.otherBalance ?? 0),
      suffix: ' บาท',
      icon: HiOutlineDocumentText,
      tone: 'emerald',
    },
  ];

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6 print:space-y-3">
      <Header
        title="รายงานนักเรียนค้างชำระ"
        subtitle="รายงานสำหรับพิมพ์เสนอผู้บริหาร แยกตามประเภทค่าใช้จ่าย เช่น ค่าเทอม ค่าเรียนพิเศษ และรายการอื่นๆ"
      >
        <button onClick={handlePrint} className="btn-secondary flex items-center gap-2 print:hidden">
          <HiOutlinePrinter size={18} />
          <span>พิมพ์รายงาน</span>
        </button>
        <button className="btn-secondary flex items-center gap-2 print:hidden">
          <HiOutlineArrowDownTray size={18} />
          <span>ส่งออกข้อมูล</span>
        </button>
      </Header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 print:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="glass-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{card.title}</p>
                  <p className="mt-3 text-2xl font-black text-slate-900">
                    {Number(card.value || 0).toLocaleString()}
                    {card.suffix || ''}
                  </p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                  card.tone === 'rose'
                    ? 'bg-rose-50 text-rose-600'
                    : card.tone === 'amber'
                      ? 'bg-amber-50 text-amber-600'
                      : card.tone === 'emerald'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-sky-50 text-sky-600'
                }`}>
                  <Icon size={20} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="glass-card print:shadow-none print:border print:border-slate-300">
        <div className="border-b border-slate-100 px-5 py-4 print:px-3">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">ตารางรายงานค้างชำระ</h2>
              <p className="mt-1 text-sm text-slate-500">
                แสดงรายชื่อและยอดค้างแยกตามประเภท เพื่อใช้ประกอบการรายงานและติดตาม
              </p>
            </div>
            <div className="flex flex-wrap gap-2 print:hidden">
              {[
                { key: 'all', label: 'ทั้งหมด' },
                { key: 'tuition', label: 'ค่าเทอม' },
                { key: 'special', label: 'เรียนพิเศษ' },
                { key: 'other', label: 'อื่นๆ' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    activeTab === tab.key
                      ? 'bg-slate-900 text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto] print:hidden">
            <div className="relative">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อเด็ก รหัสนักเรียน ชั้น หรือห้อง"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-sky-400"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>รายงานทั้งหมด</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                {rows.length.toLocaleString()} รายการ
              </span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-sky-600" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center text-slate-500">
            <HiOutlineDocumentText size={56} className="mb-4 text-slate-300" />
            <p className="text-lg font-semibold text-slate-700">ไม่พบข้อมูลค้างชำระ</p>
            <p className="mt-1 text-sm">กรองข้อมูลหรือยังไม่มีรายการค้างในเงื่อนไขที่เลือก</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0 text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50">
                <tr>
                  <th className="border-b border-slate-200 px-4 py-3 text-left font-bold text-slate-600">ลำดับ</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left font-bold text-slate-600">รหัสนักเรียน</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left font-bold text-slate-600">ชื่อ - นามสกุล</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left font-bold text-slate-600">ชั้น/ห้อง</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left font-bold text-slate-600">ค่าเทอม</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left font-bold text-slate-600">เรียนพิเศษ</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left font-bold text-slate-600">อื่นๆ</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-right font-bold text-slate-600">รวมค้าง</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.student_id} className="hover:bg-slate-50">
                    <td className="border-b border-slate-100 px-4 py-3 text-slate-500">{index + 1}</td>
                    <td className="border-b border-slate-100 px-4 py-3 font-medium text-slate-700">{row.student_code}</td>
                    <td className="border-b border-slate-100 px-4 py-3 font-semibold text-slate-900">
                      {row.first_name} {row.last_name}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 text-slate-700">
                      {row.grade_name || '-'} / {row.room_number || '-'}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 text-slate-700">
                      {row.tuitionBalance.toLocaleString()}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 text-slate-700">
                      {row.specialBalance.toLocaleString()}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 text-slate-700">
                      {row.otherBalance.toLocaleString()}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 text-right font-bold text-rose-600">
                      {row.totalBalance.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="glass-card p-5 print:hidden">
        <h3 className="font-bold text-slate-900">รูปแบบรายงานสำหรับผู้บริหาร</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">ส่วนหัวรายงาน</p>
            <p className="mt-2 text-sm text-slate-700">ชื่อโรงเรียน, วันที่ออกรายงาน, ปีการศึกษา, ผู้จัดทำ</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">สรุปยอด</p>
            <p className="mt-2 text-sm text-slate-700">ยอดค้างรวม แยกตามประเภท และจำนวนนักเรียนค้าง</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">รายการรายละเอียด</p>
            <p className="mt-2 text-sm text-slate-700">รหัส, ชื่อ, ชั้น/ห้อง, แยกค่าเทอม / เรียนพิเศษ / อื่นๆ</p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          header, nav, .print\\:hidden {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
          .glass-card {
            box-shadow: none !important;
            border-color: #cbd5e1 !important;
          }
        }
      `}</style>
    </div>
  );
}
