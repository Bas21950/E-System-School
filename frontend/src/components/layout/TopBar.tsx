'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  HiArrowRightOnRectangle,
  HiOutlineAcademicCap,
  HiOutlineBanknotes,
  HiOutlineBell,
  HiOutlineBuildingOffice2,
  HiOutlineCalendarDays,
  HiOutlineChevronDown,
  HiOutlineClipboardDocumentList,
  HiOutlineDocumentText,
  HiOutlineFolderOpen,
  HiOutlineQueueList,
  HiOutlineReceiptPercent,
  HiOutlineUsers,
} from 'react-icons/hi2';
import { api } from '@/lib/api';
import { clearCurrentOperator } from '@/lib/current-operator';
import { emitCurrentOperatorChange, useCurrentOperator } from '@/modules/auth/hooks/useCurrentOperator';

type CategoryKey = 'main' | 'finance';

type ReceiptSettings = {
  school_name?: string;
  school_logo_url?: string;
};

type AcademicYear = {
  id: string;
  year: string;
  is_current?: boolean;
};

type Semester = {
  id: string;
  academic_year_id: string;
  semester: string;
};

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
};

type MenuItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

type MenuColumn = {
  title: string;
  items: MenuItem[];
};

function getCategory(pathname: string): CategoryKey {
  if (pathname.startsWith('/finance') || pathname.startsWith('/settings/receipt-settings')) {
    return 'finance';
  }
  return 'main';
}

function isCategoryLanding(pathname: string): boolean {
  return pathname === '/dashboard' || pathname === '/finance' || pathname === '/students';
}

function buildBreadcrumbs(pathname: string) {
  const labels: Record<string, string> = {
    dashboard: 'หน้าหลัก',
    finance: 'การเงิน',
    students: 'ทะเบียนนักเรียน',
    settings: 'ตั้งค่า',
    'master-data': 'ข้อมูลหลัก',
    'academic-years': 'ปีการศึกษา',
    semesters: 'ภาคเรียน',
    'education-levels': 'ระดับการศึกษา',
    'grade-levels': 'ระดับชั้น',
    rooms: 'ห้องเรียน',
    'student-payments': 'รับชำระเงินนักเรียน',
    reports: 'รายงาน',
    fees: 'กำหนดค่าใช้จ่าย',
    billing: 'สร้างบิลรายเดือน',
    'special-class-roster': 'จัดการรายชื่อเรียนพิเศษ',
    'payment-methods': 'รูปแบบการชำระเงิน',
    'receipt-types': 'ประเภทใบเสร็จรับเงิน',
    'receipt-settings': 'ข้อมูลใบเสร็จ',
    promotion: 'เลื่อนชั้นนักเรียน',
    statistics: 'สถิตินักเรียน',
    enrollment: 'ลงทะเบียนนักเรียน',
  };

  const paths = pathname.split('/').filter(Boolean);

  return [
    { label: 'หน้าหลัก', href: '/dashboard' },
    ...paths.map((path, index) => ({
      label: labels[path] || path,
      href: `/${paths.slice(0, index + 1).join('/')}`,
    })),
  ];
}

