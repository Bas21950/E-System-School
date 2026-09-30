'use client';

import { useState, ReactNode } from 'react';
import { HiOutlineChevronDown, HiOutlineChevronRight } from 'react-icons/hi2';
import { IconType } from 'react-icons';

interface MenuGroupProps {
  label: string;
  icon: IconType;
  children: ReactNode;
  initiallyOpen?: boolean;
  active?: boolean;
}

export default function MenuGroup({
  label,
  icon: Icon,
  children,
  initiallyOpen = false,
  active = false,
}: MenuGroupProps) {
  const [isOpen, setIsOpen] = useState(initiallyOpen);

  return (
    <div className="mb-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          group flex w-full items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors
          ${active ? 'bg-slate-100 text-sky-900' : 'text-slate-700 hover:bg-slate-50'}
        `}
      >
        <Icon size={18} className={active ? 'text-sky-700' : 'text-slate-500'} />
        <span className="flex-1 text-left font-bold">{label}</span>
        {isOpen ? (
          <HiOutlineChevronDown size={14} className="text-slate-400" />
        ) : (
          <HiOutlineChevronRight size={14} className="text-slate-400" />
        )}
      </button>

      {isOpen && (
        <div className="mt-1 ml-3 border-l border-slate-200 pl-2 space-y-1 animate-slide-down">
          {children}
        </div>
      )}
    </div>
  );
}
