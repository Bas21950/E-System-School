'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  HiOutlineAcademicCap,
  HiOutlineChartBarSquare,
  HiOutlineUsers,
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineCalendarDays,
  HiOutlineTag,
  HiOutlineBuildingOffice2,
  HiOutlineInboxStack,
  HiOutlineBanknotes,
  HiOutlineChartPie,
  HiOutlineCog6Tooth,
  HiOutlineClipboardDocumentList,
  HiOutlineRectangleGroup,
  HiOutlineSparkles,
  HiOutlineReceiptPercent,
} from 'react-icons/hi2';
import MenuGroup from './MenuGroup';

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/dashboard' || href === '/finance') return pathname === href;
    return pathname === href || pathname?.startsWith(href + '/');
  };

  const navLinkClass = (href: string) => `
    flex items-center gap-3 px-3 py-2 rounded-sm text-sm
    transition-colors border-l-4
    ${
      isActive(href)
        ? 'bg-sky-50 text-sky-900 border-sky-700 font-bold'
        : 'text-slate-700 border-transparent hover:bg-slate-50 hover:border-sky-300'
    }
  `;

  return (
    <>
      <button
        className="fixed left-4 top-4 z-50 rounded-sm bg-sky-800 p-2 text-white shadow-lg lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <HiOutlineXMark size={24} /> : <HiOutlineBars3 size={24} />}
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-40 flex h-full w-64 flex-col border-r border-slate-300
          bg-white text-slate-900 shadow-xl transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="border-b border-slate-300 bg-gradient-to-b from-sky-700 to-sky-900 px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-white/20 bg-white/10">
              <HiOutlineAcademicCap size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">E-System</h1>
              <p className="text-xs text-sky-100">ระบบทะเบียนโรงเรียน</p>
            </div>
          </div>
        </div>

        <nav className="custom-scrollbar flex-1 space-y-2 overflow-y-auto px-2 py-3 pb-20">
          <Link href="/dashboard" onClick={() => setMobileOpen(false)} className={navLinkClass('/dashboard')}>
            <HiOutlineRectangleGroup size={18} />
            <span>หน้าหลัก</span>
          </Link>

          <MenuGroup
            label="ทะเบียนนักเรียน"
            icon={HiOutlineUsers}
            active={pathname?.startsWith('/students')}
            initiallyOpen={pathname?.startsWith('/students')}
          >
            <Link href="/students" className={navLinkClass('/students')} onClick={() => setMobileOpen(false)}>
              <HiOutlineUsers size={17} />
              <span>รายชื่อนักเรียน</span>
            </Link>
            <Link href="/students/promotion" className={navLinkClass('/students/promotion')} onClick={() => setMobileOpen(false)}>
              <HiOutlineSparkles size={17} />
              <span>เลื่อนชั้นนักเรียน</span>
            </Link>
            <Link href="/students/statistics" className={navLinkClass('/students/statistics')} onClick={() => setMobileOpen(false)}>
              <HiOutlineChartPie size={17} />
              <span>สถิตินักเรียน</span>
            </Link>
          </MenuGroup>

          <MenuGroup
            label="ระบบการเงิน"
            icon={HiOutlineBanknotes}
            active={pathname?.startsWith('/finance')}
            initiallyOpen={pathname?.startsWith('/finance')}
          >
            <Link href="/finance/billing" className={navLinkClass('/finance/billing')} onClick={() => setMobileOpen(false)}>
              <HiOutlineReceiptPercent size={17} />
              <span>สร้างบิลรายเดือน</span>
            </Link>
            <Link href="/finance/special-class-roster" className={navLinkClass('/finance/special-class-roster')} onClick={() => setMobileOpen(false)}>
              <HiOutlineUsers size={17} />
              <span>รายชื่อเรียนพิเศษ</span>
            </Link>
            <Link href="/finance/student-payments" className={navLinkClass('/finance/student-payments')} onClick={() => setMobileOpen(false)}>
              <HiOutlineBanknotes size={17} />
              <span>รับชำระเงิน</span>
            </Link>
            <Link href="/finance" className={navLinkClass('/finance')} onClick={() => setMobileOpen(false)}>
              <HiOutlineChartBarSquare size={17} />
              <span>ภาพรวมการเงิน</span>
            </Link>
            <Link href="/finance/reports" className={navLinkClass('/finance/reports')} onClick={() => setMobileOpen(false)}>
              <HiOutlineClipboardDocumentList size={17} />
              <span>รายงาน</span>
            </Link>
            <Link href="/finance/settings" className={navLinkClass('/finance/settings')} onClick={() => setMobileOpen(false)}>
              <HiOutlineCog6Tooth size={17} />
              <span>ตั้งค่าการเงิน</span>
            </Link>
          </MenuGroup>

          <MenuGroup
            label="ข้อมูลพื้นฐาน"
            icon={HiOutlineInboxStack}
            active={pathname?.startsWith('/master-data')}
          >
            <Link href="/master-data/academic-years" className={navLinkClass('/master-data/academic-years')} onClick={() => setMobileOpen(false)}>
              <HiOutlineCalendarDays size={17} />
              <span>ปีการศึกษา</span>
            </Link>
            <Link href="/master-data/semesters" className={navLinkClass('/master-data/semesters')} onClick={() => setMobileOpen(false)}>
              <HiOutlineRectangleGroup size={17} />
              <span>ภาคเรียน</span>
            </Link>
            <Link href="/master-data/education-levels" className={navLinkClass('/master-data/education-levels')} onClick={() => setMobileOpen(false)}>
              <HiOutlineAcademicCap size={17} />
              <span>ระดับการศึกษา</span>
            </Link>
            <Link href="/master-data/grade-levels" className={navLinkClass('/master-data/grade-levels')} onClick={() => setMobileOpen(false)}>
              <HiOutlineTag size={17} />
              <span>ระดับชั้น</span>
            </Link>
            <Link href="/master-data/rooms" className={navLinkClass('/master-data/rooms')} onClick={() => setMobileOpen(false)}>
              <HiOutlineBuildingOffice2 size={17} />
              <span>ห้องเรียน</span>
            </Link>
          </MenuGroup>

          <MenuGroup
            label="ตั้งค่าระบบ"
            icon={HiOutlineCog6Tooth}
            active={pathname?.startsWith('/settings')}
          >
            <Link href="/settings/receipt-settings" className={navLinkClass('/settings/receipt-settings')} onClick={() => setMobileOpen(false)}>
              <HiOutlineReceiptPercent size={17} />
              <span>ข้อมูลใบเสร็จ</span>
            </Link>
          </MenuGroup>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-300 bg-slate-50 px-4 py-3">
          <p className="text-center text-[10px] uppercase tracking-widest text-slate-500">
            E-SYSTEM SCHOOL V2.0
          </p>
        </div>
      </aside>
    </>
  );
}