function getMenuColumns(category: CategoryKey): MenuColumn[] {
  if (category === 'main') {
    return [
      {
        title: 'ข้อมูลหลัก',
        items: [
          { href: '/master-data/academic-years', label: 'ปีการศึกษา', icon: HiOutlineAcademicCap },
          { href: '/master-data/semesters', label: 'ภาคเรียน', icon: HiOutlineClipboardDocumentList },
          { href: '/master-data/education-levels', label: 'ระดับการศึกษา', icon: HiOutlineFolderOpen },
          { href: '/master-data/grade-levels', label: 'ระดับชั้น', icon: HiOutlineQueueList },
          { href: '/master-data/rooms', label: 'ห้องเรียน', icon: HiOutlineDocumentText },
        ],
      },
      {
        title: 'ทะเบียนนักเรียน',
        items: [
          { href: '/students', label: 'รายชื่อนักเรียน', icon: HiOutlineUsers },
          { href: '/students/enrollment', label: 'ลงทะเบียนนักเรียน', icon: HiOutlineClipboardDocumentList },
          { href: '/students/promotion', label: 'เลื่อนชั้นนักเรียน', icon: HiOutlineAcademicCap },
          { href: '/students/statistics', label: 'สถิตินักเรียน', icon: HiOutlineQueueList },
        ],
      },
    ];
  }

  return [
    {
      title: 'ข้อมูลหลัก',
      items: [
        { href: '/finance/payment-methods', label: 'รูปแบบการชำระเงิน', icon: HiOutlineBanknotes },
        { href: '/finance/receipt-types', label: 'ประเภทใบเสร็จรับเงิน', icon: HiOutlineReceiptPercent },
        { href: '/settings/receipt-settings', label: 'ข้อมูลใบเสร็จ', icon: HiOutlineDocumentText },
      ],
    },
    {
      title: 'งานเรียกเก็บและรับชำระ',
      items: [
        { href: '/finance/special-class-roster', label: 'จัดการรายชื่อเรียนพิเศษ', icon: HiOutlineUsers },
        { href: '/finance/billing', label: 'สร้างบิลรายเดือน', icon: HiOutlineReceiptPercent },
        { href: '/finance/student-payments', label: 'รับชำระเงินนักเรียน', icon: HiOutlineBanknotes },
        { href: '/finance/fees', label: 'กำหนดค่าใช้จ่าย', icon: HiOutlineClipboardDocumentList },
      ],
    },
    {
      title: 'รายงานการชำระเงิน',
      items: [
        { href: '/finance/reports', label: 'รายงานการค้างชำระ', icon: HiOutlineClipboardDocumentList },
      ],
    },
  ];
}

