'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HiOutlineChevronRight, HiOutlineHome } from 'react-icons/hi2';

const routeMap: Record<string, string> = {
  dashboard: 'แดชบอร์ด',
  students: 'ทะเบียนนักเรียน',
  finance: 'การเงิน',
  fees: 'กำหนดค่าใช้จ่าย',
  payments: 'ชำระเงิน',
  reports: 'รายงานการเงิน',
  'master-data': 'ข้อมูลพื้นฐาน',
  'academic-years': 'ปีการศึกษา',
  semesters: 'ภาคเรียน',
  'education-levels': 'ระดับการศึกษา',
  'grade-levels': 'ระดับชั้น',
  rooms: 'ห้องเรียน',
  settings: 'ตั้งค่าระบบ',
  'import': 'นำเข้าข้อมูล',
  'stats': 'สถิติ',
};

export default function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname?.split('/').filter(Boolean) || [];

  if (pathname === '/dashboard') return null;

  return (
    <nav className="flex items-center gap-2 text-sm mb-6 text-gray-500 overflow-x-auto whitespace-nowrap pb-1 scrollbar-hide">
      <Link 
        href="/dashboard" 
        className="flex items-center gap-1 hover:text-primary-600 transition-colors"
      >
        <HiOutlineHome size={16} />
        <span>หน้าแรก</span>
      </Link>
      
      {segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join('/')}`;
        const isLast = index === segments.length - 1;
        const label = routeMap[segment] || segment;

        return (
          <div key={href} className="flex items-center gap-2">
            <HiOutlineChevronRight size={14} className="text-gray-300 flex-shrink-0" />
            {isLast ? (
              <span className="font-semibold text-gray-900">{label}</span>
            ) : (
              <Link 
                href={href}
                className="hover:text-primary-600 transition-colors"
              >
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