function MenuPanel({ columns }: { columns: MenuColumn[] }) {
  return (
    <div
      className={`grid overflow-hidden rounded-2xl border border-cyan-200 bg-gradient-to-b from-white to-cyan-50 shadow-sm ${
        columns.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'
      }`}
    >
      {columns.map((column) => (
        <div
          key={column.title}
          className="border-r border-sky-100 px-5 py-4 last:border-r-0"
        >
          <div className="mb-3 text-xl font-bold leading-none text-sky-800">{column.title}</div>
          <div className="space-y-1.5">
            {column.items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2.5 border-b border-dashed border-sky-100 py-1.5 text-sm text-slate-800 transition hover:text-sky-700"
                >
                  <Icon size={16} className="text-sky-600" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function TopCategoryTabs({
  activeCategory,
  expandedCategory,
  onToggle,
}: {
  activeCategory: CategoryKey;
  expandedCategory: CategoryKey | null;
  onToggle: (category: CategoryKey) => void;
}) {
  const tabs = [
    { key: 'main' as const, label: 'ทะเบียนและข้อมูลหลัก' },
    { key: 'finance' as const, label: 'บริหารงานธุรการและการเงิน' },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {tabs.map((tab) => {
        const isActive = activeCategory === tab.key;
        const isExpanded = expandedCategory === tab.key;

        return (
          <button
            key={tab.key}
            onClick={() => onToggle(tab.key)}
            className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white transition-colors ${
              isExpanded || isActive ? 'bg-cyan-500' : 'bg-cyan-400 hover:bg-cyan-500'
            }`}
          >
            <span>{tab.label}</span>
            <HiOutlineChevronDown
              size={16}
              className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>
        );
      })}
    </div>
  );
}

export default function TopBar() {
  const pathname = usePathname() || '/dashboard';
  const router = useRouter();
  const operator = useCurrentOperator();
  const activeCategory = getCategory(pathname);
  const landingPage = isCategoryLanding(pathname);
  const isHomePage = pathname === '/dashboard';
  const breadcrumbs = buildBreadcrumbs(pathname);
  const [schoolName, setSchoolName] = useState('E-System School');
  const [appVersion, setAppVersion] = useState<string | null>(null);
  const [schoolLogoUrl, setSchoolLogoUrl] = useState('');
  const [schoolLogoFailed, setSchoolLogoFailed] = useState(false);
  const [currentYear, setCurrentYear] = useState('-');
  const [currentSemester, setCurrentSemester] = useState('-');
  const [expandedCategory, setExpandedCategory] = useState<CategoryKey | null>(null);

  useEffect(() => {
    setExpandedCategory(null);
  }, [pathname]);

  useEffect(() => {
    let active = true;
    window.electron?.getAppVersion?.().then(version => {
      if (active) setAppVersion(version);
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const loadHeaderData = async () => {
      try {
        const [receiptRes, yearRes, semesterRes] = await Promise.all([
          api.get<ApiEnvelope<ReceiptSettings>>('/finance/receipt-settings'),
          api.get<ApiEnvelope<AcademicYear[]>>('/academic-years'),
          api.get<ApiEnvelope<Semester[]>>('/semesters'),
        ]);

        const years = yearRes.data || [];
        const semesters = semesterRes.data || [];
        const currentAcademicYear =
          years.find((item) => item.is_current) || years[years.length - 1] || null;
        const semesterInCurrentYear = currentAcademicYear
          ? semesters
              .filter((item) => item.academic_year_id === currentAcademicYear.id)
              .sort((a, b) => Number(b.semester) - Number(a.semester))[0]
          : null;

        setSchoolName(receiptRes.data?.school_name || 'E-System School');
        setSchoolLogoUrl(receiptRes.data?.school_logo_url || '');
        setSchoolLogoFailed(false);
        setCurrentYear(currentAcademicYear?.year || '-');
        setCurrentSemester(semesterInCurrentYear?.semester || '-');
      } catch (error) {
        console.error('Failed to load top bar data:', error);
      }
    };

    void loadHeaderData();
  }, []);

  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('th-TH', {
        dateStyle: 'long',
      }).format(new Date()),
    [],
  );

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      clearCurrentOperator(window.localStorage);
      emitCurrentOperatorChange();
    }
    router.push('/dashboard');
  };

  const handleToggleCategory = (category: CategoryKey) => {
    setExpandedCategory((current) => (current === category ? null : category));
  };

  return (
    <header className="sticky top-0 z-30 border-b border-sky-200 bg-white shadow-sm">
      <div className="bg-sky-50 px-4 py-4">
        <div className="mx-auto flex max-w-[1440px] items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-sky-100 bg-white shadow-sm">
              {schoolLogoUrl && !schoolLogoFailed ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={schoolLogoUrl}
                  alt="ตราโรงเรียน"
                  className="h-16 w-16 object-contain"
                  onError={() => setSchoolLogoFailed(true)}
                />
              ) : (
                <HiOutlineBuildingOffice2 size={38} className="text-sky-700" />
              )}
            </div>
            <div>
              <div className="text-2xl font-bold leading-tight text-sky-900">
                ระบบบริหารจัดการสารสนเทศโรงเรียน
              </div>
              <div className="mt-1 text-[2rem] font-medium leading-tight text-slate-900">
                {schoolName}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-lg text-slate-600">
                E-System School
                {appVersion && <span className="rounded border border-sky-200 bg-white px-2 py-0.5 text-xs font-semibold text-sky-800" aria-label={`เวอร์ชันโปรแกรม ${appVersion}`}>เวอร์ชัน {appVersion}</span>}
              </div>
            </div>
          </div>

          <div className="flex min-w-[360px] flex-col items-end gap-2 pt-1 text-right">
            <div className="flex items-center gap-3">
              <button className="relative rounded-md p-1 text-sky-900 hover:bg-white/80">
                <HiOutlineBell size={20} />
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1 rounded-md bg-sky-700 px-3 py-1.5 text-sm font-bold text-white hover:bg-sky-800"
              >
                <HiArrowRightOnRectangle size={16} />
                ออกจากระบบ
              </button>
            </div>

            <div className="text-sm text-slate-700">
              <span className="font-bold text-sky-800">{operator.name}</span>
              <span> [ {operator.role} ]</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <HiOutlineCalendarDays size={16} className="text-sky-700" />
              <span>{todayLabel}</span>
              <span>|</span>
              <span>ภาคเรียนที่ {currentSemester}</span>
              <span>ปีการศึกษา {currentYear}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-4 py-4">
        <TopCategoryTabs
          activeCategory={activeCategory}
          expandedCategory={expandedCategory}
          onToggle={handleToggleCategory}
        />

        {expandedCategory && <MenuPanel columns={getMenuColumns(expandedCategory)} />}

        {!isHomePage && !landingPage && (
          <div className="flex items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.href + index} className="flex items-center gap-2">
                  {index > 0 && <span className="text-slate-300">/</span>}
                  <Link
                    href={crumb.href}
                    className={`${
                      index === breadcrumbs.length - 1
                        ? 'font-bold text-slate-900'
                        : 'text-slate-500 hover:text-sky-700'
                    }`}
                  >
                    {crumb.label}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
